"use client";

import { useSyncExternalStore } from "react";

// Tiny global store for the cart drawer's open state.
let open = false;
const listeners = new Set<() => void>();

export const cartDrawer = {
  open() {
    open = true;
    listeners.forEach((l) => l());
  },
  close() {
    open = false;
    listeners.forEach((l) => l());
  },
};

export function useCartDrawer() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
    () => false,
  );
}
