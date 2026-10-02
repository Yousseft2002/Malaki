"use client";

import { Price } from "@/components/ui/price";
import type { CartQuote } from "@/app/actions/cart";
import type { CartItem } from "@/lib/cart/types";
import { type PublicRule, displayShipping } from "./delivery-options";

export function OrderSummary({
  items,
  quote,
  rule,
  giftWrapCents,
  pending,
  canSubmit,
}: {
  items: CartItem[];
  quote: CartQuote | null;
  rule: PublicRule | null;
  giftWrapCents: number | null;
  pending: boolean;
  canSubmit: boolean;
}) {
  const shipping = rule ? displayShipping(rule, quote?.subtotalCents ?? null) : null;
  const total = quote && shipping !== null ? quote.subtotalCents + (giftWrapCents ?? 0) + shipping : null;

  return (
    <aside aria-labelledby="order-summary-title" className="h-fit bg-sand p-6 lg:sticky lg:top-28">
      <h2 id="order-summary-title" className="eyebrow mb-5 text-emerald">
        Order summary
      </h2>
      <ul className="mb-5 divide-y divide-[#d8ccb0]">
        {items.map((item, i) => (
          <li key={item.id} className="py-3 text-sm">
            <div className="flex justify-between gap-3">
              <span>
                {item.quantity} × {item.productName}
                <span className="block text-muted">{item.variantName}</span>
              </span>
              <Price cents={quote?.unitPrices[i] !== undefined ? quote.unitPrices[i]! * item.quantity : null} />
            </div>
            {quote?.lineErrors[i]?.map((m) => (
              <p key={m} className="mt-1 text-error">
                {m}
              </p>
            ))}
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-[1fr_auto] gap-y-2 border-t border-[#d8ccb0] pt-4">
        <dt>Subtotal</dt>
        <dd className="text-right">{quote ? <Price cents={quote.subtotalCents} /> : "…"}</dd>
        <dt>Gift wrapping</dt>
        <dd className="text-right">{giftWrapCents === null ? "…" : giftWrapCents > 0 ? <Price cents={giftWrapCents} /> : "—"}</dd>
        <dt>{rule?.name ?? "Delivery"}</dt>
        <dd className="text-right">{shipping === 0 ? "Free" : <Price cents={shipping} />}</dd>
        <dt className="mt-2 font-display text-xl text-emerald">Total</dt>
        <dd className="mt-2 text-right font-display text-xl text-emerald">
          <Price cents={total} />
        </dd>
      </dl>
      {quote?.errors.map((m) => (
        <p key={m} role="alert" className="mt-3 text-sm text-error">
          {m}
        </p>
      ))}
      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center bg-emerald px-6 text-xs font-medium tracking-[0.2em] text-ivory uppercase hover:bg-emerald-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Preparing secure payment…" : "Continue to payment"}
      </button>
      <p className="mt-3 text-center text-xs text-muted">Payment is processed securely by Stripe.</p>
    </aside>
  );
}
