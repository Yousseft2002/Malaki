"use server";

import { revalidatePath } from "next/cache";
import { parseIntInput, parseList, parseMoneyInput, parseWeekdays } from "@/lib/admin/forms";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { isIsoDate, toUtcDate } from "@/lib/domain/dates";
import { logger } from "@/lib/logger";
import type { FormState } from "@/lib/validation/schemas";

const ok = (message = "Saved."): FormState => ({ status: "success", message });
const bad = (message: string): FormState => ({ status: "error", message });
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

// ─── Enquiries ──────────────────────────────────────────────────────────────

export async function updateEnquiryStatus(_prev: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const status = str(f, "status");
  if (status !== "NEW" && status !== "IN_PROGRESS" && status !== "CLOSED") return bad("Unknown status.");
  await db.enquiry.update({ where: { id: str(f, "id") }, data: { status } });
  revalidatePath("/admin/enquiries");
  return ok("Updated.");
}

// ─── Shipping rules ─────────────────────────────────────────────────────────

export async function saveShippingRule(_prev: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(f, "id");
  const name = str(f, "name");
  const method = str(f, "method") === "PICKUP" ? "PICKUP" : "DELIVERY";
  const pricing = str(f, "pricing") === "THRESHOLD" ? "THRESHOLD" : "FLAT";
  const flatRateCents = parseMoneyInput(f.get("flatRate"));
  const freeOverCents = parseMoneyInput(f.get("freeOver"));
  const transitDays = parseIntInput(f.get("transitDays"), 0);
  const leadTimeDays = parseIntInput(f.get("leadTimeDays"), 0);
  const maxDaysAhead = parseIntInput(f.get("maxDaysAhead"), 60);
  const sortOrder = parseIntInput(f.get("sortOrder"), 0);
  const countries = parseList(f.get("countries"));

  if (!name) return bad("Name is required.");
  if (flatRateCents === undefined || freeOverCents === undefined) return bad("Prices must look like 5.00 (or be left empty).");
  if ([transitDays, leadTimeDays, maxDaysAhead, sortOrder].some((n) => n === undefined || n === null)) return bad("Day counts must be whole numbers.");
  if (countries.some((c) => !/^[A-Z]{2}$/.test(c))) return bad("Countries must be 2-letter codes, e.g. GB, FR.");
  if (pricing === "THRESHOLD" && freeOverCents === null) return bad("Threshold pricing needs a 'free over' amount.");

  const data = {
    name,
    description: str(f, "description").slice(0, 500) || null,
    pickupInstructions: str(f, "pickupInstructions").slice(0, 1000) || null,
    method: method as "PICKUP" | "DELIVERY",
    pricing: pricing as "FLAT" | "THRESHOLD",
    flatRateCents,
    freeOverCents,
    countries,
    postcodePrefixes: parseList(f.get("postcodePrefixes")),
    perishableShipDays: parseWeekdays(f.getAll("perishableShipDays")),
    shipDays: parseWeekdays(f.getAll("shipDays")),
    transitDays: transitDays!,
    leadTimeDays: leadTimeDays!,
    maxDaysAhead: Math.min(maxDaysAhead!, 365),
    sortOrder: sortOrder!,
    isActive: f.get("isActive") === "on",
  };
  if (id) await db.shippingRule.update({ where: { id }, data });
  else await db.shippingRule.create({ data });
  logger.info("admin.shipping_rule_saved", { ruleId: id || "new" });
  revalidatePath("/admin/shipping");
  return ok(id ? "Saved." : "Rule added.");
}

// ─── Store settings & capacity ──────────────────────────────────────────────

export async function saveSettings(_prev: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const defaultDailyCapacity = parseIntInput(f.get("defaultDailyCapacity"), 0);
  const giftWrapPriceCents = parseMoneyInput(f.get("giftWrapPrice"));
  if (defaultDailyCapacity === undefined || defaultDailyCapacity === null) return bad("Daily capacity must be a whole number (0 = no limit).");
  if (giftWrapPriceCents === undefined) return bad("Gift wrap price must look like 2.50.");
  const data = {
    defaultDailyCapacity,
    giftWrapPriceCents: giftWrapPriceCents ?? 0,
    announcement: str(f, "announcement").slice(0, 200) || null,
    pickupAddress: str(f, "pickupAddress").slice(0, 500) || null,
  };
  await db.storeSettings.upsert({ where: { id: "store" }, update: data, create: { id: "store", ...data } });
  revalidatePath("/", "layout");
  return ok();
}

export async function saveCapacityOverride(_prev: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const date = str(f, "date");
  if (!isIsoDate(date)) return bad("Please choose a date.");
  if (f.get("remove") === "on") {
    await db.productionCapacity.deleteMany({ where: { date: toUtcDate(date) } });
    revalidatePath("/admin/shipping");
    return ok("Override removed.");
  }
  const capacityUnits = parseIntInput(f.get("capacityUnits"), null);
  if (capacityUnits === undefined || capacityUnits === null) return bad("Capacity must be a whole number (0 closes the day).");
  const note = str(f, "note").slice(0, 200) || null;
  await db.productionCapacity.upsert({
    where: { date: toUtcDate(date) },
    update: { capacityUnits, note },
    create: { date: toUtcDate(date), capacityUnits, note },
  });
  revalidatePath("/admin/shipping");
  return ok("Capacity saved.");
}
