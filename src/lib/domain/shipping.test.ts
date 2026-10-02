import { describe, expect, it } from "vitest";
import { type CapacityInputs, remainingCapacity } from "./capacity";
import { addDays, isIsoDate, todayIn, weekday } from "./dates";
import {
  type DateContext,
  type ShippingRuleInfo,
  availableDeliveryDates,
  checkDeliveryDate,
  ruleServes,
  shippingCost,
} from "./shipping";

const rule = (over: Partial<ShippingRuleInfo> = {}): ShippingRuleInfo => ({
  id: "r",
  name: "Standard delivery",
  method: "DELIVERY",
  countries: ["GB"],
  postcodePrefixes: [],
  pricing: "FLAT",
  flatRateCents: 500,
  freeOverCents: null,
  perishableShipDays: [1, 2, 3], // Mon–Wed
  shipDays: [1, 2, 3, 4, 5],
  transitDays: 1,
  leadTimeDays: 2,
  maxDaysAhead: 30,
  isActive: true,
  ...over,
});

const noLimit: CapacityInputs = { defaultCapacity: 0, overrides: new Map(), booked: new Map() };

// 2026-10-05 is a Monday.
const MONDAY = "2026-10-05";
const ctx = (over: Partial<DateContext> = {}): DateContext => ({
  today: MONDAY,
  hasPerishables: true,
  units: 1,
  capacity: noLimit,
  ...over,
});

describe("dates", () => {
  it("knows weekdays and validates ISO dates", () => {
    expect(weekday(MONDAY)).toBe(1);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("computes today in a time zone", () => {
    // 23:30 UTC on Oct 5 is already Oct 6 in Tokyo.
    const now = new Date("2026-10-05T23:30:00Z");
    expect(todayIn("UTC", now)).toBe("2026-10-05");
    expect(todayIn("Asia/Tokyo", now)).toBe("2026-10-06");
  });
});

describe("ruleServes", () => {
  it("matches countries case-insensitively", () => {
    expect(ruleServes(rule(), { country: "gb", postalCode: "SW1A 1AA" })).toBe(true);
    expect(ruleServes(rule(), { country: "FR", postalCode: "75001" })).toBe(false);
  });
  it("narrows by postcode prefix, ignoring spaces and case", () => {
    const local = rule({ postcodePrefixes: ["sw1", "E1 "] });
    expect(ruleServes(local, { country: "GB", postalCode: "sw1a 1aa" })).toBe(true);
    expect(ruleServes(local, { country: "GB", postalCode: "E1 6AN" })).toBe(true);
    expect(ruleServes(local, { country: "GB", postalCode: "N1 9GU" })).toBe(false);
  });
  it("pickup rules need no address; inactive rules never serve", () => {
    expect(ruleServes(rule({ method: "PICKUP", countries: [] }), null)).toBe(true);
    expect(ruleServes(rule({ isActive: false }), { country: "GB", postalCode: "SW1" })).toBe(false);
    expect(ruleServes(rule(), null)).toBe(false);
  });
});

describe("shippingCost", () => {
  it("charges flat rates", () => {
    expect(shippingCost(rule(), 100_000)).toBe(500);
  });
  it("is free at or above the threshold", () => {
    const r = rule({ pricing: "THRESHOLD", freeOverCents: 5000 });
    expect(shippingCost(r, 4999)).toBe(500);
    expect(shippingCost(r, 5000)).toBe(0);
  });
  it("returns null when no price has been set", () => {
    expect(shippingCost(rule({ flatRateCents: null }), 0)).toBeNull();
  });
});

describe("checkDeliveryDate", () => {
  it("derives the dispatch date from transit days", () => {
    // Deliver Thursday → dispatch Wednesday (allowed for perishables).
    expect(checkDeliveryDate(rule(), "2026-10-08", ctx())).toEqual({ ok: true, dispatchDate: "2026-10-07" });
  });
  it("enforces lead time", () => {
    // Deliver Wed → dispatch Tue, only 1 day after Monday; lead time is 2.
    expect(checkDeliveryDate(rule(), "2026-10-07", ctx()).reason).toBe("TOO_SOON");
  });
  it("uses the perishable weekdays only when the cart has perishables", () => {
    // Deliver Fri → dispatch Thu: not a perishable ship day, but a normal one.
    expect(checkDeliveryDate(rule(), "2026-10-09", ctx()).reason).toBe("NO_DISPATCH_ON_WEEKDAY");
    expect(checkDeliveryDate(rule(), "2026-10-09", ctx({ hasPerishables: false })).ok).toBe(true);
  });
  it("blocks dates beyond the booking horizon", () => {
    expect(checkDeliveryDate(rule({ maxDaysAhead: 5 }), "2026-10-15", ctx()).reason).toBe("TOO_FAR");
  });
  it("rejects malformed dates", () => {
    expect(checkDeliveryDate(rule(), "next tuesday", ctx()).reason).toBe("INVALID_DATE");
  });
  it("blocks dispatch dates that are fully booked", () => {
    const capacity: CapacityInputs = {
      defaultCapacity: 10,
      overrides: new Map(),
      booked: new Map([["2026-10-07", 9]]),
    };
    expect(checkDeliveryDate(rule(), "2026-10-08", ctx({ capacity, units: 1 })).ok).toBe(true);
    expect(checkDeliveryDate(rule(), "2026-10-08", ctx({ capacity, units: 2 })).reason).toBe("FULLY_BOOKED");
  });
  it("treats a zero override as a closed day", () => {
    const capacity: CapacityInputs = { defaultCapacity: 0, overrides: new Map([["2026-10-07", 0]]), booked: new Map() };
    expect(checkDeliveryDate(rule(), "2026-10-08", ctx({ capacity })).reason).toBe("FULLY_BOOKED");
  });
  it("same-day pickup with no transit or lead time", () => {
    const pickup = rule({ method: "PICKUP", transitDays: 0, leadTimeDays: 0, perishableShipDays: [1] });
    expect(checkDeliveryDate(pickup, MONDAY, ctx())).toEqual({ ok: true, dispatchDate: MONDAY });
  });
});

describe("availableDeliveryDates", () => {
  it("lists only bookable dates within the horizon", () => {
    const dates = availableDeliveryDates(rule({ maxDaysAhead: 9 }), ctx()).map((d) => d.deliveryDate);
    // Dispatch Mon–Wed, ≥ 2 days ahead, 1 day transit → delivery Thu 8th; Tue 13th, Wed 14th
    expect(dates).toEqual(["2026-10-08", "2026-10-13", "2026-10-14"]);
  });
});

describe("remainingCapacity", () => {
  it("is unlimited when no default or override is set", () => {
    expect(remainingCapacity("2026-10-07", noLimit)).toBe(Infinity);
  });
  it("prefers the override over the default and never goes negative", () => {
    const inputs: CapacityInputs = {
      defaultCapacity: 20,
      overrides: new Map([["2026-10-07", 5]]),
      booked: new Map([["2026-10-07", 8]]),
    };
    expect(remainingCapacity("2026-10-07", inputs)).toBe(0);
    expect(remainingCapacity("2026-10-08", inputs)).toBe(20);
  });
});
