"use client";

import { cartDrawer } from "@/lib/cart/drawer";
import { useCart } from "@/lib/cart/store";
import { CartDrawer } from "./cart-drawer";

export function CartButton() {
  const { count } = useCart();
  return (
    <>
      <button
        type="button"
        onClick={cartDrawer.open}
        aria-haspopup="dialog"
        aria-label={count > 0 ? `Shopping bag, ${count} item${count === 1 ? "" : "s"}` : "Shopping bag, empty"}
        className="relative -mr-3 inline-flex h-11 w-11 items-center justify-center text-ivory hover:text-gold"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path d="M5 8h14l-1.2 12H6.2L5 8z" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M9 8V6a3 3 0 016 0v2" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.7rem] font-semibold text-emerald-deep"
          >
            {count}
          </span>
        )}
      </button>
      <CartDrawer />
    </>
  );
}
