"use client";

import { money } from "@/components/ui/price";
import { type ShippingRuleInfo, shippingCost } from "@/lib/domain/shipping";

export type PublicRule = Pick<
  ShippingRuleInfo,
  "id" | "name" | "method" | "countries" | "postcodePrefixes" | "pricing" | "flatRateCents" | "freeOverCents"
> & { description: string | null; pickupInstructions: string | null };

/** Display-only cost for a rule; the server recomputes it at checkout. */
export function displayShipping(rule: PublicRule, subtotalCents: number | null): number | null {
  if (subtotalCents === null) return rule.flatRateCents;
  return shippingCost(
    { ...rule, perishableShipDays: [], shipDays: [], transitDays: 0, leadTimeDays: 0, maxDaysAhead: 0, isActive: true },
    subtotalCents,
  );
}

export function DeliveryOptions({
  rules,
  value,
  onChange,
  subtotalCents,
  country,
  error,
}: {
  rules: PublicRule[];
  value: string;
  onChange: (id: string) => void;
  subtotalCents: number | null;
  country: string;
  error?: string;
}) {
  if (rules.length === 0) return <p className="text-error">Delivery options are not configured yet.</p>;
  return (
    <fieldset aria-describedby={error ? "delivery-error" : undefined}>
      <legend className="mb-4 font-display text-2xl text-emerald">Delivery or collection</legend>
      <div className="grid gap-3">
        {rules.map((r) => {
          const cost = displayShipping(r, subtotalCents);
          const unavailable = cost === null;
          const wrongCountry = r.method === "DELIVERY" && !!country && r.countries.length > 0 && !r.countries.includes(country);
          return (
            <label
              key={r.id}
              className={`flex min-h-14 cursor-pointer items-start gap-3 border p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-emerald ${
                r.id === value ? "border-emerald bg-white" : "border-[#857a63]"
              } ${unavailable ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name="shippingRuleId"
                value={r.id}
                checked={r.id === value}
                disabled={unavailable}
                onChange={() => onChange(r.id)}
                className="mt-1 h-5 w-5 shrink-0 accent-emerald"
              />
              <span className="flex-1">
                <span className="flex justify-between gap-4">
                  <span className="font-medium">{r.name}</span>
                  <span>{unavailable ? "Unavailable" : cost === 0 ? "Free" : money(cost)}</span>
                </span>
                {r.description && <span className="block text-sm text-muted">{r.description}</span>}
                {r.pricing === "THRESHOLD" && r.freeOverCents !== null && cost !== 0 && (
                  <span className="block text-sm text-gold-ink">Free on orders over {money(r.freeOverCents)}</span>
                )}
                {wrongCountry && <span className="block text-sm text-error">Not available for the selected country.</span>}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id="delivery-error" className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
