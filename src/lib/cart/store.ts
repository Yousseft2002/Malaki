"use client";

// Browser cart persisted in localStorage, shared across tabs. It holds IDs and
// choices plus display snapshots; the server re-prices everything at checkout.

import { useSyncExternalStore } from "react";
import type { BoxSelection } from "@/lib/domain/box";
import { MAX_LINE_QUANTITY } from "@/lib/domain/pricing";
import { type CartItem, cartItemSchema, sameConfiguration } from "./types";

const KEY = "malaki.cart.v1";
const EMPTY: CartItem[] = [];

let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return cachedItems;
  }
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedItems = Array.isArray(parsed)
      ? parsed.flatMap((item) => {
          const r = cartItemSchema.safeParse(item);
          return r.success ? [r.data] : [];
        })
      : EMPTY;
  } catch {
    cachedItems = EMPTY;
  }
  return cachedItems;
}

function write(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage full or blocked (private mode): keep working in memory.
    cachedRaw = null;
    cachedItems = items;
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const clamp = (n: number) => Math.min(Math.max(Math.round(n), 1), MAX_LINE_QUANTITY);

export const cart = {
  add(item: Omit<CartItem, "id">) {
    const items = read();
    const existing = items.find((i) => sameConfiguration(i, item));
    if (existing) {
      write(items.map((i) => (i === existing ? { ...i, quantity: clamp(i.quantity + item.quantity) } : i)));
    } else {
      write([...items, { ...item, quantity: clamp(item.quantity), id: crypto.randomUUID() }]);
    }
  },
  setQuantity(id: string, quantity: number) {
    write(read().map((i) => (i.id === id ? { ...i, quantity: clamp(quantity) } : i)));
  },
  update(id: string, patch: Partial<Pick<CartItem, "giftWrap" | "giftNote" | "unitPriceCents">>) {
    write(read().map((i) => (i.id === id ? { ...i, ...patch } : i)));
  },
  remove(id: string) {
    write(read().filter((i) => i.id !== id));
  },
  clear() {
    write([]);
  },
};

export function useCart() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotalCents = items.some((i) => i.unitPriceCents === null)
    ? null
    : items.reduce((n, i) => n + (i.unitPriceCents ?? 0) * i.quantity, 0);
  return { items, count, subtotalCents };
}

export type { CartItem, BoxSelection };
