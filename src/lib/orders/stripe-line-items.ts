import type { PricedCart } from "@/lib/domain/pricing";

/** Minimal shape of a Stripe Checkout line item built from price_data. */
export interface StripeLineItem {
  quantity: number;
  price_data: {
    currency: string;
    unit_amount: number;
    product_data: { name: string; description?: string };
  };
}

/**
 * Turn an already-priced cart into Stripe line items. The sum of
 * unit_amount × quantity always equals the order total we stored.
 */
export function buildStripeLineItems(
  priced: Pick<PricedCart, "lines" | "giftWrapCents">,
  shipping: { name: string; cents: number },
  currency: string,
): StripeLineItem[] {
  const cur = currency.toLowerCase();
  const items: StripeLineItem[] = priced.lines.map((l) => {
    const details = [
      l.boxContents?.map((p) => `${p.quantity} × ${p.name}`).join(", "),
      l.giftWrap ? "Gift wrapped" : undefined,
    ].filter(Boolean);
    return {
      quantity: l.quantity,
      price_data: {
        currency: cur,
        unit_amount: l.unitPriceCents,
        product_data: {
          name: `${l.productName} — ${l.variantName}`.slice(0, 250),
          ...(details.length ? { description: details.join(" · ").slice(0, 500) } : {}),
        },
      },
    };
  });
  if (priced.giftWrapCents > 0) {
    items.push({ quantity: 1, price_data: { currency: cur, unit_amount: priced.giftWrapCents, product_data: { name: "Gift wrapping" } } });
  }
  if (shipping.cents > 0) {
    items.push({ quantity: 1, price_data: { currency: cur, unit_amount: shipping.cents, product_data: { name: shipping.name } } });
  }
  return items;
}

export function lineItemsTotal(items: StripeLineItem[]): number {
  return items.reduce((sum, i) => sum + i.price_data.unit_amount * i.quantity, 0);
}
