"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { getDeliveryDates, startCheckout } from "@/app/actions/checkout";
import { Field, describedBy } from "@/components/forms/field";
import { ButtonLink } from "@/components/ui/button";
import { money } from "@/components/ui/price";
import { STORE_LOCALE } from "@/lib/store-config";
import { useCartQuote } from "@/lib/cart/use-cart-quote";
import { toCartLine } from "@/lib/cart/types";
import { countryOptions } from "@/lib/countries";
import type { DateOption } from "@/lib/domain/shipping";
import { GIFT_NOTE_MAX } from "@/lib/domain/pricing";
import { checkoutDetailsSchema } from "@/lib/validation/schemas";
import { DeliveryOptions, type PublicRule } from "./delivery-options";
import { OrderSummary } from "./order-summary";

type Errors = Record<string, string[] | undefined>;

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(STORE_LOCALE, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

export function CheckoutForm({
  rules,
  pickupAddress,
  giftWrapPriceCents,
}: {
  rules: PublicRule[];
  pickupAddress: string | null;
  giftWrapPriceCents: number;
}) {
  const id = useId();
  const { items, quote, error: quoteError } = useCartQuote();
  const [ruleId, setRuleId] = useState(rules[0]?.id ?? "");
  // MALAKI is based in Boston: preselect the US when the first option ships there.
  const [country, setCountry] = useState(() => {
    const first = rules.find((r) => r.method === "DELIVERY");
    return !first || first.countries.length === 0 || first.countries.includes("US") ? "US" : "";
  });
  const [dates, setDates] = useState<DateOption[] | null>(null);
  const [datesError, setDatesError] = useState<string>();
  const [deliveryDate, setDeliveryDate] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [giftWrapAll, setGiftWrapAll] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const summaryRef = useRef<HTMLDivElement>(null);

  const rule = rules.find((r) => r.id === ruleId);
  const isDelivery = rule?.method === "DELIVERY";
  const countries = useMemo(() => countryOptions(rule?.countries.length ? rule.countries : undefined), [rule]);
  const linesKey = JSON.stringify(items.map(toCartLine));

  // Reload the bookable dates whenever the delivery option or the cart changes.
  useEffect(() => {
    if (!ruleId || items.length === 0) return;
    let cancelled = false;
    getDeliveryDates(ruleId, items.map(toCartLine)).then((r) => {
      if (cancelled) return;
      setDates(r.dates);
      setDatesError(r.error);
      setDeliveryDate((current) => (r.dates.some((d) => d.deliveryDate === current) ? current : ""));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleId, linesKey]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <p className="text-muted">Your bag is empty.</p>
        <ButtonLink href="/collections/gift-boxes" variant="outline">
          Shop gift boxes
        </ButtonLink>
      </div>
    );
  }

  const err = (key: string) => errors[key]?.[0];

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = (k: string) => {
      const v = f.get(k);
      return typeof v === "string" && v.trim() ? v : undefined;
    };
    const details = {
      buyerName: text("buyerName") ?? "",
      buyerEmail: text("buyerEmail") ?? "",
      buyerPhone: text("buyerPhone"),
      shippingRuleId: ruleId,
      deliveryDate,
      recipientName: text("recipientName") ?? "",
      recipientPhone: text("recipientPhone"),
      address: isDelivery
        ? {
            addressLine1: text("addressLine1") ?? "",
            addressLine2: text("addressLine2"),
            city: text("city") ?? "",
            region: text("region"),
            postalCode: text("postalCode") ?? "",
            country,
          }
        : undefined,
      giftWrapAll,
      giftNote: giftNote.trim() || undefined,
      acceptTerms: f.get("acceptTerms") === "on",
    };

    // Instant client-side validation; the server validates again.
    const local = checkoutDetailsSchema.safeParse(details);
    if (!local.success) {
      const next: Errors = {};
      for (const issue of local.error.issues) (next[issue.path.join(".")] ??= []).push(issue.message);
      setErrors(next);
      setFormError("Please check the highlighted fields.");
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setErrors({});
    setFormError(undefined);
    startTransition(async () => {
      const result = await startCheckout({ lines: items.map(toCartLine), details: local.data });
      if (result.ok) {
        window.location.assign(result.url);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.message);
      requestAnimationFrame(() => summaryRef.current?.focus());
    });
  }

  const fieldErrorList = Object.entries(errors).filter(([, v]) => v?.length);

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col gap-10">
        {(formError || quoteError) && (
          <div ref={summaryRef} tabIndex={-1} role="alert" className="border border-error bg-ivory p-4 text-error focus:outline-2">
            <p className="font-medium">{formError ?? quoteError}</p>
            {fieldErrorList.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {fieldErrorList.map(([key, msgs]) => (
                  <li key={key}>{msgs![0]}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <fieldset className="grid gap-5">
          <legend className="mb-4 font-display text-2xl text-emerald">Your details</legend>
          <Field id={`${id}-buyerName`} label="Full name" error={err("buyerName")}>
            <input name="buyerName" autoComplete="name" required className="field-input" {...describedBy(`${id}-buyerName`, err("buyerName"))} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id={`${id}-buyerEmail`} label="Email" error={err("buyerEmail")} hint="For your order confirmation.">
              <input
                name="buyerEmail"
                type="email"
                autoComplete="email"
                required
                className="field-input"
                {...describedBy(`${id}-buyerEmail`, err("buyerEmail"), true)}
              />
            </Field>
            <Field id={`${id}-buyerPhone`} label="Phone" optional error={err("buyerPhone")}>
              <input name="buyerPhone" type="tel" autoComplete="tel" className="field-input" {...describedBy(`${id}-buyerPhone`, err("buyerPhone"))} />
            </Field>
          </div>
        </fieldset>

        <DeliveryOptions
          rules={rules}
          value={ruleId}
          onChange={(v) => {
            setRuleId(v);
            setDates(null);
          }}
          subtotalCents={quote?.subtotalCents ?? null}
          country={isDelivery ? country : ""}
          error={err("shippingRuleId")}
        />

        <fieldset className="grid gap-5">
          <legend className="mb-4 font-display text-2xl text-emerald">{isDelivery ? "Who is it for?" : "Who is collecting?"}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id={`${id}-recipientName`} label="Recipient's name" error={err("recipientName")}>
              <input name="recipientName" autoComplete="shipping name" required className="field-input" {...describedBy(`${id}-recipientName`, err("recipientName"))} />
            </Field>
            <Field id={`${id}-recipientPhone`} label="Recipient's phone" optional hint="Only used by the courier if needed." error={err("recipientPhone")}>
              <input
                name="recipientPhone"
                type="tel"
                autoComplete="shipping tel"
                className="field-input"
                {...describedBy(`${id}-recipientPhone`, err("recipientPhone"), true)}
              />
            </Field>
          </div>

          {isDelivery ? (
            <>
              <Field id={`${id}-addressLine1`} label="Address" error={err("address.addressLine1") ?? err("address")}>
                <input
                  name="addressLine1"
                  autoComplete="shipping address-line1"
                  required
                  className="field-input"
                  {...describedBy(`${id}-addressLine1`, err("address.addressLine1") ?? err("address"))}
                />
              </Field>
              <Field id={`${id}-addressLine2`} label="Apartment, building, etc." optional>
                <input name="addressLine2" autoComplete="shipping address-line2" className="field-input" id={`${id}-addressLine2`} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id={`${id}-city`} label="Town or city" error={err("address.city")}>
                  <input name="city" autoComplete="shipping address-level2" required className="field-input" {...describedBy(`${id}-city`, err("address.city"))} />
                </Field>
                <Field id={`${id}-region`} label="State" optional>
                  <input name="region" autoComplete="shipping address-level1" className="field-input" id={`${id}-region`} />
                </Field>
                <Field id={`${id}-postalCode`} label="ZIP / postal code" error={err("address.postalCode")}>
                  <input
                    name="postalCode"
                    autoComplete="shipping postal-code"
                    required
                    className="field-input"
                    {...describedBy(`${id}-postalCode`, err("address.postalCode"))}
                  />
                </Field>
                <Field id={`${id}-country`} label="Country" error={err("address.country")}>
                  <select
                    name="country"
                    autoComplete="shipping country"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="field-input"
                    {...describedBy(`${id}-country`, err("address.country"))}
                  >
                    <option value="">Choose a country</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </>
          ) : (
            rule && (
              <div className="bg-sand p-4 text-sm">
                <p className="font-medium">Collection address</p>
                <p className="whitespace-pre-line text-muted">{rule.pickupInstructions ?? pickupAddress ?? "[PICKUP ADDRESS]"}</p>
              </div>
            )
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-4 font-display text-2xl text-emerald">{isDelivery ? "Requested delivery date" : "Collection date"}</legend>
          <Field
            id={`${id}-date`}
            label="Date"
            error={err("deliveryDate")}
            hint="Dates that are fully booked or that we can't dispatch for are not shown."
          >
            <select
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              required
              disabled={dates === null}
              className="field-input"
              {...describedBy(`${id}-date`, err("deliveryDate"), true)}
            >
              <option value="">{dates === null ? "Loading dates…" : dates.length ? "Choose a date" : "No dates available"}</option>
              {dates?.map((d) => (
                <option key={d.deliveryDate} value={d.deliveryDate}>
                  {formatDate(d.deliveryDate)}
                </option>
              ))}
            </select>
          </Field>
          {datesError && <p className="mt-2 text-sm text-error">{datesError}</p>}
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="mb-4 font-display text-2xl text-emerald">Gift options</legend>
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={giftWrapAll}
              onChange={(e) => setGiftWrapAll(e.target.checked)}
              className="h-5 w-5 accent-emerald"
            />
            <span>
              Gift wrap everything in this order
              {giftWrapPriceCents > 0 && <span className="text-muted"> (+{money(giftWrapPriceCents)} per item)</span>}
            </span>
          </label>
          <Field id={`${id}-giftNote`} label="Gift note" optional error={err("giftNote")} hint={`${GIFT_NOTE_MAX - giftNote.length} characters left`}>
            <textarea
              value={giftNote}
              onChange={(e) => setGiftNote(e.target.value.slice(0, GIFT_NOTE_MAX))}
              maxLength={GIFT_NOTE_MAX}
              rows={3}
              className="field-input"
              {...describedBy(`${id}-giftNote`, err("giftNote"), true)}
            />
          </Field>
        </fieldset>

        <div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="acceptTerms"
              className="mt-1 h-5 w-5 shrink-0 accent-emerald"
              aria-invalid={err("acceptTerms") ? true : undefined}
              aria-describedby={err("acceptTerms") ? `${id}-terms-error` : undefined}
            />
            <span>
              I agree to the{" "}
              <Link href="/legal/terms" className="link-inline" target="_blank">
                terms &amp; conditions
              </Link>{" "}
              and have read the{" "}
              <Link href="/legal/allergens" className="link-inline" target="_blank">
                allergen information
              </Link>
              .
            </span>
          </label>
          {err("acceptTerms") && (
            <p id={`${id}-terms-error`} className="mt-1 text-sm text-error">
              {err("acceptTerms")}
            </p>
          )}
        </div>
      </div>

      <OrderSummary
        items={items}
        quote={quote}
        rule={rule ?? null}
        giftWrapCents={quote ? (giftWrapAll ? giftWrapPriceCents * quote.units : quote.giftWrapCents) : null}
        pending={pending}
        canSubmit={!!quote?.ok && !pending}
      />
    </form>
  );
}
