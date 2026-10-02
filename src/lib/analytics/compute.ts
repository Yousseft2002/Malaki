// Pure analytics: rows in, chart data out. No database, no clock (callers pass
// "today"), so everything here is unit-tested. Days are store-time-zone
// calendar days ("YYYY-MM-DD"), never UTC days.

import { type IsoDate, addDays, todayIn } from "@/lib/domain/dates";

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

/** ?range=7|30|90, anything else → 30. */
export function parseRange(raw: string | string[] | undefined): Range {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 30;
}

/** The store-time-zone calendar day an instant falls on. */
export function storeDay(instant: Date, timeZone: string): IsoDate {
  return todayIn(timeZone, instant);
}

/** The `days` calendar days ending with `lastDay`, oldest first. */
export function dayList(lastDay: IsoDate, days: number): IsoDate[] {
  return Array.from({ length: days }, (_, i) => addDays(lastDay, i - days + 1));
}

/**
 * The current period (the last `days` days up to and including today) and the
 * period of the same length just before it.
 */
export function periods(today: IsoDate, days: number) {
  const current = dayList(today, days);
  const previous = dayList(addDays(today, -days), days);
  return { current, previous, earliest: previous[0]! };
}

/** % change, or null when there is nothing to compare against (previous = 0). */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

// ─── Sales ───────────────────────────────────────────────────────────────────

export type SaleRow = { paidAt: Date; totalCents: number };
export type SalesDay = { date: IsoDate; revenueCents: number; orders: number };

/** Revenue and order count for every day in `days`, zero-filled. */
export function salesByDay(rows: SaleRow[], days: IsoDate[], timeZone: string): SalesDay[] {
  const byDay = new Map<IsoDate, SalesDay>(days.map((date) => [date, { date, revenueCents: 0, orders: 0 }]));
  for (const row of rows) {
    const day = byDay.get(storeDay(row.paidAt, timeZone));
    if (!day) continue;
    day.revenueCents += row.totalCents;
    day.orders += 1;
  }
  return days.map((d) => byDay.get(d)!);
}

export type SalesSummary = {
  revenueCents: number;
  orders: number;
  /** null when there are no orders. */
  averageOrderCents: number | null;
  change: { revenue: number | null; orders: number | null; averageOrder: number | null };
};

function totals(days: SalesDay[]) {
  const revenueCents = days.reduce((s, d) => s + d.revenueCents, 0);
  const orders = days.reduce((s, d) => s + d.orders, 0);
  return { revenueCents, orders, averageOrderCents: orders ? Math.round(revenueCents / orders) : null };
}

export function salesSummary(current: SalesDay[], previous: SalesDay[]): SalesSummary {
  const now = totals(current);
  const before = totals(previous);
  return {
    ...now,
    change: {
      revenue: percentChange(now.revenueCents, before.revenueCents),
      orders: percentChange(now.orders, before.orders),
      averageOrder: now.averageOrderCents === null || before.averageOrderCents === null ? null : percentChange(now.averageOrderCents, before.averageOrderCents),
    },
  };
}

// ─── Best sellers ────────────────────────────────────────────────────────────

export type ItemRow = { productId: string | null; productName: string; quantity: number; lineTotalCents: number };
export type Slice = { key: string; name: string; units: number; revenueCents: number; share: number; isOther: boolean };

/**
 * Units and revenue per product, top `top` by revenue plus one "Other" slice
 * for the rest. Deleted products (productId null) are grouped by their name.
 */
export function bestSellers(rows: ItemRow[], top = 5): { slices: Slice[]; totalCents: number; products: number } {
  const byProduct = new Map<string, { key: string; name: string; units: number; revenueCents: number }>();
  for (const row of rows) {
    const key = row.productId ?? `name:${row.productName}`;
    const entry = byProduct.get(key) ?? { key, name: row.productName, units: 0, revenueCents: 0 };
    entry.units += row.quantity;
    entry.revenueCents += row.lineTotalCents;
    byProduct.set(key, entry);
  }
  const ranked = [...byProduct.values()].sort((a, b) => b.revenueCents - a.revenueCents || a.name.localeCompare(b.name));
  const totalCents = ranked.reduce((s, p) => s + p.revenueCents, 0);
  const share = (cents: number) => (totalCents ? (cents / totalCents) * 100 : 0);
  const slices: Slice[] = ranked.slice(0, top).map((p) => ({ ...p, share: share(p.revenueCents), isOther: false }));
  const rest = ranked.slice(top);
  if (rest.length) {
    const revenueCents = rest.reduce((s, p) => s + p.revenueCents, 0);
    slices.push({
      key: "other",
      name: `Other (${rest.length} product${rest.length === 1 ? "" : "s"})`,
      units: rest.reduce((s, p) => s + p.units, 0),
      revenueCents,
      share: share(revenueCents),
      isOther: true,
    });
  }
  return { slices, totalCents, products: ranked.length };
}

/** Number of distinct product colours (see charts/palette). "Other" has its own neutral shade. */
export const PRODUCT_SHADES = 6;

function hash(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * A colour index per product, chosen from the product's key (not its rank), so
 * a product keeps its colour when the date range changes. If two visible
 * products land on the same shade, the one with the smaller key keeps it and
 * the other moves to the next free shade.
 */
export function shadeIndexes(keys: string[]): Map<string, number> {
  const out = new Map<string, number>();
  const used = new Set<number>();
  for (const key of [...keys].sort()) {
    let i = hash(key) % PRODUCT_SHADES;
    for (let n = 0; used.has(i) && n < PRODUCT_SHADES; n++) i = (i + 1) % PRODUCT_SHADES;
    used.add(i);
    out.set(key, i);
  }
  return out;
}

// ─── Ads ─────────────────────────────────────────────────────────────────────

export type AttributedRow = { utmSource: string | null; utmCampaign: string | null; totalCents: number };
export type CampaignRevenue = { campaign: string; source: string | null; orders: number; revenueCents: number };

/** Revenue and orders from ad-tagged sales, by utm_campaign (then utm_source). */
export function revenueByCampaign(rows: AttributedRow[]): CampaignRevenue[] {
  const map = new Map<string, CampaignRevenue>();
  for (const row of rows) {
    if (!row.utmCampaign) continue;
    const key = `${row.utmCampaign}\u0000${row.utmSource ?? ""}`;
    const entry = map.get(key) ?? { campaign: row.utmCampaign, source: row.utmSource, orders: 0, revenueCents: 0 };
    entry.orders += 1;
    entry.revenueCents += row.totalCents;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => b.revenueCents - a.revenueCents);
}

/** Return on ad spend (revenue ÷ spend), or null when nothing was spent. */
export function roas(revenueCents: number, spendCents: number): number | null {
  return spendCents > 0 ? revenueCents / spendCents : null;
}

/** "3.2×", or "-" when there is no spend to divide by. */
export function formatRoas(value: number | null): string {
  return value === null ? "-" : `${value.toFixed(1)}×`;
}

// ─── Visitors ────────────────────────────────────────────────────────────────

export type ViewRow = {
  createdAt: Date;
  visitorHash: string;
  path: string;
  referrer: string | null;
  utmSource: string | null;
  isMobile: boolean;
};
export type VisitorDay = { date: IsoDate; visitors: number; views: number };

/**
 * Unique visitors and page views per day. The visitor hash rotates daily, so a
 * visitor is unique within a day; a period's visitors are the sum of its days
 * (the same convention Plausible uses).
 */
export function visitorsByDay(rows: ViewRow[], days: IsoDate[], timeZone: string): VisitorDay[] {
  const seen = new Map<IsoDate, Set<string>>(days.map((d) => [d, new Set()]));
  const views = new Map<IsoDate, number>(days.map((d) => [d, 0]));
  for (const row of rows) {
    const day = storeDay(row.createdAt, timeZone);
    const set = seen.get(day);
    if (!set) continue;
    set.add(row.visitorHash);
    views.set(day, views.get(day)! + 1);
  }
  return days.map((date) => ({ date, visitors: seen.get(date)!.size, views: views.get(date)! }));
}

export function sumVisitors(days: VisitorDay[]): { visitors: number; views: number } {
  return { visitors: days.reduce((s, d) => s + d.visitors, 0), views: days.reduce((s, d) => s + d.views, 0) };
}

/** Readable traffic source: utm_source first, then the referrer host, else "Direct". */
export function sourceOf(row: Pick<ViewRow, "utmSource" | "referrer">): string {
  const raw = (row.utmSource ?? row.referrer ?? "").trim().toLowerCase();
  if (!raw) return "Direct";
  if (/(^|\.)instagram\.com$|^ig$|^instagram$/.test(raw)) return "instagram";
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$|^fb$|^facebook$/.test(raw)) return "facebook";
  return raw.replace(/^www\./, "");
}

export type Ranked = { label: string; count: number; share: number };

function rank(labels: string[], top: number): Ranked[] {
  const counts = new Map<string, number>();
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  const total = labels.length;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, top)
    .map(([label, count]) => ({ label, count, share: total ? (count / total) * 100 : 0 }));
}

export function topPages(rows: Pick<ViewRow, "path">[], top = 5): Ranked[] {
  return rank(
    rows.map((r) => r.path),
    top,
  );
}

/**
 * Where visitors came from, counted once per visitor (per day, as hashes rotate
 * daily): the first known source among their page views, else "Direct".
 */
export function topSources(rows: Pick<ViewRow, "utmSource" | "referrer" | "visitorHash" | "createdAt">[], top = 5): Ranked[] {
  const firstSource = new Map<string, string>();
  for (const row of [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    const source = sourceOf(row);
    const known = firstSource.get(row.visitorHash);
    if (known === undefined || (known === "Direct" && source !== "Direct")) firstSource.set(row.visitorHash, source);
  }
  return rank([...firstSource.values()], top);
}

/** Share of page views from phones, 0–100, or null with no views. */
export function mobileShare(rows: Pick<ViewRow, "isMobile">[]): number | null {
  if (!rows.length) return null;
  return (rows.filter((r) => r.isMobile).length / rows.length) * 100;
}

/** Orders ÷ unique visitors as a %, or null with no visitors. */
export function conversionRate(orders: number, visitors: number): number | null {
  return visitors > 0 ? (orders / visitors) * 100 : null;
}

/** "+12%" / "−8%" / null → no comparison. */
export function formatChange(pct: number | null): string | null {
  if (pct === null || !Number.isFinite(pct)) return null;
  const rounded = Math.round(pct);
  return `${rounded > 0 ? "+" : rounded < 0 ? "−" : "±"}${Math.abs(rounded)}%`;
}
