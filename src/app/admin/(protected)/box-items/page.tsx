import { saveBoxItem } from "@/app/admin/actions/catalog";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminCheckbox, AdminInput } from "@/components/admin/inputs";
import { formatMoneyInput } from "@/lib/admin/forms";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { STORE_CURRENCY } from "@/lib/store-config";

export const metadata = { title: "Box items" };

export default async function AdminBoxItemsPage() {
  await requireAdmin();
  const [items, boxSizes] = await Promise.all([
    db.boxItem.findMany({ orderBy: { sortOrder: "asc" }, include: { eligibleBoxes: { select: { id: true } } } }),
    db.variant.findMany({ where: { product: { kind: "CUSTOM_BOX" } }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <h1 className="mb-2 text-3xl text-emerald">Box items</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Pieces customers can choose in “Build your own box”. Prices are per piece in {STORE_CURRENCY}, added to the box price. If no box sizes are ticked, the
        piece can go in every box.
      </p>
      <div className="flex flex-col gap-6">
        {[...items, null].map((item) => {
          const key = item?.id ?? "new";
          const eligible = new Set(item?.eligibleBoxes.map((b) => b.id));
          return (
            <section key={key} aria-label={item?.name ?? "New box item"} className="border border-sand bg-ivory p-5">
              {!item && <h2 className="eyebrow mb-4 text-emerald">Add a box item</h2>}
              <AdminForm action={saveBoxItem} submitLabel={item ? "Save" : "Add item"}>
                <input type="hidden" name="id" value={item?.id ?? ""} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  <AdminInput id={`b-${key}-name`} name="name" label="Name" defaultValue={item?.name ?? ""} required className="lg:col-span-2" />
                  <AdminInput id={`b-${key}-price`} name="price" label="Price per piece" defaultValue={formatMoneyInput(item?.priceCents)} inputMode="decimal" placeholder="[PRICE]" />
                  <AdminInput id={`b-${key}-stock`} name="stock" label="Stock (pieces)" defaultValue={item?.stock ?? 0} inputMode="numeric" />
                  <AdminInput id={`b-${key}-max`} name="maxPerBox" label="Max per box" defaultValue={item?.maxPerBox ?? ""} inputMode="numeric" placeholder="No limit" />
                  <AdminInput id={`b-${key}-sort`} name="sortOrder" label="Sort" defaultValue={item?.sortOrder ?? 0} inputMode="numeric" />
                  <AdminInput id={`b-${key}-desc`} name="description" label="Description" defaultValue={item?.description ?? ""} className="lg:col-span-2" />
                  <AdminInput id={`b-${key}-allergens`} name="allergens" label="Allergens" defaultValue={item?.allergens ?? ""} className="lg:col-span-2" />
                  <AdminInput id={`b-${key}-img`} name="imageLabel" label="Image placeholder label" defaultValue={item?.imageLabel ?? ""} className="lg:col-span-2" />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-6">
                  <AdminCheckbox name="isActive" label="Available" defaultChecked={item?.isActive ?? true} />
                  <fieldset className="flex flex-wrap items-center gap-x-4">
                    <legend className="sr-only">Allowed in box sizes</legend>
                    <span className="text-sm text-muted" aria-hidden="true">
                      Allowed in:
                    </span>
                    {boxSizes.map((b) => (
                      <AdminCheckbox key={b.id} name="eligibleBoxes" value={b.id} label={b.name} defaultChecked={eligible.has(b.id)} />
                    ))}
                  </fieldset>
                </div>
              </AdminForm>
            </section>
          );
        })}
      </div>
    </>
  );
}
