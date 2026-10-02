"use client";

import Link from "next/link";
import { Price } from "@/components/ui/price";
import { ProductImage } from "@/components/ui/product-image";
import { cartDrawer } from "@/lib/cart/drawer";
import { type CartItem, cart } from "@/lib/cart/store";
import { QuantityStepper } from "./quantity-stepper";

export function CartLineItem({ item, compact = false }: { item: CartItem; compact?: boolean }) {
  const href = item.box ? "/build-your-own-box" : `/products/${item.productSlug}`;
  return (
    <article className="flex gap-4 py-5" aria-label={`${item.productName}, ${item.variantName}`}>
      <Link href={href} onClick={cartDrawer.close} className={`shrink-0 ${compact ? "w-20" : "w-24 sm:w-28"}`} tabIndex={-1} aria-hidden="true">
        <ProductImage url={item.imageUrl} alt={item.imageAlt} sizes="112px" className="aspect-square w-full" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-lg leading-snug text-emerald">
              <Link href={href} onClick={cartDrawer.close} className="link-gold link-gold-accent">
                {item.productName}
              </Link>
            </h3>
            <p className="text-sm text-muted">{item.variantName}</p>
          </div>
          <Price cents={item.unitPriceCents === null ? null : item.unitPriceCents * item.quantity} className="shrink-0 text-emerald" />
        </div>

        {item.box && (
          <p className="text-sm text-muted">
            <span className="sr-only">Contents: </span>
            {item.box.summary.join(", ")}
          </p>
        )}
        {item.giftWrap && <p className="text-sm text-gold-ink">Gift wrapped</p>}
        {item.giftNote && <p className="text-sm text-muted italic">“{item.giftNote}”</p>}

        <div className="mt-2 flex items-center justify-between gap-3">
          <QuantityStepper
            value={item.quantity}
            onChange={(q) => cart.setQuantity(item.id, q)}
            label={`Quantity of ${item.productName}`}
          />
          <button
            type="button"
            onClick={() => cart.remove(item.id)}
            className="link-inline min-h-11 px-2 text-sm text-muted transition-[color,transform] hover:text-emerald active:scale-95"
          >
            Remove<span className="sr-only"> {item.productName}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
