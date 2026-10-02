"use server";

import { priceCart } from "@/lib/domain/pricing";
import { logger } from "@/lib/logger";
import { getStoreSettings, loadPricingCatalog } from "@/lib/queries/catalog";
import { type CartLineInput, cartSchema } from "@/lib/validation/schemas";

export type CartQuote = {
  ok: boolean;
  subtotalCents: number;
  giftWrapCents: number;
  units: number;
  hasPerishables: boolean;
  unitPrices: Record<number, number>;
  lineErrors: Record<number, string[]>;
  errors: string[];
};

/** Authoritative prices and availability for the browser cart. */
export async function quoteCart(lines: CartLineInput[]): Promise<CartQuote> {
  const parsed = cartSchema.safeParse(lines);
  if (!parsed.success) {
    return {
      ok: false,
      subtotalCents: 0,
      giftWrapCents: 0,
      units: 0,
      hasPerishables: false,
      unitPrices: {},
      lineErrors: {},
      errors: ["Your bag is empty or contains invalid items."],
    };
  }
  try {
    const [catalog, settings] = await Promise.all([
      loadPricingCatalog(parsed.data.map((l) => l.variantId)),
      getStoreSettings(),
    ]);
    const priced = priceCart(parsed.data, catalog, { giftWrapPriceCents: settings.giftWrapPriceCents });
    const lineErrors: Record<number, string[]> = {};
    const errors: string[] = [];
    for (const e of priced.errors) {
      if (e.lineIndex === null) errors.push(e.message);
      else (lineErrors[e.lineIndex] ??= []).push(e.message);
    }
    return {
      ok: priced.ok,
      subtotalCents: priced.subtotalCents,
      giftWrapCents: priced.giftWrapCents,
      units: priced.units,
      hasPerishables: priced.hasPerishables,
      unitPrices: Object.fromEntries(priced.lines.map((l) => [l.lineIndex, l.unitPriceCents])),
      lineErrors,
      errors,
    };
  } catch (err) {
    logger.error("cart.quote_failed", { err });
    throw new Error("We couldn't check your bag right now. Please try again.");
  }
}
