import "server-only";
import { db } from "@/lib/db";
import type { CapacityInputs } from "@/lib/domain/capacity";
import { type IsoDate, fromUtcDate, toUtcDate } from "@/lib/domain/dates";
import type { ShippingRuleInfo } from "@/lib/domain/shipping";
import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient | typeof db;

export async function getActiveShippingRules(): Promise<(ShippingRuleInfo & { description: string | null; pickupInstructions: string | null })[]> {
  const rules = await db.shippingRule.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return rules.map((r) => ({
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
    perishableShipDays: r.perishableShipDays,
    shipDays: r.shipDays,
    transitDays: r.transitDays,
    leadTimeDays: r.leadTimeDays,
    maxDaysAhead: r.maxDaysAhead,
    isActive: r.isActive,
  }));
}

/**
 * Capacity data for a date range. Booked units include paid orders and
 * pending orders still inside their checkout hold window.
 */
export async function loadCapacityInputs(
  from: IsoDate,
  to: IsoDate,
  holdMinutes: number,
  tx: Tx = db,
  now = new Date(),
): Promise<CapacityInputs> {
  const range = { gte: toUtcDate(from), lte: toUtcDate(to) };
  const holdSince = new Date(now.getTime() - holdMinutes * 60_000);
  const [settings, overrides, booked] = await Promise.all([
    tx.storeSettings.findUnique({ where: { id: "store" } }),
    tx.productionCapacity.findMany({ where: { date: range } }),
    tx.order.groupBy({
      by: ["dispatchDate"],
      where: {
        dispatchDate: range,
        OR: [
          { status: { in: ["PAID", "PACKED", "SHIPPED"] } },
          { status: "PENDING_PAYMENT", createdAt: { gte: holdSince } },
        ],
      },
      _sum: { capacityUnits: true },
    }),
  ]);
  return {
    defaultCapacity: settings?.defaultDailyCapacity ?? 0,
    overrides: new Map(overrides.map((o) => [fromUtcDate(o.date), o.capacityUnits])),
    booked: new Map(booked.map((b) => [fromUtcDate(b.dispatchDate), b._sum.capacityUnits ?? 0])),
  };
}
