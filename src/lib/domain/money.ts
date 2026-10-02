// Money is always integer minor units (e.g. cents). null = price not set yet.

export const PRICE_PLACEHOLDER = "[PRICE]";

export function formatMoney(
  cents: number | null | undefined,
  currency: string,
  locale = "en-US",
  /** Round to whole units ("$1,250"), e.g. for chart axes. */
  options: { wholeUnits?: boolean } = {},
): string {
  if (cents === null || cents === undefined) return PRICE_PLACEHOLDER;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    ...(options.wholeUnits ? { maximumFractionDigits: 0, minimumFractionDigits: 0 } : {}),
  }).format(options.wholeUnits ? Math.round(cents / 100) : cents / 100);
}

export function isValidPrice(cents: unknown): cents is number {
  return typeof cents === "number" && Number.isInteger(cents) && cents >= 0;
}
