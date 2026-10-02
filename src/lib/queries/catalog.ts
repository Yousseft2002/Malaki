import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { BoxPiece, BoxSize } from "@/lib/domain/box";
import type { Catalog, CatalogVariant } from "@/lib/domain/pricing";

const activeVariants = { where: { isActive: true }, orderBy: { sortOrder: "asc" as const } };
const images = { orderBy: { sortOrder: "asc" as const } };

export const getStoreSettings = cache(async () => {
  return (
    (await db.storeSettings.findUnique({ where: { id: "store" } })) ?? {
      id: "store",
      defaultDailyCapacity: 0,
      giftWrapPriceCents: 0,
      announcement: null,
      pickupAddress: null,
    }
  );
});

export const getCollections = cache(async () =>
  db.collection.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
);

const cardInclude = { variants: activeVariants, images: { ...images, take: 1 }, collection: true } as const;

export type ProductCardData = {
  slug: string;
  name: string;
  tagline: string | null;
  collectionName: string | null;
  fromPriceCents: number | null;
  hasMultiplePrices: boolean;
  image: { url: string | null; alt: string } | null;
};

function toCard(p: {
  slug: string;
  name: string;
  tagline: string | null;
  collection: { name: string } | null;
  variants: { priceCents: number | null }[];
  images: { url: string | null; alt: string }[];
}): ProductCardData {
  const prices = p.variants.map((v) => v.priceCents).filter((c): c is number => c !== null);
  return {
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    collectionName: p.collection?.name ?? null,
    fromPriceCents: prices.length ? Math.min(...prices) : null,
    hasMultiplePrices: new Set(prices).size > 1,
    image: p.images[0] ?? null,
  };
}

export const getSignatureProducts = cache(async () => {
  const products = await db.product.findMany({
    where: { isActive: true, isSignature: true },
    orderBy: { sortOrder: "asc" },
    include: cardInclude,
  });
  return products.map(toCard);
});

export const getCollectionWithProducts = cache(async (slug: string) => {
  const collection = await db.collection.findFirst({
    where: { slug, isActive: true },
    include: {
      products: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: cardInclude },
    },
  });
  if (!collection) return null;
  return { ...collection, products: collection.products.map(toCard) };
});

export const getProductBySlug = cache(async (slug: string) => {
  const product = await db.product.findFirst({
    where: { slug, isActive: true },
    include: {
      collection: true,
      images,
      variants: activeVariants,
      pairsWith: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: cardInclude, take: 4 },
    },
  });
  if (!product) return null;
  return { ...product, pairsWith: product.pairsWith.map(toCard) };
});

export const getAllActiveProductSlugs = cache(async () =>
  db.product.findMany({ where: { isActive: true }, select: { slug: true, kind: true, updatedAt: true } }),
);

/** Data for the build-your-own-box page. */
export const getBoxBuilderData = cache(async () => {
  const product = await db.product.findFirst({
    where: { kind: "CUSTOM_BOX", isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { images: { ...images, take: 1 }, variants: { ...activeVariants, include: { allowedItems: { select: { id: true } } } } },
  });
  if (!product) return null;
  const items = await db.boxItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });

  const sizes: BoxSize[] = product.variants
    .filter((v) => v.boxCapacity)
    .map((v) => ({
      id: v.id,
      name: v.name,
      capacity: v.boxCapacity!,
      priceCents: v.priceCents,
      stock: v.stock,
      isActive: v.isActive,
      allowedItemIds: v.allowedItems.map((i) => i.id),
    }));
  const pieces: (BoxPiece & { description: string | null; imageLabel: string | null; allergens: string | null })[] =
    items.map((i) => ({
      id: i.id,
      name: i.name,
      priceCents: i.priceCents,
      stock: i.stock,
      maxPerBox: i.maxPerBox,
      isActive: i.isActive,
      description: i.description,
      imageLabel: i.imageLabel,
      allergens: i.allergens,
    }));

  return { product, sizes, pieces };
});

/** Everything priceCart() needs for the given variant ids, fresh from the database. */
export async function loadPricingCatalog(variantIds: string[]): Promise<Catalog> {
  const [variants, boxItems] = await Promise.all([
    db.variant.findMany({
      where: { id: { in: [...new Set(variantIds)] } },
      include: { product: true, allowedItems: { select: { id: true } } },
    }),
    db.boxItem.findMany(),
  ]);
  const map = new Map<string, CatalogVariant>(
    variants.map((v) => [
      v.id,
      {
        id: v.id,
        productId: v.productId,
        productName: v.product.name,
        variantName: v.name,
        kind: v.product.kind,
        priceCents: v.priceCents,
        stock: v.stock,
        isActive: v.isActive && v.product.isActive,
        isPerishable: v.product.isPerishable,
        boxCapacity: v.boxCapacity,
        allowedItemIds: v.allowedItems.map((i) => i.id),
      },
    ]),
  );
  return {
    variants: map,
    boxItems: boxItems.map((i) => ({
      id: i.id,
      name: i.name,
      priceCents: i.priceCents,
      stock: i.stock,
      maxPerBox: i.maxPerBox,
      isActive: i.isActive,
    })),
  };
}
