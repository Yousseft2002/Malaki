// Placeholder catalogue for MALAKI. Safe to re-run: rows are upserted by slug /
// sku and existing owner edits (prices, stock, copy) are NOT overwritten.
//
// Prices are left unset (shown as [PRICE]) because they are the owner's
// decision. For local testing of cart + checkout, run with SEED_DEMO_PRICES=true
// to fill in obviously-fake test prices and stock.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const DEMO = process.env.SEED_DEMO_PRICES === "true";

const PLACEHOLDER = {
  contents: "[CONTENTS — list what is inside the box and piece count]",
  ingredients: "[INGREDIENTS]",
  allergens: "[ALLERGENS — e.g. contains nuts, gluten, dairy, egg; confirm with your recipes]",
  storage: "[STORAGE — how to store and how long it keeps]",
  shippingInfo: "[SHIPPING TIMES — dispatch days, delivery estimate, packaging for perishables]",
};

const collections = [
  {
    slug: "gift-boxes",
    name: "Gift Boxes",
    tagline: "[COLLECTION TAGLINE]",
    description: "[COLLECTION DESCRIPTION — gift boxes]",
    imageLabel: "Gift boxes — styled overhead shot",
    sortOrder: 1,
  },
  {
    slug: "stuffed-dates",
    name: "Stuffed Dates",
    tagline: "[COLLECTION TAGLINE]",
    description: "[COLLECTION DESCRIPTION — stuffed dates]",
    imageLabel: "Stuffed dates — close-up on brass tray",
    sortOrder: 2,
  },
  {
    slug: "moroccan-cookies",
    name: "Moroccan Cookies",
    tagline: "[COLLECTION TAGLINE]",
    description: "[COLLECTION DESCRIPTION — Moroccan cookies]",
    imageLabel: "Moroccan cookies — arranged on linen",
    sortOrder: 3,
  },
];

type SeedProduct = {
  slug: string;
  name: string;
  collection: string;
  kind?: "STANDARD" | "CUSTOM_BOX";
  isSignature?: boolean;
  isPerishable?: boolean;
  sortOrder: number;
  variants: { sku: string; name: string; boxCapacity?: number }[];
  images: string[];
  pairsWith?: string[];
};

const products: SeedProduct[] = [
  {
    slug: "the-malaki-box",
    name: "The Malaki Box",
    collection: "gift-boxes",
    isSignature: true,
    sortOrder: 1,
    variants: [
      { sku: "MLK-BOX-S", name: "Small [SIZE]" },
      { sku: "MLK-BOX-L", name: "Large [SIZE]" },
    ],
    images: ["The Malaki Box — closed, emerald lid with gold star", "The Malaki Box — open, overhead", "The Malaki Box — detail of pieces"],
    pairsWith: ["stuffed-date-collection", "gazelle-horns"],
  },
  {
    slug: "stuffed-date-collection",
    name: "Stuffed Date Collection",
    collection: "stuffed-dates",
    isSignature: true,
    sortOrder: 2,
    variants: [
      { sku: "MLK-DATE-S", name: "Small [SIZE]" },
      { sku: "MLK-DATE-L", name: "Large [SIZE]" },
    ],
    images: ["Stuffed Date Collection — box open", "Stuffed dates — macro detail"],
    pairsWith: ["the-malaki-box", "ghriba-selection"],
  },
  {
    slug: "gazelle-horns",
    name: "Gazelle Horns",
    collection: "moroccan-cookies",
    isSignature: true,
    sortOrder: 3,
    variants: [
      { sku: "MLK-HORN-S", name: "Small [SIZE]" },
      { sku: "MLK-HORN-L", name: "Large [SIZE]" },
    ],
    images: ["Gazelle Horns — arranged in a box", "Gazelle Horns — single piece detail"],
    pairsWith: ["ghriba-selection", "the-malaki-box"],
  },
  {
    slug: "ghriba-selection",
    name: "Ghriba Selection",
    collection: "moroccan-cookies",
    isSignature: true,
    sortOrder: 4,
    variants: [
      { sku: "MLK-GHRIBA-S", name: "Small [SIZE]" },
      { sku: "MLK-GHRIBA-L", name: "Large [SIZE]" },
    ],
    images: ["Ghriba Selection — box open", "Ghriba — crackled tops detail"],
    pairsWith: ["gazelle-horns", "stuffed-date-collection"],
  },
  {
    slug: "build-your-own-box",
    name: "Build Your Own Box",
    collection: "gift-boxes",
    kind: "CUSTOM_BOX",
    sortOrder: 5,
    // Placeholder sizes — adjust names and capacities in the admin.
    variants: [
      { sku: "MLK-BYO-6", name: "Box of 6", boxCapacity: 6 },
      { sku: "MLK-BYO-12", name: "Box of 12", boxCapacity: 12 },
      { sku: "MLK-BYO-24", name: "Box of 24", boxCapacity: 24 },
    ],
    images: ["Build Your Own Box — empty box with dividers"],
  },
];

const boxItems = [
  { slug: "gazelle-horn", name: "Gazelle horn", imageLabel: "Gazelle horn piece", sortOrder: 1 },
  { slug: "ghriba", name: "Ghriba", imageLabel: "Ghriba piece", sortOrder: 2 },
  { slug: "stuffed-date", name: "Stuffed date", imageLabel: "Stuffed date piece", sortOrder: 3 },
];

async function main() {
  const collectionIds = new Map<string, string>();
  for (const c of collections) {
    const row = await db.collection.upsert({ where: { slug: c.slug }, update: {}, create: c });
    collectionIds.set(c.slug, row.id);
  }

  const productIds = new Map<string, string>();
  for (const p of products) {
    const row = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        kind: p.kind ?? "STANDARD",
        tagline: "[PRODUCT TAGLINE]",
        description: `[PRODUCT DESCRIPTION — ${p.name}]`,
        ...PLACEHOLDER,
        isPerishable: p.isPerishable ?? true,
        isSignature: p.isSignature ?? false,
        sortOrder: p.sortOrder,
        collectionId: collectionIds.get(p.collection),
        images: { create: p.images.map((alt, i) => ({ alt: `[PHOTO: ${alt}]`, sortOrder: i })) },
      },
    });
    productIds.set(p.slug, row.id);

    for (const [i, v] of p.variants.entries()) {
      await db.variant.upsert({
        where: { sku: v.sku },
        update: DEMO ? { priceCents: 100 * (i + 1), stock: 50 } : {},
        create: {
          productId: row.id,
          sku: v.sku,
          name: v.name,
          boxCapacity: v.boxCapacity,
          sortOrder: i,
          priceCents: DEMO ? 100 * (i + 1) : null,
          stock: DEMO ? 50 : 0,
        },
      });
    }
  }

  for (const p of products) {
    if (!p.pairsWith) continue;
    await db.product.update({
      where: { slug: p.slug },
      data: { pairsWith: { connect: p.pairsWith.map((slug) => ({ id: productIds.get(slug)! })) } },
    });
  }

  for (const item of boxItems) {
    await db.boxItem.upsert({
      where: { slug: item.slug },
      update: DEMO ? { priceCents: 10, stock: 200 } : {},
      create: {
        ...item,
        description: "[BOX ITEM DESCRIPTION]",
        allergens: "[ALLERGENS]",
        priceCents: DEMO ? 10 : null,
        stock: DEMO ? 200 : 0,
      },
    });
  }

  // Shipping rules: placeholders to review in the admin before launch.
  const rules = [
    {
      id: "seed-standard-delivery",
      name: "Standard delivery",
      description: "[SHIPPING TIMES — e.g. delivery estimate for this region]",
      method: "DELIVERY" as const,
      countries: [] as string[], // empty = any country; restrict to where you deliver
      pricing: "FLAT" as const,
      perishableShipDays: [1, 2, 3], // Mon–Wed placeholder
      shipDays: [1, 2, 3, 4, 5],
      transitDays: 1,
      leadTimeDays: 2,
      sortOrder: 1,
    },
    {
      id: "seed-local-pickup",
      name: "Collect in person",
      description: "[PICKUP DETAILS]",
      method: "PICKUP" as const,
      countries: [] as string[],
      pricing: "FLAT" as const,
      perishableShipDays: [1, 2, 3, 4, 5, 6],
      shipDays: [1, 2, 3, 4, 5, 6],
      transitDays: 0,
      leadTimeDays: 1,
      pickupInstructions: "[PICKUP ADDRESS AND OPENING HOURS]",
      sortOrder: 2,
    },
  ];
  for (const r of rules) {
    const demoPrice = r.method === "PICKUP" ? 0 : 100;
    await db.shippingRule.upsert({
      where: { id: r.id },
      update: DEMO ? { flatRateCents: demoPrice } : {},
      create: { ...r, flatRateCents: DEMO ? demoPrice : null },
    });
  }

  await db.storeSettings.upsert({
    where: { id: "store" },
    update: DEMO ? { defaultDailyCapacity: 40, giftWrapPriceCents: 50 } : {},
    create: {
      id: "store",
      defaultDailyCapacity: DEMO ? 40 : 0,
      giftWrapPriceCents: DEMO ? 50 : 0,
      announcement: "[ANNOUNCEMENT — e.g. order cut-off for the next holiday]",
      pickupAddress: "[PICKUP ADDRESS]",
    },
  });

  console.log(`Seed complete${DEMO ? " (with DEMO test prices and stock)" : ""}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
