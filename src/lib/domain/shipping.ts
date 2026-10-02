// Shipping rules are data (database rows); these functions only evaluate them.

import { type CapacityInputs, hasCapacity } from "./capacity";
import { type IsoDate, addDays, diffDays, isIsoDate, weekday } from "./dates";

export interface ShippingRuleInfo {
  id: string;
  name: string;
  method: "DELIVERY" | "PICKUP";
  /** ISO alpha-2 codes; empty = any country */
  countries: string[];
  /** Optional postcode prefixes (case/space-insensitive); empty = whole country */
  postcodePrefixes: string[];
  pricing: "FLAT" | "THRESHOLD";
  flatRateCents: number | null;
  freeOverCents: number | null;
  /** 0 = Sunday … 6 = Saturday */
  perishableShipDays: number[];
  shipDays: number[];
  transitDays: number;
  leadTimeDays: number;
  maxDaysAhead: number;
  isActive: boolean;
}

export interface Destination {
  country: string;
  postalCode: string;
}

const normalizePostcode = (s: string) => s.replace(/\s+/g, "").toUpperCase();

/** Does this rule serve the destination? Pickup rules ignore the address. */
export function ruleServes(rule: ShippingRuleInfo, destination: Destination | null): boolean {
  if (!rule.isActive) return false;
  if (rule.method === "PICKUP") return true;
  if (!destination) return false;
  const country = destination.country.toUpperCase();
  if (rule.countries.length > 0 && !rule.countries.map((c) => c.toUpperCase()).includes(country)) {
    return false;
  }
  if (rule.postcodePrefixes.length === 0) return true;
  const postcode = normalizePostcode(destination.postalCode);
  return rule.postcodePrefixes.some((p) => postcode.startsWith(normalizePostcode(p)));
}

/** Shipping cost for a subtotal; null when the owner hasn't set a price for this rule. */
export function shippingCost(rule: ShippingRuleInfo, subtotalCents: number): number | null {
  if (rule.flatRateCents === null) return null;
  if (rule.pricing === "THRESHOLD" && rule.freeOverCents !== null && subtotalCents >= rule.freeOverCents) {
    return 0;
  }
  return rule.flatRateCents;
}

export interface DateContext {
  today: IsoDate;
  hasPerishables: boolean;
  units: number;
  capacity: CapacityInputs;
}

export type DateRejection =
  | "INVALID_DATE"
  | "TOO_SOON"
  | "TOO_FAR"
  | "NO_DISPATCH_ON_WEEKDAY"
  | "FULLY_BOOKED";

export interface DateCheck {
  ok: boolean;
  dispatchDate: IsoDate | null;
  reason?: DateRejection;
}

export function dispatchDateFor(rule: ShippingRuleInfo, deliveryDate: IsoDate): IsoDate {
  return addDays(deliveryDate, -Math.max(rule.transitDays, 0));
}

function allowedWeekdays(rule: ShippingRuleInfo, hasPerishables: boolean): number[] {
  return hasPerishables ? rule.perishableShipDays : rule.shipDays;
}

/** Validate a requested delivery (or pickup) date against the rule and capacity. */
export function checkDeliveryDate(rule: ShippingRuleInfo, deliveryDate: string, ctx: DateContext): DateCheck {
  if (!isIsoDate(deliveryDate)) return { ok: false, dispatchDate: null, reason: "INVALID_DATE" };

  const dispatch = dispatchDateFor(rule, deliveryDate);
  if (diffDays(ctx.today, dispatch) < Math.max(rule.leadTimeDays, 0)) {
    return { ok: false, dispatchDate: dispatch, reason: "TOO_SOON" };
  }
  if (diffDays(ctx.today, deliveryDate) > rule.maxDaysAhead) {
    return { ok: false, dispatchDate: dispatch, reason: "TOO_FAR" };
  }
  if (!allowedWeekdays(rule, ctx.hasPerishables).includes(weekday(dispatch))) {
    return { ok: false, dispatchDate: dispatch, reason: "NO_DISPATCH_ON_WEEKDAY" };
  }
  if (!hasCapacity(dispatch, ctx.units, ctx.capacity)) {
    return { ok: false, dispatchDate: dispatch, reason: "FULLY_BOOKED" };
  }
  return { ok: true, dispatchDate: dispatch };
}

export interface DateOption {
  deliveryDate: IsoDate;
  dispatchDate: IsoDate;
}

/** Every bookable delivery date from today up to the rule's horizon. */
export function availableDeliveryDates(rule: ShippingRuleInfo, ctx: DateContext): DateOption[] {
  const options: DateOption[] = [];
  for (let offset = 0; offset <= rule.maxDaysAhead; offset++) {
    const date = addDays(ctx.today, offset);
    const check = checkDeliveryDate(rule, date, ctx);
    if (check.ok && check.dispatchDate) options.push({ deliveryDate: date, dispatchDate: check.dispatchDate });
  }
  return options;
}

export const DATE_REJECTION_MESSAGES: Record<DateRejection, string> = {
  INVALID_DATE: "Please choose a valid date.",
  TOO_SOON: "That date is too soon for us to prepare your order.",
  TOO_FAR: "That date is too far ahead to book yet.",
  NO_DISPATCH_ON_WEEKDAY: "We can't dispatch for that date. Please choose another day.",
  FULLY_BOOKED: "That day is fully booked. Please choose another date.",
};
