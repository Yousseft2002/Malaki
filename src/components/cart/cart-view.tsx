"use client";

import { ButtonLink } from "@/components/ui/button";
import { GiftBoxScene } from "@/components/ui/gift-box-scene";
import { Price } from "@/components/ui/price";
import { useCartQuote } from "@/lib/cart/use-cart-quote";
import { AnimatedCartList } from "./animated-cart-list";
import { CartLineItem } from "./cart-line";

export function CartView() {
  const { items, quote, error } = useCartQuote();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <GiftBoxScene variant="empty" className="mb-6 scale-75" />
          <p className="font-display text-xl text-emerald">Your bag is empty</p>
        <ButtonLink href="/collections/gift-boxes" variant="outline">
          Shop gift boxes
        </ButtonLink>
      </div>
    );
  }

  const blocked = !quote || !quote.ok;

  return (
    <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
      <AnimatedCartList
        items={items}
        className="divide-y divide-sand overflow-x-hidden border-y border-sand"
        renderItem={(item, i) => (
          <>
            <CartLineItem item={item} />
            {quote?.lineErrors[i]?.map((msg) => (
              <p key={msg} role="alert" className="-mt-2 pb-4 text-sm text-error">
                {msg}
              </p>
            ))}
          </>
        )}
      />

      <aside aria-labelledby="summary-title" className="h-fit bg-sand p-6">
        <h2 id="summary-title" className="eyebrow mb-5 text-emerald">
          Order summary
        </h2>
        <dl className="grid grid-cols-[1fr_auto] gap-y-2">
          <dt>Subtotal</dt>
          <dd className="text-right">{quote ? <Price cents={quote.subtotalCents} /> : "…"}</dd>
          {quote && quote.giftWrapCents > 0 && (
            <>
              <dt>Gift wrapping</dt>
              <dd className="text-right">
                <Price cents={quote.giftWrapCents} />
              </dd>
            </>
          )}
          <dt className="text-muted">Delivery</dt>
          <dd className="text-right text-muted">At checkout</dd>
        </dl>
        {[...(quote?.errors ?? []), ...(error ? [error] : [])].map((msg) => (
          <p key={msg} role="alert" className="mt-4 text-sm text-error">
            {msg}
          </p>
        ))}
        {blocked ? (
          <span aria-disabled="true" className="mt-6 flex min-h-11 w-full cursor-not-allowed items-center justify-center bg-emerald/50 px-6 text-xs tracking-[0.2em] text-ivory uppercase">
            Checkout
          </span>
        ) : (
          <ButtonLink href="/checkout" className="mt-6 w-full" arrow>
            Checkout
          </ButtonLink>
        )}
        {quote && !quote.ok && <p className="mt-3 text-sm text-muted">Please resolve the items above to continue.</p>}
      </aside>
    </div>
  );
}
