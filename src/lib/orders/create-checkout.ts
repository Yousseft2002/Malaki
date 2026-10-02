import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { hasCapacity } from "@/lib/domain/capacity";
import { addDays, todayIn, toUtcDate } from "@/lib/domain/dates";
import { type CartLine, priceCart } from "@/lib/domain/pricing";
import { DATE_REJECTION_MESSAGES, checkDeliveryDate, ruleServes, shippingCost } from "@/lib/domain/shipping";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getStoreSettings, loadPricingCatalog } from "@/lib/queries/catalog";
import { getActiveShippingRules, loadCapacityInputs } from "@/lib/queries/shipping";
import { SITE_URL, STORE_CURRENCY } from "@/lib/store-config";
import { getStripe } from "@/lib/stripe";
import type { Attribution } from "@/lib/analytics/track";
import type { CartLineInput, CheckoutDetails } from "@/lib/validation/schemas";
import { generateOrderNumber } from "./order-number";
import { buildStripeLineItems, lineItemsTotal } from "./stripe-line-items";

export type CheckoutResult =
  | { ok: true; url: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
      lineErrors?: Record<number, string[]>;
    };

const fail = (message: string, extra: Omit<Extract<CheckoutResult, { ok: false }>, "ok" | "message"> = {}): CheckoutResult => ({
  ok: false,
  message,
  ...extra,
});

class CapacityTakenError extends Error {}

/**
 * Validate and price the cart on the server, reserve production capacity,
 * create a PENDING_PAYMENT order and a Stripe Checkout Session for it.
 * The order is only marked paid later, by the verified webhook.
 * `attribution` (from the ad-attribution cookie) is only stored on the order.
 */
export async function createCheckout(lines: CartLineInput[], details: CheckoutDetails, attribution: Attribution | null = null): Promise<CheckoutResult> {
  const config = env();
  const [catalog, settings, rules] = await Promise.all([
    loadPricingCatalog(lines.map((l) => l.variantId)),
    getStoreSettings(),
    getActiveShippingRules(),
  ]);

  // 1. Price the cart from the database.
  const cartLines: CartLine[] = lines.map((l) => ({ ...l, giftWrap: l.giftWrap || details.giftWrapAll }));
  const priced = priceCart(cartLines, catalog, { giftWrapPriceCents: settings.giftWrapPriceCents });
  if (!priced.ok) {
    const lineErrors: Record<number, string[]> = {};
    for (const e of priced.errors) if (e.lineIndex !== null) (lineErrors[e.lineIndex] ??= []).push(e.message);
    return fail(priced.errors[0]?.message ?? "Please review your bag.", { lineErrors });
  }

  // 2. Shipping rule, destination and price.
  const rule = rules.find((r) => r.id === details.shippingRuleId);
  if (!rule) return fail("Please choose a delivery option.", { fieldErrors: { shippingRuleId: ["Please choose a delivery option."] } });
  const address = rule.method === "DELIVERY" ? details.address : undefined;
  if (rule.method === "DELIVERY" && !address) {
    return fail("Please enter the delivery address.", { fieldErrors: { address: ["Please enter the delivery address."] } });
  }
  if (!ruleServes(rule, address ? { country: address.country, postalCode: address.postalCode } : null)) {
    return fail(`${rule.name} isn't available for this address.`, { fieldErrors: { shippingRuleId: [`${rule.name} isn't available for this address.`] } });
  }
  const shippingCents = shippingCost(rule, priced.subtotalCents);
  if (shippingCents === null) return fail(`${rule.name} isn't available yet. Please choose another option.`);

  // 3. Delivery date and production capacity.
  const today = todayIn(config.STORE_TIMEZONE);
  const capacity = await loadCapacityInputs(today, addDays(today, rule.maxDaysAhead), config.CHECKOUT_HOLD_MINUTES);
  const dateCheck = checkDeliveryDate(rule, details.deliveryDate, {
    today,
    hasPerishables: priced.hasPerishables,
    units: priced.units,
    capacity,
  });
  if (!dateCheck.ok || !dateCheck.dispatchDate) {
    const msg = DATE_REJECTION_MESSAGES[dateCheck.reason ?? "INVALID_DATE"];
    return fail(msg, { fieldErrors: { deliveryDate: [msg] } });
  }
  const dispatchDate = dateCheck.dispatchDate;

  const totalCents = priced.subtotalCents + priced.giftWrapCents + shippingCents;
  const lineItems = buildStripeLineItems(priced, { name: rule.name, cents: shippingCents }, STORE_CURRENCY);
  if (lineItemsTotal(lineItems) !== totalCents) {
    logger.error("checkout.total_mismatch", { totalCents, lineItemsTotal: lineItemsTotal(lineItems) });
    return fail("Something went wrong preparing your order. Please try again.");
  }

  // 4. Create the order while holding a per-day lock, so two buyers can't take the last slot.
  let order: { id: string; number: string };
  try {
    order = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"capacity:" + dispatchDate}))`;
      const fresh = await loadCapacityInputs(dispatchDate, dispatchDate, config.CHECKOUT_HOLD_MINUTES, tx);
      if (!hasCapacity(dispatchDate, priced.units, fresh)) throw new CapacityTakenError();

      const customer = await tx.customer.upsert({
        where: { email: details.buyerEmail },
        update: { name: details.buyerName, phone: details.buyerPhone ?? undefined },
        create: { email: details.buyerEmail, name: details.buyerName, phone: details.buyerPhone },
      });

      for (let attempt = 0; ; attempt++) {
        const number = generateOrderNumber();
        if (attempt < 5 && (await tx.order.findUnique({ where: { number }, select: { id: true } }))) continue;
        return tx.order.create({
          select: { id: true, number: true },
          data: {
            number,
            customerId: customer.id,
            buyerName: details.buyerName,
            buyerEmail: details.buyerEmail,
            buyerPhone: details.buyerPhone,
            fulfilment: rule.method,
            shippingRuleId: rule.id,
            shippingRuleName: rule.name,
            dispatchDate: toUtcDate(dispatchDate),
            addressLine1: address?.addressLine1,
            addressLine2: address?.addressLine2,
            city: address?.city,
            region: address?.region,
            postalCode: address?.postalCode,
            country: address?.country,
            currency: STORE_CURRENCY,
            subtotalCents: priced.subtotalCents,
            giftWrapCents: priced.giftWrapCents,
            shippingCents,
            totalCents,
            capacityUnits: priced.units,
            utmSource: attribution?.utmSource,
            utmMedium: attribution?.utmMedium,
            utmCampaign: attribution?.utmCampaign,
            fbclid: attribution?.fbclid,
            items: {
              create: priced.lines.map((l) => ({
                productId: l.productId,
                variantId: l.variantId,
                productName: l.productName,
                variantName: l.variantName,
                unitPriceCents: l.unitPriceCents,
                quantity: l.quantity,
                lineTotalCents: l.lineTotalCents,
                giftWrap: l.giftWrap,
                giftNote: l.giftNote,
                boxContents: l.boxContents ? (l.boxContents as unknown as Prisma.InputJsonArray) : undefined,
              })),
            },
            giftOptions: {
              create: {
                giftWrap: priced.lines.some((l) => l.giftWrap),
                note: details.giftNote || undefined,
                recipientName: details.recipientName,
                recipientPhone: details.recipientPhone,
                deliveryDate: toUtcDate(details.deliveryDate),
              },
            },
          },
        });
      }
    });
  } catch (err) {
    if (err instanceof CapacityTakenError) {
      const msg = DATE_REJECTION_MESSAGES.FULLY_BOOKED;
      return fail(msg, { fieldErrors: { deliveryDate: [msg] } });
    }
    throw err;
  }

  // 5. Stripe Checkout Session (hosted payment page).
  try {
    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: lineItems,
        customer_email: details.buyerEmail,
        client_reference_id: order.id,
        metadata: { orderId: order.id, orderNumber: order.number },
        payment_intent_data: { metadata: { orderId: order.id, orderNumber: order.number } },
        expires_at: Math.floor(Date.now() / 1000) + config.CHECKOUT_HOLD_MINUTES * 60,
        success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/checkout?cancelled=1`,
      },
      { idempotencyKey: `checkout-${order.id}` },
    );
    if (!session.url) throw new Error("Stripe returned a session without a URL");
    await db.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: session.id } });
    logger.info("checkout.session_created", { orderId: order.id, orderNumber: order.number });
    return { ok: true, url: session.url };
  } catch (err) {
    logger.error("checkout.stripe_failed", { orderId: order.id, err });
    await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelledAt: new Date(), adminNote: "Stripe session could not be created" } });
    return fail("We couldn't connect to our payment provider. Please try again in a moment.");
  }
}
