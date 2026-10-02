// Money is always integer minor units (e.g. cents). null = price not set yet.

export const PRICE_PLACEHOLDER = "[PRICE]";

export function formatMoney(
  cents: number | null | undefined,
  currency: string,
  locale = "en-GB",
): string {
  if (cents === null || cents === undefined) return PRICE_PLACEHOLDER;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function isValidPrice(cents: unknown): cents is number {
  return typeof cents === "number" && Number.isInteger(cents) && cents >= 0;
}
