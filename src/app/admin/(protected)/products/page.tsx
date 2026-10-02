import Link from "next/link";
import { createProduct } from "@/app/admin/actions/catalog";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminInput } from "@/components/admin/inputs";
import { money } from "@/components/ui/price";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  await requireAdmin();
  const [products, collections] = await Promise.all([
    db.product.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }], include: { collection: true, variants: true } }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <h1 className="mb-6 text-3xl text-emerald">Products</h1>
      <div className="mb-10 overflow-x-auto border border-sand bg-ivory">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-sand">
            <tr>
              <th scope="col" className="p-3">Product</th>
              <th scope="col" className="p-3">Collection</th>
              <th scope="col" className="p-3">Visible</th>
              <th scope="col" className="p-3">Prices</th>
              <th scope="col" className="p-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const unpriced = p.variants.filter((v) => v.priceCents === null).length;
              const prices = p.variants.map((v) => v.priceCents).filter((c): c is number => c !== null);
              return (
                <tr key={p.id} className="border-t border-sand">
                  <th scope="row" className="p-3 font-medium">
                    <Link href={`/admin/products/${p.id}`} className="text-emerald underline underline-offset-4">
                      {p.name}
                    </Link>
                    {p.kind === "CUSTOM_BOX" && <span className="ml-2 text-xs text-muted">(build-your-own)</span>}
                  </th>
                  <td className="p-3">{p.collection?.name ?? "—"}</td>
                  <td className="p-3">{p.isActive ? "Yes" : "Hidden"}</td>
                  <td className="p-3">
                    {prices.length ? `${money(Math.min(...prices))}–${money(Math.max(...prices))}` : "—"}
                    {unpriced > 0 && <span className="block text-xs text-error">{unpriced} variant(s) without a price</span>}
                  </td>
                  <td className="p-3">{p.variants.map((v) => `${v.name}: ${v.stock}`).join(" · ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section aria-labelledby="new-product" className="max-w-xl border border-sand bg-ivory p-5">
        <h2 id="new-product" className="eyebrow mb-4 text-emerald">
          New product
        </h2>
        <AdminForm action={createProduct} submitLabel="Create product">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminInput id="np-name" name="name" label="Name" required />
            <div>
              <label htmlFor="np-collection" className="mb-1 block text-xs font-medium text-muted">
                Collection
              </label>
              <select id="np-collection" name="collectionId" className="field-input min-h-11 py-2 text-sm">
                <option value="">None</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">New products start hidden. Add variants and prices, then tick “Visible in shop”.</p>
        </AdminForm>
      </section>
    </>
  );
}
