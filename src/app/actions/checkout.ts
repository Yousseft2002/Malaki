"use server";

import { headers } from "next/headers";
import { addDays, todayIn } from "@/lib/domain/dates";
import { priceCart } from "@/lib/domain/pricing";
import { type DateOption, availableDeliveryDates } from "@/lib/domain/shipping";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { type CheckoutResult, createCheckout } from "@/lib/orders/create-checkout";
import { getStoreSettings, loadPricingCatalog } from "@/lib/queries/catalog";
import { getActiveShippingRules, loadCapacityInputs } from "@/lib/queries/shipping";
import { LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";
import { type CartLineInput, cartSchema, checkoutRequestSchema } from "@/lib/validation/schemas";

/** Bookable delivery dates for a shipping option and the current cart. */
export async function getDeliveryDates(ruleId: string, lines: CartLineInput[]): Promise<{ dates: DateOption[]; error?: string }> {
  const parsed = cartSchema.safeParse(lines);
  if (!parsed.success) return { dates: [], error: "Your bag is empty." };
  try {
    const [rules, catalog, settings] = await Promise.all([
      getActiveShippingRules(),
      loadPricingCatalog(parsed.data.map((l) => l.variantId)),
      getStoreSettings(),
    ]);
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return { dates: [], error: "Please choose a delivery option." };
    const priced = priceCart(parsed.data, catalog, { giftWrapPriceCents: settings.giftWrapPriceCents });
    const config = env();
    const today = todayIn(config.STORE_TIMEZONE);
    const capacity = await loadCapacityInputs(today, addDays(today, rule.maxDaysAhead), config.CHECKOUT_HOLD_MINUTES);
    const dates = availableDeliveryDates(rule, {
      today,
      hasPerishables: priced.hasPerishables,
      units: Math.max(priced.units, 1),
      capacity,
    });
    return { dates };
  } catch (err) {
    logger.error("checkout.dates_failed", { err });
    return { dates: [], error: "We couldn't load available dates. Please try again." };
  }
}

export async function startCheckout(input: unknown): Promise<CheckoutResult> {
  const ip = clientIp(await headers());
  const limit = rateLimit(`checkout:${ip}`, LIMITS.checkout);
  if (!limit.ok) return { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };

  const parsed = checkoutRequestSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.slice(issue.path[0] === "details" ? 1 : 0).join(".");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors };
  }

  try {
    return await createCheckout(parsed.data.lines, parsed.data.details);
  } catch (err) {
    logger.error("checkout.failed", { err });
    return { ok: false, message: "Something went wrong. Your card has not been charged — please try again." };
  }
}
