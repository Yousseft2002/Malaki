import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-page py-10 md:py-16">
      <h1 className="mb-10 text-center text-4xl text-emerald">Your bag</h1>
      <CartView />
    </div>
  );
}
