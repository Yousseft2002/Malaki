// Pure helpers for admin forms and order workflow.

/** "12.50" → 1250, "" → null. Returns undefined for invalid input. */
export function parseMoneyInput(raw: FormDataEntryValue | null | undefined): number | null | undefined {
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim().replace(",", ".");
  if (value === "") return null;
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(value)) return undefined;
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Cents → "12.50" for form default values; null → "". */
export function formatMoneyInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}

/** Whole non-negative integer, or undefined if invalid. Empty → fallback. */
export function parseIntInput(raw: FormDataEntryValue | null | undefined, fallback: number | null = null): number | null | undefined {
  if (raw === null || raw === undefined || String(raw).trim() === "") return fallback;
  const value = String(raw).trim();
  if (!/^\d{1,6}$/.test(value)) return undefined;
  return Number(value);
}

export function parseWeekdays(values: FormDataEntryValue[]): number[] {
  return [...new Set(values.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort();
}

export function parseList(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "PACKED" | "SHIPPED" | "CANCELLED";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [],
  PAID: ["PACKED", "SHIPPED"],
  PACKED: ["SHIPPED", "PAID"],
  SHIPPED: ["PACKED"],
  CANCELLED: [],
};

/** Fulfilment moves the admin may make. Payment states are owned by the webhook. */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
