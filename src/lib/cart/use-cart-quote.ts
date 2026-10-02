"use client";

import { useEffect, useState } from "react";
import { type CartQuote, quoteCart } from "@/app/actions/cart";
import { cart, useCart } from "./store";
import { toCartLine } from "./types";

/**
 * Fetches server-side prices for the current cart whenever it changes and
 * refreshes the display price snapshots stored in the browser.
 */
export function useCartQuote() {
  const { items } = useCart();
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(items.map(toCartLine));

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    quoteCart(items.map(toCartLine))
      .then((q) => {
        if (cancelled) return;
        setQuote(q);
        setError(null);
        items.forEach((item, i) => {
          const price = q.unitPrices[i];
          if (price !== undefined && price !== item.unitPriceCents) cart.update(item.id, { unitPriceCents: price });
        });
      })
      .catch(() => !cancelled && setError("We couldn't check prices right now. Please refresh the page."));
    return () => {
      cancelled = true;
    };
    // `key` captures every field that affects the quote.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { items, quote: items.length ? quote : null, error };
}
