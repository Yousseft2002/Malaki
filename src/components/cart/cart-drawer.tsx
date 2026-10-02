"use client";

import { ButtonLink } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { CloseButton, Sheet } from "@/components/ui/sheet";
import { cartDrawer, useCartDrawer } from "@/lib/cart/drawer";
import { useCart } from "@/lib/cart/store";
import { CartLineItem } from "./cart-line";

export function CartDrawer() {
  const open = useCartDrawer();
  const { items, subtotalCents } = useCart();

  return (
    <Sheet open={open} onClose={cartDrawer.close} side="right" label="Shopping bag">
      <div className="flex items-center justify-between border-b border-sand px-5 py-2">
        <h2 className="font-display text-xl text-emerald">Your bag</h2>
        <CloseButton onClick={cartDrawer.close} label="Close bag" />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="text-muted">Your bag is empty.</p>
          <ButtonLink href="/collections/gift-boxes" variant="outline" onClick={cartDrawer.close}>
            Shop gift boxes
          </ButtonLink>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-sand overflow-y-auto px-5">
            {items.map((item) => (
              <li key={item.id}>
                <CartLineItem item={item} compact />
              </li>
            ))}
          </ul>
          <div className="border-t border-sand px-5 py-5">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="eyebrow text-emerald">Subtotal</span>
              <Price cents={subtotalCents} className="font-display text-xl text-emerald" />
            </div>
            <p className="mb-4 text-sm text-muted">Delivery and gift wrapping are calculated at checkout.</p>
            <div className="grid gap-3">
              <ButtonLink href="/checkout" onClick={cartDrawer.close}>
                Checkout
              </ButtonLink>
              <ButtonLink href="/cart" variant="outline" onClick={cartDrawer.close}>
                View bag
              </ButtonLink>
            </div>
          </div>
        </>
      )}
    </Sheet>
  );
}
