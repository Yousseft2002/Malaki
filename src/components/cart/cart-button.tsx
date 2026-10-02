"use client";

import { useEffect, useRef } from "react";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { BAG_ARRIVE_EVENT } from "@/components/motion/add-to-bag-feedback";
import { cartDrawer } from "@/lib/cart/drawer";
import { useCart } from "@/lib/cart/store";
import { CartDrawer } from "./cart-drawer";

/** Restart a CSS animation class on an element. */
function replay(el: HTMLElement | null, className: string) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth; // reflow so the animation starts again
  el.classList.add(className);
}

export function CartButton() {
  const { count } = useCart();
  const badge = useRef<HTMLSpanElement>(null);
  const icon = useRef<SVGSVGElement>(null);
  const ready = useRef(false);
  const last = useRef(count);

  // Ignore the first moments after load, when the saved cart is read from storage.
  useEffect(() => {
    const t = window.setTimeout(() => (ready.current = true), 400);
    return () => window.clearTimeout(t);
  }, []);

  // Spring bump whenever the quantity changes.
  useEffect(() => {
    if (ready.current && count !== last.current) replay(badge.current, "bump");
    last.current = count;
  }, [count]);

  // The bag gives a little nod when a gold piece lands in it.
  useEffect(() => {
    const onArrive = () => replay(icon.current as unknown as HTMLElement, "bump");
    window.addEventListener(BAG_ARRIVE_EVENT, onArrive);
    return () => window.removeEventListener(BAG_ARRIVE_EVENT, onArrive);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={cartDrawer.open}
        aria-haspopup="dialog"
        aria-label={count > 0 ? `Shopping bag, ${count} item${count === 1 ? "" : "s"}` : "Shopping bag, empty"}
        className="relative -mr-3 inline-flex h-11 w-11 items-center justify-center text-ivory transition-transform hover:text-gold active:scale-90"
      >
        <svg ref={icon} data-bag-target viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path d="M5 8h14l-1.2 12H6.2L5 8z" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M9 8V6a3 3 0 016 0v2" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        {count > 0 && (
          <span
            ref={badge}
            aria-hidden="true"
            className="absolute top-1 right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.7rem] font-semibold text-emerald-deep shadow-[0_2px_6px_-1px_color-mix(in_srgb,var(--color-emerald-deep)_60%,transparent)]"
          >
            <AnimatedCounter value={count} />
          </span>
        )}
      </button>
      <CartDrawer />
    </>
  );
}
