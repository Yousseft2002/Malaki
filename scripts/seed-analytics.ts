// LOCAL ONLY: fills the database with realistic-looking paid orders and page
// views spread over the past 60 days, so /admin/analytics can be checked.
//
//   npm run db:seed:analytics          (re-running replaces the previous sample)
//
// Refuses to run in production or against a non-local database. Sample rows
// are tagged (buyer emails @analytics-sample.test, visitor hashes "sample-")
// so they can be told apart and are removed on the next run.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL ?? "";
const host = (() => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
})();
if (process.env.NODE_ENV === "production" || process.env.VERCEL || !["localhost", "127.0.0.1", "::1"].includes(host)) {
  console.error("Refusing to seed sample analytics: this only runs against a local database (DATABASE_URL on localhost), never in production.");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 1 }) });
const DOMAIN = "@analytics-sample.test";
const DAYS = 60;

// Deterministic pseudo-random numbers, so every run produces the same picture.
let seed = 20261002;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)]!;

const CAMPAIGNS = [
  { utmSource: "instagram", utmMedium: "paid", utmCampaign: "Eid gift boxes" },
  { utmSource: "instagram", utmMedium: "paid", utmCampaign: "Wedding favours" },
  { utmSource: "facebook", utmMedium: "paid", utmCampaign: "Eid gift boxes" },
];
const PATHS = ["/", "/", "/", "/collections/gift-boxes", "/products/the-malaki-box", "/build-your-own-box", "/cart", "/checkout", "/our-story", "/products/gazelle-horns"];
const REFERRERS = [null, null, "l.instagram.com", "www.google.com", "m.facebook.com", "www.pinterest.com"];

async function main() {
  const variants = await db.variant.findMany({ where: { isActive: true }, include: { product: true }, take: 12 });
  if (variants.length === 0) throw new Error("No products found. Run `npm run db:seed` first.");

  // Clear the previous sample.
  await db.order.deleteMany({ where: { buyerEmail: { endsWith: DOMAIN } } });
  await db.customer.deleteMany({ where: { email: { endsWith: DOMAIN } } });
  await db.pageView.deleteMany({ where: { visitorHash: { startsWith: "sample-" } } });

  const now = Date.now();
  let orders = 0;
  let views = 0;
  for (let day = DAYS; day >= 0; day--) {
    // A gentle upward trend with weekend peaks.
    const date = new Date(now - day * 86_400_000);
    const weekend = [0, 6].includes(date.getUTCDay());
    const level = 0.6 + (DAYS - day) / DAYS;

    const visitorsToday = Math.round((40 + rand() * 60) * level * (weekend ? 1.4 : 1));
    const viewRows = [];
    for (let v = 0; v < visitorsToday; v++) {
      const hash = `sample-${day}-${v}`;
      const ad = rand() < 0.35 ? pick(CAMPAIGNS) : null;
      const referrer = ad ? (ad.utmSource === "instagram" ? "l.instagram.com" : "m.facebook.com") : pick(REFERRERS);
      const isMobile = rand() < 0.78;
      const pages = 1 + Math.floor(rand() * 4);
      const start = date.getTime() - Math.floor(rand() * 14 * 3_600_000);
      for (let p = 0; p < pages; p++) {
        viewRows.push({
          path: p === 0 ? pick(PATHS) : pick(PATHS.slice(3)),
          referrer: p === 0 ? referrer : null,
          utmSource: p === 0 ? (ad?.utmSource ?? null) : null,
          utmMedium: p === 0 ? (ad?.utmMedium ?? null) : null,
          utmCampaign: p === 0 ? (ad?.utmCampaign ?? null) : null,
          visitorHash: hash,
          isMobile,
          createdAt: new Date(start + p * 60_000),
        });
      }
    }
    await db.pageView.createMany({ data: viewRows });
    views += viewRows.length;

    const ordersToday = Math.round(rand() * 3 * level * (weekend ? 1.5 : 1));
    for (let o = 0; o < ordersToday; o++) {
      const lines = Array.from({ length: 1 + Math.floor(rand() * 2) }, () => {
        const v = pick(variants);
        // Sample prices (not the catalogue's), so the charts look like a real shop.
        const unit = 1800 + Math.floor(rand() * 8) * 600;
        const quantity = 1 + Math.floor(rand() * 2);
        return { v, unit, quantity };
      });
      const subtotal = lines.reduce((s, l) => s + l.unit * l.quantity, 0);
      const ad = rand() < 0.45 ? pick(CAMPAIGNS) : null;
      const paidAt = new Date(date.getTime() - Math.floor(rand() * 20 * 3_600_000));
      const email = `buyer-${day}-${o}${DOMAIN}`;
      const customer = await db.customer.create({ data: { email, name: "Sample Buyer" } });
      await db.order.create({
        data: {
          number: `MLK-S${day}${o}${Math.floor(rand() * 1e4)}`,
          status: day > 10 ? "SHIPPED" : day > 3 ? pick(["PAID", "PACKED", "SHIPPED"] as const) : "PAID",
          customerId: customer.id,
          buyerName: "Sample Buyer",
          buyerEmail: email,
          fulfilment: "DELIVERY",
          shippingRuleName: "Sample delivery",
          dispatchDate: new Date(Date.UTC(paidAt.getUTCFullYear(), paidAt.getUTCMonth(), paidAt.getUTCDate() + 2)),
          currency: "USD",
          subtotalCents: subtotal,
          shippingCents: 0,
          totalCents: subtotal,
          capacityUnits: lines.reduce((s, l) => s + l.quantity, 0),
          paidAt,
          createdAt: paidAt,
          ...(ad ?? {}),
          items: {
            create: lines.map((l) => ({
              productId: l.v.productId,
              variantId: l.v.id,
              productName: l.v.product.name,
              variantName: l.v.name,
              unitPriceCents: l.unit,
              quantity: l.quantity,
              lineTotalCents: l.unit * l.quantity,
            })),
          },
        },
      });
      orders++;
    }
  }
  console.log(`Sample analytics: ${orders} paid orders and ${views} page views over ${DAYS} days.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
