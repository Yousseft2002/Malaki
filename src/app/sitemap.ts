import type { MetadataRoute } from "next";
import { LEGAL_PAGES } from "@/content/legal";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { SITE_URL } from "@/lib/store-config";

// Generated per request from the database (no DB needed at build time).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed: MetadataRoute.Sitemap = ["", "/build-your-own-box", "/enquiries", "/our-story", ...LEGAL_PAGES.map((p) => `/legal/${p.slug}`)].map(
    (path) => ({ url: `${SITE_URL}${path}`, changeFrequency: "weekly", priority: path === "" ? 1 : 0.5 }),
  );
  try {
    const [collections, products] = await Promise.all([
      db.collection.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      db.product.findMany({ where: { isActive: true, kind: "STANDARD" }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...fixed,
      ...collections.map((c) => ({ url: `${SITE_URL}/collections/${c.slug}`, lastModified: c.updatedAt, priority: 0.8 })),
      ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
    ];
  } catch (err) {
    logger.error("sitemap.failed", { err });
    return fixed;
  }
}
