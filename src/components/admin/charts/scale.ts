// Small helpers shared by the admin charts (pure, no React).

/** A "nice" axis maximum ≥ value: 1, 2, 2.5 or 5 × 10ⁿ. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = 10 ** exp;
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (value <= step * base) return step * base;
  }
  return 10 * base;
}

/** Evenly spaced indexes for a handful of axis labels, always including the first and last. */
export function labelIndexes(count: number, wanted = 5): number[] {
  if (count <= wanted) return Array.from({ length: count }, (_, i) => i);
  const step = (count - 1) / (wanted - 1);
  return [...new Set(Array.from({ length: wanted }, (_, i) => Math.round(i * step)))];
}

/** "2026-10-02" → "Oct 2" (calendar date, no time zone shift). */
export function shortDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

/** "2026-10-02" → "Friday, October 2" */
export function longDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
