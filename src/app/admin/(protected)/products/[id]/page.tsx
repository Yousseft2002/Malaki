import Link from "next/link";
import { notFound } from "next/navigation";
import { saveImage, saveVariant, updatePairings, updateProduct } from "@/app/admin/actions/catalog";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminCheckbox, AdminInput, AdminTextarea } from "@/components/admin/inputs";
import { formatMoneyInput } from "@/lib/admin/forms";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { STORE_CURRENCY } from "@/lib/store-config";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProductPage({ params }: Props) {
  await requireAdmin();
  const id = (await params).id;
  const [product, collections, others] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { variants: { orderBy: { sortOrder: "asc" } }, images: { orderBy: { sortOrder: "asc" } }, pairsWith: { select: { id: true } } },
    }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({ where: { id: { not: id } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();
  const isBox = product.kind === "CUSTOM_BOX";
  const paired = new Set(product.pairsWith.map((p) => p.id));

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/products" className="underline">
          ← Products
        </Link>
      </p>
      <div className="mb-8 flex flex-wrap items-baseline gap-4">
        <h1 className="text-3xl text-emerald">{product.name}</h1>
        {product.isActive && (
          <Link href={`/products/${product.slug}`} target="_blank" className="text-sm underline">
            View in shop ↗
          </Link>
        )}
      </div>

      <section aria-labelledby="details-title" className="mb-8 border border-sand bg-white p-5">
        <h2 id="details-title" className="eyebrow mb-4 text-emerald">
          Details
        </h2>
        <AdminForm action={updateProduct}>
          <input type="hidden" name="id" value={product.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <AdminInput id="p-name" name="name" label="Name" defaultValue={product.name} required />
            <AdminInput id="p-slug" name="slug" label="URL slug" defaultValue={product.slug} />
            <AdminInput id="p-tagline" name="tagline" label="Tagline" defaultValue={product.tagline ?? ""} />
            <div>
              <label htmlFor="p-collection" className="mb-1 block text-xs font-medium text-muted">
                Collection
              </label>
              <select id="p-collection" name="collectionId" defaultValue={product.collectionId ?? ""} className="field-input min-h-11 py-2 text-sm">
                <option value="">None</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <AdminTextarea id="p-description" name="description" label="Description" defaultValue={product.description ?? ""} />
            <AdminTextarea id="p-contents" name="contents" label="What's inside" defaultValue={product.contents ?? ""} />
            <AdminTextarea id="p-ingredients" name="ingredients" label="Ingredients" defaultValue={product.ingredients ?? ""} />
            <AdminTextarea id="p-allergens" name="allergens" label="Allergens" defaultValue={product.allergens ?? ""} />
            <AdminTextarea id="p-storage" name="storage" label="Storage" defaultValue={product.storage ?? ""} />
            <AdminTextarea id="p-shipping" name="shippingInfo" label="Shipping" defaultValue={product.shippingInfo ?? ""} />
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-x-6">
            <AdminCheckbox name="isActive" label="Visible in shop" defaultChecked={product.isActive} />
            <AdminCheckbox name="isSignature" label="In homepage signature collection" defaultChecked={product.isSignature} />
            <AdminCheckbox name="isPerishable" label="Perishable (limits dispatch days)" defaultChecked={product.isPerishable} />
            <AdminInput id="p-sort" name="sortOrder" label="Sort order" defaultValue={product.sortOrder} inputMode="numeric" className="w-28" />
          </div>
        </AdminForm>
      </section>

      <section aria-labelledby="variants-title" className="mb-8 border border-sand bg-white p-5">
        <h2 id="variants-title" className="eyebrow mb-1 text-emerald">
          {isBox ? "Box sizes" : "Sizes, prices & stock"}
        </h2>
        <p className="mb-4 text-sm text-muted">
          Prices in {STORE_CURRENCY}. Leave the price empty to show [PRICE] and stop the item being sold.
          {isBox && " Box price is charged on top of the pieces chosen."}
        </p>
        <div className="divide-y divide-sand">
          {[...product.variants, null].map((v) => {
            const key = v?.id ?? "new";
            return (
              <AdminForm key={key} action={saveVariant} submitLabel={v ? "Save" : "Add variant"} className="py-4">
                <input type="hidden" name="id" value={v?.id ?? ""} />
                <input type="hidden" name="productId" value={product.id} />
                {!v && <p className="mb-2 text-sm font-medium">Add a variant</p>}
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <AdminInput id={`v-${key}-name`} name="name" label="Name" defaultValue={v?.name ?? ""} required />
                  <AdminInput id={`v-${key}-sku`} name="sku" label="SKU" defaultValue={v?.sku ?? ""} required />
                  <AdminInput id={`v-${key}-price`} name="price" label="Price" defaultValue={formatMoneyInput(v?.priceCents)} inputMode="decimal" placeholder="[PRICE]" />
                  <AdminInput id={`v-${key}-stock`} name="stock" label="Stock" defaultValue={v?.stock ?? 0} inputMode="numeric" />
                  {isBox && <AdminInput id={`v-${key}-cap`} name="boxCapacity" label="Pieces per box" defaultValue={v?.boxCapacity ?? ""} inputMode="numeric" />}
                  <AdminInput id={`v-${key}-sort`} name="sortOrder" label="Sort" defaultValue={v?.sortOrder ?? 0} inputMode="numeric" />
                </div>
                <AdminCheckbox name="isActive" label="Available" defaultChecked={v?.isActive ?? true} />
              </AdminForm>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="images-title" className="mb-8 border border-sand bg-white p-5">
        <h2 id="images-title" className="eyebrow mb-1 text-emerald">
          Images
        </h2>
        <p className="mb-4 text-sm text-muted">
          Use a path like <code>/images/malaki-box-1.jpg</code> (file in <code>public/images</code>) or an https URL from an allowed image host. Empty URL shows a labelled placeholder.
        </p>
        <div className="divide-y divide-sand">
          {[...product.images, null].map((img) => {
            const key = img?.id ?? "new";
            return (
              <AdminForm key={key} action={saveImage} submitLabel={img ? "Save" : "Add image"} className="py-4">
                <input type="hidden" name="id" value={img?.id ?? ""} />
                <input type="hidden" name="productId" value={product.id} />
                <div className="grid gap-3 md:grid-cols-[2fr_2fr_6rem]">
                  <AdminInput id={`i-${key}-url`} name="url" label="Image URL" defaultValue={img?.url ?? ""} />
                  <AdminInput id={`i-${key}-alt`} name="alt" label="Alt text" defaultValue={img?.alt ?? ""} required />
                  <AdminInput id={`i-${key}-sort`} name="sortOrder" label="Sort" defaultValue={img?.sortOrder ?? 0} inputMode="numeric" />
                </div>
                {img && <AdminCheckbox name="delete" label="Delete this image" />}
              </AdminForm>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="pairs-title" className="border border-sand bg-white p-5">
        <h2 id="pairs-title" className="eyebrow mb-4 text-emerald">
          Pairs well with
        </h2>
        <AdminForm action={updatePairings}>
          <input type="hidden" name="id" value={product.id} />
          <fieldset>
            <legend className="sr-only">Products shown in “Pairs well with”</legend>
            <div className="flex flex-wrap gap-x-6">
              {others.map((o) => (
                <AdminCheckbox key={o.id} name="pairsWith" value={o.id} label={o.name} defaultChecked={paired.has(o.id)} />
              ))}
            </div>
          </fieldset>
        </AdminForm>
      </section>
    </>
  );
}
