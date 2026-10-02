import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getStoreSettings } from "@/lib/queries/catalog";
import { getActiveShippingRules } from "@/lib/queries/shipping";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

type Props = { searchParams: Promise<{ cancelled?: string }> };

export default async function CheckoutPage({ searchParams }: Props) {
  const [{ cancelled }, rules, settings] = await Promise.all([searchParams, getActiveShippingRules(), getStoreSettings()]);
  return (
    <div className="container-page py-10 md:py-16">
      <h1 className="mb-8 text-center text-4xl text-emerald">Checkout</h1>
      {cancelled && (
        <p role="status" className="mx-auto mb-8 max-w-2xl border border-gold-ink bg-sand p-4 text-center">
          Payment was canceled — your bag is still here whenever you&apos;re ready.
        </p>
      )}
      <CheckoutForm
        rules={rules.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          pickupInstructions: r.pickupInstructions,
          method: r.method,
          countries: r.countries,
          postcodePrefixes: r.postcodePrefixes,
          pricing: r.pricing,
          flatRateCents: r.flatRateCents,
          freeOverCents: r.freeOverCents,
        }))}
        pickupAddress={settings.pickupAddress}
        giftWrapPriceCents={settings.giftWrapPriceCents}
      />
    </div>
  );
}
