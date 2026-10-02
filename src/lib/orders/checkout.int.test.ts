// Integration test: real Prisma + Postgres, Stripe mocked. Run with
// `npm run test:integration` against a disposable development database.

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

type SessionCreate = (params: Record<string, unknown>, opts?: unknown) => Promise<{ id: string; url: string }>;
const stripeCreate = vi.fn<SessionCreate>(async () => ({
  id: `cs_test_${Math.random().toString(36).slice(2)}`,
  url: "https://checkout.stripe.test/session",
}));
vi.mock("@/lib/stripe", () => ({ getStripe: () => ({ checkout: { sessions: { create: stripeCreate } } }) }));

const { db } = await import("@/lib/db");
const { createCheckout } = await import("./create-checkout");
const { handleStripeEvent } = await import("./webhook");
const { webhookDeps } = await import("./fulfilment");
const { addDays, todayIn, toUtcDate } = await import("@/lib/domain/dates");
const { checkoutDetailsSchema } = await import("@/lib/validation/schemas");

const TAG = `it-${Date.now()}`;
const EMAIL = `${TAG}@example.test`;
const today = todayIn(process.env.STORE_TIMEZONE || "UTC");
const deliveryDate = addDays(today, 3);
let variantId = "";
let ruleId = "";

const details = (over: Record<string, unknown> = {}) =>
  checkoutDetailsSchema.parse({
  buyerName: "Test Buyer",
  buyerEmail: EMAIL,
  shippingRuleId: ruleId,
  deliveryDate,
  recipientName: "Test Recipient",
  address: { addressLine1: "1 Test Street", city: "London", postalCode: "SW1A 1AA", country: "GB" },
  giftWrapAll: false,
  giftNote: "Congratulations!",
  acceptTerms: true,
  ...over,
  });

beforeAll(async () => {
  const product = await db.product.create({
    data: {
      slug: `${TAG}-product`,
      name: "Integration Box",
      variants: { create: { sku: `${TAG}-sku`, name: "Box of 12", priceCents: 1000, stock: 10 } },
    },
    include: { variants: true },
  });
  variantId = product.variants[0]!.id;
  const rule = await db.shippingRule.create({
    data: {
      name: `${TAG} delivery`,
      method: "DELIVERY",
      countries: ["GB"],
      flatRateCents: 500,
      perishableShipDays: [0, 1, 2, 3, 4, 5, 6],
      shipDays: [0, 1, 2, 3, 4, 5, 6],
      transitDays: 0,
      leadTimeDays: 0,
      maxDaysAhead: 30,
    },
  });
  ruleId = rule.id;
  // Limit the dispatch day to 2 units so we can fill it.
  await db.productionCapacity.upsert({
    where: { date: toUtcDate(deliveryDate) },
    update: { capacityUnits: 2, note: TAG },
    create: { date: toUtcDate(deliveryDate), capacityUnits: 2, note: TAG },
  });
});

afterAll(async () => {
  const orders = await db.order.findMany({ where: { buyerEmail: EMAIL }, select: { id: true } });
  await db.order.deleteMany({ where: { id: { in: orders.map((o) => o.id) } } });
  await db.customer.deleteMany({ where: { email: EMAIL } });
  await db.webhookEvent.deleteMany({ where: { id: { startsWith: `evt_${TAG}` } } });
  await db.productionCapacity.deleteMany({ where: { note: TAG } });
  await db.shippingRule.deleteMany({ where: { id: ruleId } });
  await db.product.deleteMany({ where: { slug: `${TAG}-product` } });
  await db.$disconnect();
});

describe("checkout → webhook (integration)", () => {
  let orderId = "";
  let sessionId = "";

  it("creates a pending order priced on the server and a Stripe session", async () => {
    const result = await createCheckout([{ variantId, quantity: 2, giftWrap: false }], details());
    expect(result).toEqual({ ok: true, url: "https://checkout.stripe.test/session" });

    const order = await db.order.findFirstOrThrow({ where: { buyerEmail: EMAIL }, include: { items: true, giftOptions: true } });
    orderId = order.id;
    sessionId = order.stripeCheckoutSessionId!;
    expect(order).toMatchObject({ status: "PENDING_PAYMENT", subtotalCents: 2000, shippingCents: 500, totalCents: 2500, capacityUnits: 2 });
    expect(order.giftOptions).toMatchObject({ recipientName: "Test Recipient", note: "Congratulations!" });

    const params = stripeCreate.mock.calls[0]![0] as { line_items: { quantity: number; price_data: { unit_amount: number } }[]; metadata: Record<string, string> };
    expect(params.metadata.orderId).toBe(order.id);
    expect(params.line_items.reduce((s, l) => s + l.price_data.unit_amount * l.quantity, 0)).toBe(2500);
  });

  it("blocks a date once pending orders fill its capacity", async () => {
    const result = await createCheckout([{ variantId, quantity: 1, giftWrap: false }], details());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.deliveryDate?.[0]).toMatch(/fully booked/i);
  });

  it("rejects addresses the rule doesn't serve", async () => {
    const result = await createCheckout(
      [{ variantId, quantity: 1, giftWrap: false }],
      details({ deliveryDate: addDays(today, 4), address: { addressLine1: "1 Rue", city: "Paris", postalCode: "75001", country: "FR" } }),
    );
    expect(result.ok).toBe(false);
  });

  it("marks the order paid once, decrements stock, and ignores redelivery", async () => {
    const event = {
      id: `evt_${TAG}_paid`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: sessionId,
          payment_status: "paid",
          amount_total: 2500,
          currency: "eur",
          payment_intent: "pi_test",
          metadata: { orderId },
        },
      },
    };
    expect(await handleStripeEvent(event, webhookDeps)).toBe("paid");
    expect(await handleStripeEvent(event, webhookDeps)).toBe("duplicate");

    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe("PAID");
    expect(order.paidAt).not.toBeNull();
    expect(order.confirmationEmailAt).not.toBeNull();
    expect((await db.variant.findUniqueOrThrow({ where: { id: variantId } })).stock).toBe(8);
  });

  it("cancels a pending order when its session expires", async () => {
    const result = await createCheckout([{ variantId, quantity: 1, giftWrap: false }], details({ deliveryDate: addDays(today, 5) }));
    expect(result.ok).toBe(true);
    const pending = await db.order.findFirstOrThrow({ where: { buyerEmail: EMAIL, status: "PENDING_PAYMENT" } });
    const outcome = await handleStripeEvent(
      {
        id: `evt_${TAG}_expired`,
        type: "checkout.session.expired",
        data: { object: { id: pending.stripeCheckoutSessionId, payment_status: "unpaid", amount_total: 1500, currency: "eur", payment_intent: null, metadata: { orderId: pending.id } } },
      },
      webhookDeps,
    );
    expect(outcome).toBe("cancelled");
    expect((await db.order.findUniqueOrThrow({ where: { id: pending.id } })).status).toBe("CANCELLED");
  });
});
