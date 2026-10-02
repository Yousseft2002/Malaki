import { SITE_URL, STORE_CURRENCY } from "@/lib/store-config";

export function jsonLdScript(data: unknown): string {
  // Escape "<" so customer- or admin-entered text can't close the <script> tag.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const isPlaceholder = (s: string | null | undefined) => !s || /^\[.*\]$/.test(s.trim());

export function productJsonLd(p: {
  slug: string;
  name: string;
  description: string | null;
  images: { url: string | null }[];
  variants: { sku: string; priceCents: number | null; stock: number }[];
}) {
  const priced = p.variants.filter((v) => v.priceCents !== null);
  const images = p.images.map((i) => i.url).filter((u): u is string => !!u);
  const url = `${SITE_URL}/products/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    url,
    brand: { "@type": "Brand", name: "MALAKI" },
    ...(isPlaceholder(p.description) ? {} : { description: p.description }),
    ...(images.length ? { image: images.map((i) => (i.startsWith("http") ? i : `${SITE_URL}${i}`)) } : {}),
    ...(p.variants[0] ? { sku: p.variants[0].sku } : {}),
    // Offers are only published once real prices are set.
    ...(priced.length
      ? {
          offers: priced.map((v) => ({
            "@type": "Offer",
            sku: v.sku,
            url,
            price: (v.priceCents! / 100).toFixed(2),
            priceCurrency: STORE_CURRENCY,
            availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          })),
        }
      : {}),
  };
}
