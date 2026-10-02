// Daily production capacity. Capacity is counted in "units" (one per box /
// item on an order) against the order's dispatch date.

import type { IsoDate } from "./dates";

export interface CapacityInputs {
  /** Default daily capacity from StoreSettings. 0 = no limit configured. */
  defaultCapacity: number;
  /** Per-date overrides from ProductionCapacity (0 closes the day). */
  overrides: Map<IsoDate, number>;
  /** Units already booked by paid / held orders, per dispatch date. */
  booked: Map<IsoDate, number>;
}

/** Remaining units for a date; Infinity when no limit applies. */
export function remainingCapacity(date: IsoDate, inputs: CapacityInputs): number {
  const override = inputs.overrides.get(date);
  const capacity = override ?? (inputs.defaultCapacity > 0 ? inputs.defaultCapacity : Infinity);
  return Math.max(capacity - (inputs.booked.get(date) ?? 0), 0);
}

export function hasCapacity(date: IsoDate, units: number, inputs: CapacityInputs): boolean {
  return remainingCapacity(date, inputs) >= units;
}
