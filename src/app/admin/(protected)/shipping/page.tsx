import { saveCapacityOverride, saveSettings, saveShippingRule } from "@/app/admin/actions/operations";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminCheckbox, AdminInput, AdminTextarea } from "@/components/admin/inputs";
import { formatMoneyInput } from "@/lib/admin/forms";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { fromUtcDate, todayIn, toUtcDate } from "@/lib/domain/dates";
import { env } from "@/lib/env";
import { loadCapacityInputs } from "@/lib/queries/shipping";

export const metadata = { title: "Shipping & capacity" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function WeekdayBoxes({ name, legend, values }: { name: string; legend: string; values: number[] }) {
  return (
    <fieldset>
      <legend className="mb-1 text-xs font-medium text-muted">{legend}</legend>
      <div className="flex flex-wrap gap-x-3">
        {DAYS.map((d, i) => (
          <AdminCheckbox key={d} name={name} value={String(i)} label={d} defaultChecked={values.includes(i)} />
        ))}
      </div>
    </fieldset>
  );
}

export default async function AdminShippingPage() {
  await requireAdmin();
  const config = env();
  const today = todayIn(config.STORE_TIMEZONE);
  const [rules, settings, overrides] = await Promise.all([
    db.shippingRule.findMany({ orderBy: { sortOrder: "asc" } }),
    db.storeSettings.findUnique({ where: { id: "store" } }),
    db.productionCapacity.findMany({ where: { date: { gte: toUtcDate(today) } }, orderBy: { date: "asc" } }),
  ]);
  const horizon = overrides.length ? fromUtcDate(overrides[overrides.length - 1]!.date) : today;
  const capacity = await loadCapacityInputs(today, horizon, config.CHECKOUT_HOLD_MINUTES);

  return (
    <>
      <h1 className="mb-8 text-3xl text-emerald">Shipping &amp; capacity</h1>

      <section aria-labelledby="settings-title" className="mb-10 border border-sand bg-ivory p-5">
        <h2 id="settings-title" className="eyebrow mb-4 text-emerald">
          Store settings
        </h2>
        <AdminForm action={saveSettings}>
          <div className="grid gap-4 md:grid-cols-2">
            <AdminInput
              id="s-cap"
              name="defaultDailyCapacity"
              label="Default daily production capacity (units; 0 = no limit)"
              defaultValue={settings?.defaultDailyCapacity ?? 0}
              inputMode="numeric"
            />
            <AdminInput id="s-wrap" name="giftWrapPrice" label="Gift wrap price per item" defaultValue={formatMoneyInput(settings?.giftWrapPriceCents ?? 0)} inputMode="decimal" />
            <AdminInput id="s-ann" name="announcement" label="Announcement bar (empty hides it)" defaultValue={settings?.announcement ?? ""} />
            <AdminTextarea id="s-pickup" name="pickupAddress" label="Pickup address" defaultValue={settings?.pickupAddress ?? ""} />
          </div>
        </AdminForm>
      </section>

      <section aria-labelledby="capacity-title" className="mb-10 border border-sand bg-ivory p-5">
        <h2 id="capacity-title" className="eyebrow mb-1 text-emerald">
          Capacity overrides
        </h2>
        <p className="mb-4 text-sm text-muted">
          Change capacity for specific dispatch days (e.g. holidays). 0 closes the day. Booked = paid orders plus checkouts in progress.
        </p>
        {overrides.length > 0 && (
          <table className="mb-6 w-full max-w-xl text-left text-sm">
            <thead>
              <tr className="border-b border-sand">
                <th scope="col" className="py-2">Date</th>
                <th scope="col" className="py-2">Capacity</th>
                <th scope="col" className="py-2">Booked</th>
                <th scope="col" className="py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((o) => {
                const d = fromUtcDate(o.date);
                return (
                  <tr key={o.id} className="border-b border-sand">
                    <td className="py-2">{d}</td>
                    <td className="py-2">{o.capacityUnits === 0 ? "Closed" : o.capacityUnits}</td>
                    <td className="py-2">{capacity.booked.get(d) ?? 0}</td>
                    <td className="py-2">{o.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <AdminForm action={saveCapacityOverride} submitLabel="Save override">
          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            <AdminInput id="c-date" name="date" type="date" label="Dispatch date" min={today} required />
            <AdminInput id="c-units" name="capacityUnits" label="Capacity (units)" inputMode="numeric" />
            <AdminInput id="c-note" name="note" label="Note" />
          </div>
          <AdminCheckbox name="remove" label="Remove the override for this date instead" />
        </AdminForm>
      </section>

      <h2 className="mb-4 font-display text-2xl text-emerald">Delivery &amp; pickup options</h2>
      <div className="flex flex-col gap-6">
        {[...rules, null].map((r) => {
          const key = r?.id ?? "new";
          return (
            <section key={key} aria-label={r?.name ?? "New shipping option"} className="border border-sand bg-ivory p-5">
              {!r && <h3 className="eyebrow mb-4 text-emerald">Add an option</h3>}
              <AdminForm action={saveShippingRule} submitLabel={r ? "Save" : "Add option"}>
                <input type="hidden" name="id" value={r?.id ?? ""} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <AdminInput id={`r-${key}-name`} name="name" label="Name shown at checkout" defaultValue={r?.name ?? ""} required className="lg:col-span-2" />
                  <div>
                    <label htmlFor={`r-${key}-method`} className="mb-1 block text-xs font-medium text-muted">
                      Type
                    </label>
                    <select id={`r-${key}-method`} name="method" defaultValue={r?.method ?? "DELIVERY"} className="field-input min-h-11 py-2 text-sm">
                      <option value="DELIVERY">Delivery</option>
                      <option value="PICKUP">Local pickup</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`r-${key}-pricing`} className="mb-1 block text-xs font-medium text-muted">
                      Pricing
                    </label>
                    <select id={`r-${key}-pricing`} name="pricing" defaultValue={r?.pricing ?? "FLAT"} className="field-input min-h-11 py-2 text-sm">
                      <option value="FLAT">Flat rate</option>
                      <option value="THRESHOLD">Flat, free over a threshold</option>
                    </select>
                  </div>
                  <AdminInput id={`r-${key}-flat`} name="flatRate" label="Rate (empty = unavailable)" defaultValue={formatMoneyInput(r?.flatRateCents)} inputMode="decimal" placeholder="[PRICE]" />
                  <AdminInput id={`r-${key}-free`} name="freeOver" label="Free over" defaultValue={formatMoneyInput(r?.freeOverCents)} inputMode="decimal" />
                  <AdminInput id={`r-${key}-countries`} name="countries" label="Countries (e.g. US CA; empty = any)" defaultValue={r?.countries.join(" ") ?? ""} />
                  <AdminInput id={`r-${key}-postcodes`} name="postcodePrefixes" label="ZIP code prefixes (optional)" defaultValue={r?.postcodePrefixes.join(" ") ?? ""} />
                  <AdminInput id={`r-${key}-lead`} name="leadTimeDays" label="Lead time (days before dispatch)" defaultValue={r?.leadTimeDays ?? 1} inputMode="numeric" />
                  <AdminInput id={`r-${key}-transit`} name="transitDays" label="Transit (days dispatch → delivery)" defaultValue={r?.transitDays ?? 0} inputMode="numeric" />
                  <AdminInput id={`r-${key}-ahead`} name="maxDaysAhead" label="Bookable up to (days ahead)" defaultValue={r?.maxDaysAhead ?? 60} inputMode="numeric" />
                  <AdminInput id={`r-${key}-sort`} name="sortOrder" label="Sort" defaultValue={r?.sortOrder ?? 0} inputMode="numeric" />
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <WeekdayBoxes name="perishableShipDays" legend="Dispatch days for perishable orders" values={r?.perishableShipDays ?? [1, 2, 3]} />
                  <WeekdayBoxes name="shipDays" legend="Dispatch days for other orders" values={r?.shipDays ?? [1, 2, 3, 4, 5]} />
                  <AdminTextarea id={`r-${key}-desc`} name="description" label="Description shown at checkout" defaultValue={r?.description ?? ""} />
                  <AdminTextarea id={`r-${key}-pickup`} name="pickupInstructions" label="Pickup instructions (pickup only)" defaultValue={r?.pickupInstructions ?? ""} />
                </div>
                <AdminCheckbox name="isActive" label="Offered at checkout" defaultChecked={r?.isActive ?? true} />
              </AdminForm>
            </section>
          );
        })}
      </div>
    </>
  );
}
