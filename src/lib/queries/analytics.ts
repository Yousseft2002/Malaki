import "server-only";
import {
  type Range,
  bestSellers,
  mobileShare,
  periods,
  revenueByCampaign,
  salesByDay,
  salesSummary,
  sumVisitors,
  topPages,
  topSources,
  visitorsByDay,
} from "@/lib/analytics/compute";
import { db } from "@/lib/db";
import { type IsoDate, addDays, todayIn, toUtcDate } from "@/lib/domain/dates";
import { env } from "@/lib/env";

// Thin loaders for /admin/analytics: fetch rows with Prisma, hand them to the
// pure functions in lib/analytics/compute. Admin-only — never import this from
// a public route. Rows are grouped by store-time-zone day in TypeScript.

/** A "sale" is a paid order that has not been cancelled. */
const SALE = { status: { in: ["PAID", "PACKED", "SHIPPED"] as ("PAID" | "PACKED" | "SHIPPED")[] }, paidAt: { not: null } };

/** A UTC instant safely before the start of `day` in any time zone; exact day filtering happens afterwards. */
const before = (day: IsoDate) => toUtcDate(addDays(day, -1));

export async function getSalesAnalytics(range: Range) {
  const timeZone = env().STORE_TIMEZONE;
  const today = todayIn(timeZone);
  const p = periods(today, range);
  const currentStart = before(p.current[0]!);

  const [orders, items] = await Promise.all([
    db.order.findMany({
      where: { ...SALE, paidAt: { gte: before(p.earliest) } },
      select: { paidAt: true, totalCents: true, utmSource: true, utmCampaign: true },
    }),
    db.orderItem.findMany({
      where: { order: { ...SALE, paidAt: { gte: currentStart } } },
      select: { productId: true, productName: true, quantity: true, lineTotalCents: true, order: { select: { paidAt: true } } },
    }),
  ]);

  const sales = orders.map((o) => ({ ...o, paidAt: o.paidAt! }));
  const current = salesByDay(sales, p.current, timeZone);
  const previous = salesByDay(sales, p.previous, timeZone);
  const inCurrent = new Set(p.current);
  const inPrevious = new Set(p.previous);
  const currentSales = sales.filter((o) => inCurrent.has(todayIn(timeZone, o.paidAt)));
  const currentItems = items.filter((i) => inCurrent.has(todayIn(timeZone, i.order.paidAt!)));

  return {
    days: current,
    summary: salesSummary(current, previous),
    previousOrders: previous.reduce((n, d) => n + d.orders, 0),
    bestSellers: bestSellers(currentItems),
    campaigns: revenueByCampaign(currentSales),
    /** Revenue from orders that arrived through a tagged ad link (any utm_campaign). */
    adRevenueCents: currentSales.filter((o) => o.utmCampaign).reduce((s, o) => s + o.totalCents, 0),
    previousAdRevenueCents: sales
      .filter((o) => o.utmCampaign && inPrevious.has(todayIn(timeZone, o.paidAt)))
      .reduce((s, o) => s + o.totalCents, 0),
  };
}

export async function getVisitorAnalytics(range: Range) {
  const timeZone = env().STORE_TIMEZONE;
  const today = todayIn(timeZone);
  const p = periods(today, range);
  const rows = await db.pageView.findMany({
    where: { createdAt: { gte: before(p.earliest) } },
    select: { createdAt: true, visitorHash: true, path: true, referrer: true, utmSource: true, isMobile: true },
  });
  const days = visitorsByDay(rows, p.current, timeZone);
  const previousDays = visitorsByDay(rows, p.previous, timeZone);
  const inCurrent = new Set(p.current);
  const currentRows = rows.filter((r) => inCurrent.has(todayIn(timeZone, r.createdAt)));
  const totals = sumVisitors(days);
  return {
    days,
    totals,
    previousTotals: sumVisitors(previousDays),
    today: days.at(-1)?.visitors ?? 0,
    topPages: topPages(currentRows),
    topSources: topSources(currentRows),
    mobileShare: mobileShare(currentRows),
  };
}
