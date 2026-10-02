"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { parseIntInput, parseMoneyInput, slugify } from "@/lib/admin/forms";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { FormState } from "@/lib/validation/schemas";

const ok = (message = "Saved."): FormState => ({ status: "success", message });
const bad = (message: string): FormState => ({ status: "error", message });

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const optStr = (f: FormData, k: string, max = 5000) => str(f, k).slice(0, max) || null;
const bool = (f: FormData, k: string) => f.get(k) === "on";

function refreshShop() {
  revalidatePath("/", "layout");
}

function uniqueError(err: unknown, what: string): FormState | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return bad(`That ${what} is already in use.`);
  return null;
}

/** Image URLs must be site-relative (/images/…) or https. */
function validImageUrl(url: string | null): boolean {
  return url === null || url.startsWith("/") || /^https:\/\/[^\s]+$/.test(url);
}

// ─── Products ───────────────────────────────────────────────────────────────

export async function createProduct(_prev: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const name = str(f, "name");
  if (!name) return bad("Please enter a name.");
  const kind = f.get("kind") === "CUSTOM_BOX" ? "CUSTOM_BOX" : "STANDARD";
  let id: string;
  try {
    const product = await db.product.create({
      data: {
        name,
        slug: slugify(name),
        kind,
        isActive: false, // stays hidden until the owner fills it in and activates it
        collectionId: str(f, "collectionId") || null,
        images: { create: { alt: `[PHOTO: ${name}]` } },
      },
    });
    id = product.id;
  } catch (err) {
    return uniqueError(err, "name / slug") ?? bad("Could not create the product.");
  }
  logger.info("admin.product_created", { productId: id });
  redirect(`/admin/products/${id}`);
}

export async function updateProduct(_prev: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(f, "id");
  const name = str(f, "name");
  const slug = slugify(str(f, "slug") || name);
  if (!name || !slug) return bad("Name and URL slug are required.");
  const sortOrder = parseIntInput(f.get("sortOrder"), 0);
  if (sortOrder === undefined) return bad("Sort order must be a whole number.");
  try {
    await db.product.update({
      where: { id },
      data: {
        name,
        slug,
        tagline: optStr(f, "tagline", 200),
        description: optStr(f, "description"),
        contents: optStr(f, "contents"),
        ingredients: optStr(f, "ingredients"),
        allergens: optStr(f, "allergens"),
        storage: optStr(f, "storage"),
        shippingInfo: optStr(f, "shippingInfo"),
        collectionId: str(f, "collectionId") || null,
        isActive: bool(f, "isActive"),
        isSignature: bool(f, "isSignature"),
        isPerishable: bool(f, "isPerishable"),
        sortOrder: sortOrder ?? 0,
      },
    });
  } catch (err) {
    return uniqueError(err, "URL slug") ?? bad("Could not save the product.");
  }
  refreshShop();
  return ok();
}

export async function updatePairings(_prev: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(f, "id");
  const ids = f.getAll("pairsWith").map(String).filter((p) => p !== id);
  await db.product.update({ where: { id }, data: { pairsWith: { set: ids.map((pid) => ({ id: pid })) } } });
  refreshShop();
  return ok("Pairings saved.");
}

// ─── Variants (sizes, prices, stock) ───────────────────────────────────────

export async function saveVariant(_prev: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(f, "id");
  const productId = str(f, "productId");
  const name = str(f, "name");
  const sku = str(f, "sku").toUpperCase();
  const priceCents = parseMoneyInput(f.get("price"));
  const stock = parseIntInput(f.get("stock"), 0);
  const boxCapacity = parseIntInput(f.get("boxCapacity"), null);
  const sortOrder = parseIntInput(f.get("sortOrder"), 0);
  if (!name || !sku) return bad("Name and SKU are required.");
  if (priceCents === undefined) return bad("Price must look like 12.50 (or be left empty).");
  if (stock === undefined || stock === null) return bad("Stock must be a whole number.");
  if (boxCapacity === undefined) return bad("Box capacity must be a whole number.");
  if (sortOrder === undefined) return bad("Sort order must be a whole number.");

  const data = { name, sku, priceCents, stock, boxCapacity, sortOrder: sortOrder ?? 0, isActive: bool(f, "isActive") };
  try {
    if (id) await db.variant.update({ where: { id }, data });
    else await db.variant.create({ data: { ...data, productId } });
  } catch (err) {
    return uniqueError(err, "SKU") ?? bad("Could not save the variant.");
  }
  logger.info("admin.variant_saved", { variantId: id || "new", productId });
  refreshShop();
  return ok(id ? "Saved." : "Variant added.");
}

// ─── Images ─────────────────────────────────────────────────────────────────

export async function saveImage(_prev: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(f, "id");
  const url = optStr(f, "url", 1000);
  const alt = str(f, "alt");
  const sortOrder = parseIntInput(f.get("sortOrder"), 0);
  if (!alt) return bad("Alt text is required (describe the photo for screen readers).");
  if (!validImageUrl(url)) return bad("Image URL must start with / or https://");
  if (sortOrder === undefined) return bad("Sort order must be a whole number.");

  if (f.get("delete") === "on" && id) {
    await db.productImage.delete({ where: { id } });
  } else if (id) {
    await db.productImage.update({ where: { id }, data: { url, alt, sortOrder: sortOrder ?? 0 } });
  } else {
    await db.productImage.create({ data: { productId: str(f, "productId"), url, alt, sortOrder: sortOrder ?? 0 } });
  }
  refreshShop();
  return ok();
}

// ─── Box items ──────────────────────────────────────────────────────────────

export async function saveBoxItem(_prev: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(f, "id");
  const name = str(f, "name");
  const priceCents = parseMoneyInput(f.get("price"));
  const stock = parseIntInput(f.get("stock"), 0);
  const maxPerBox = parseIntInput(f.get("maxPerBox"), null);
  const sortOrder = parseIntInput(f.get("sortOrder"), 0);
  if (!name) return bad("Name is required.");
  if (priceCents === undefined) return bad("Price must look like 1.50 (or be left empty).");
  if (stock === undefined || stock === null) return bad("Stock must be a whole number.");
  if (maxPerBox === undefined || maxPerBox === 0) return bad("Max per box must be a positive whole number, or empty for no limit.");
  if (sortOrder === undefined) return bad("Sort order must be a whole number.");

  const eligible = f.getAll("eligibleBoxes").map(String);
  const data = {
    name,
    description: optStr(f, "description", 500),
    allergens: optStr(f, "allergens", 500),
    imageLabel: optStr(f, "imageLabel", 200),
    priceCents,
    stock,
    maxPerBox,
    sortOrder: sortOrder ?? 0,
    isActive: bool(f, "isActive"),
  };
  try {
    if (id) {
      await db.boxItem.update({ where: { id }, data: { ...data, eligibleBoxes: { set: eligible.map((v) => ({ id: v })) } } });
    } else {
      await db.boxItem.create({ data: { ...data, slug: slugify(name), eligibleBoxes: { connect: eligible.map((v) => ({ id: v })) } } });
    }
  } catch (err) {
    return uniqueError(err, "name") ?? bad("Could not save the box item.");
  }
  refreshShop();
  return ok(id ? "Saved." : "Box item added.");
}
