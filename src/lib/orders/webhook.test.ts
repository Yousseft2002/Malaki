import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { generateOrderNumber } from "./order-number";
import { buildStripeLineItems, lineItemsTotal } from "./stripe-line-items";
import { type EventLike, type WebhookDeps, handleStripeEvent } from "./webhook";

function fakeDeps(overrides: Partial<WebhookDeps> = {}) {
  const claimed = new Set<string>();
  const deps: WebhookDeps = {
    claimEvent: vi.fn(async (id: string) => {
      if (claimed.has(id)) return false;
      claimed.add(id);
      return true;
    }),
    releaseEvent: vi.fn(async (id: string) => {
      claimed.delete(id);
    }),
    markOrderPaid: vi.fn(async () => true),
    cancelPendingOrder: vi.fn(async () => {}),
    sendConfirmation: vi.fn(async () => {}),
    log: vi.fn(),
    ...overrides,
  };
  return deps;
}

const session = (over: Record<string, unknown> = {}) => ({
  id: "cs_test_1",
  payment_status: "paid",
  amount_total: 6500,
  currency: "eur",
  payment_intent: "pi_1",
  metadata: { orderId: "order_1" },
  ...over,
});

const event = (type: string, obj = session(), id = "evt_1"): EventLike => ({ id, type, data: { object: obj } });

describe("handleStripeEvent", () => {
  it("marks the order paid and sends confirmation on checkout.session.completed", async () => {
    const deps = fakeDeps();
    expect(await handleStripeEvent(event("checkout.session.completed"), deps)).toBe("paid");
    expect(deps.markOrderPaid).toHaveBeenCalledWith({
      orderId: "order_1",
      sessionId: "cs_test_1",
      paymentIntentId: "pi_1",
      amountTotal: 6500,
      currency: "eur",
    });
    expect(deps.sendConfirmation).toHaveBeenCalledWith("order_1");
  });

  it("is idempotent: a redelivered event is skipped", async () => {
    const deps = fakeDeps();
    await handleStripeEvent(event("checkout.session.completed"), deps);
    expect(await handleStripeEvent(event("checkout.session.completed"), deps)).toBe("duplicate");
    expect(deps.markOrderPaid).toHaveBeenCalledTimes(1);
    expect(deps.sendConfirmation).toHaveBeenCalledTimes(1);
  });

  it("does not email twice if a different event reports the same payment", async () => {
    const deps = fakeDeps({ markOrderPaid: vi.fn(async () => false) });
    expect(await handleStripeEvent(event("checkout.session.async_payment_succeeded", session(), "evt_2"), deps)).toBe("already_paid");
    expect(deps.sendConfirmation).not.toHaveBeenCalled();
  });

  it("waits for delayed payment methods instead of confirming unpaid sessions", async () => {
    const deps = fakeDeps();
    expect(await handleStripeEvent(event("checkout.session.completed", session({ payment_status: "unpaid" })), deps)).toBe(
      "awaiting_payment",
    );
    expect(deps.markOrderPaid).not.toHaveBeenCalled();
  });

  it("confirms when the delayed payment later succeeds", async () => {
    const deps = fakeDeps();
    expect(await handleStripeEvent(event("checkout.session.async_payment_succeeded", session(), "evt_3"), deps)).toBe("paid");
  });

  it("cancels pending orders on expiry or failed async payment", async () => {
    const deps = fakeDeps();
    expect(await handleStripeEvent(event("checkout.session.expired", session({ payment_status: "unpaid" })), deps)).toBe("cancelled");
    expect(await handleStripeEvent(event("checkout.session.async_payment_failed", session(), "evt_4"), deps)).toBe("cancelled");
    expect(deps.cancelPendingOrder).toHaveBeenCalledTimes(2);
  });

  it("ignores unrelated event types without claiming them", async () => {
    const deps = fakeDeps();
    expect(await handleStripeEvent(event("customer.created"), deps)).toBe("ignored");
    expect(deps.claimEvent).not.toHaveBeenCalled();
  });

  it("ignores sessions that aren't ours", async () => {
    const deps = fakeDeps();
    expect(await handleStripeEvent(event("checkout.session.completed", session({ metadata: {} })), deps)).toBe("no_order");
    expect(deps.markOrderPaid).not.toHaveBeenCalled();
  });

  it("releases the event on failure so Stripe's retry is processed", async () => {
    const deps = fakeDeps({
      markOrderPaid: vi.fn().mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce(true),
    });
    await expect(handleStripeEvent(event("checkout.session.completed"), deps)).rejects.toThrow("db down");
    expect(deps.releaseEvent).toHaveBeenCalledWith("evt_1");
    expect(await handleStripeEvent(event("checkout.session.completed"), deps)).toBe("paid");
  });
});

describe("Stripe signature verification", () => {
  const stripe = new Stripe("sk_test_dummy_key_for_unit_tests");
  const secret = "whsec_test_secret";
  const payload = JSON.stringify(event("checkout.session.completed"));

  it("accepts a correctly signed payload", () => {
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(stripe.webhooks.constructEvent(payload, header, secret).id).toBe("evt_1");
  });

  it("rejects a tampered payload or wrong secret", () => {
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(() => stripe.webhooks.constructEvent(payload.replace("6500", "1"), header, secret)).toThrow();
    expect(() => stripe.webhooks.constructEvent(payload, header, "whsec_other")).toThrow();
  });
});

describe("buildStripeLineItems", () => {
  const priced = {
    giftWrapCents: 500,
    lines: [
      {
        lineIndex: 0,
        variantId: "v",
        productId: "p",
        productName: "Build Your Own Box",
        variantName: "Box of 6",
        quantity: 2,
        unitPriceCents: 1400,
        lineTotalCents: 2800,
        giftWrap: true,
        isPerishable: true,
        boxContents: [{ boxItemId: "d", name: "Stuffed date", quantity: 6, unitPriceCents: 150 }],
      },
    ],
  };

  it("adds gift wrap and shipping lines and matches the order total", () => {
    const items = buildStripeLineItems(priced, { name: "Standard delivery", cents: 700 }, "EUR");
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      quantity: 2,
      price_data: { currency: "eur", unit_amount: 1400, product_data: { name: "Build Your Own Box — Box of 6", description: "6 × Stuffed date · Gift wrapped" } },
    });
    expect(lineItemsTotal(items)).toBe(2800 + 500 + 700);
  });

  it("omits zero-value gift wrap and free shipping", () => {
    const items = buildStripeLineItems({ ...priced, giftWrapCents: 0 }, { name: "Pickup", cents: 0 }, "EUR");
    expect(items).toHaveLength(1);
  });
});

describe("generateOrderNumber", () => {
  it("produces MLK- plus six unambiguous characters", () => {
    expect(generateOrderNumber()).toMatch(/^MLK-[2-9A-HJ-NP-Z]{6}$/);
    expect(generateOrderNumber(() => new Uint8Array([0, 1, 2, 3, 31, 32]))).toBe("MLK-2345Z2");
  });
});
