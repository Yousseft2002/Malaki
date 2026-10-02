"use client";

import { useEffect } from "react";
import { cart } from "@/lib/cart/store";

/** Empties the browser cart once the buyer has reached the confirmation page. */
export function ClearCart() {
  useEffect(() => cart.clear(), []);
  return null;
}
