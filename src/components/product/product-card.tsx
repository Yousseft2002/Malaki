import Link from "next/link";
import { Stagger } from "@/components/motion/reveal";
import { Price } from "@/components/ui/price";
import { ProductImage } from "@/components/ui/product-image";
import type { ProductCardData } from "@/lib/queries/catalog";

const isPlaceholder = (s: string | null) => !s || /^\[.*\]$/.test(s.trim());

/**
 * Product card as a physical object on display: framed image stage with gold
 * rules and a soft shadow, then eyebrow → name → tagline → price → Discover.
 * Hover / focus / press: image scales, card lifts, gold frame appears,
 * "Discover" slides in, and the second photo (if any) fades in.
 */
export function ProductCard({ product, headingLevel = "h3" }: { product: ProductCardData; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const sizes = "(min-width: 1024px) 25vw, (min-width: 480px) 50vw, 100vw";
  const hasSecond = !!product.secondImage?.url;
  return (
    <article className="hover-lift group relative flex h-full flex-col">
      <div className="relative overflow-hidden bg-sand shadow-[0_26px_44px_-36px_color-mix(in_srgb,var(--color-emerald-deep)_50%,transparent)] transition-shadow duration-500">
        <div className="transition-transform duration-[900ms] ease-[var(--ease-out)] group-focus-within:scale-[1.05] group-hover:scale-[1.05]">
          <ProductImage
            url={product.image?.url}
            alt={product.image?.alt ?? `[PHOTO: ${product.name}]`}
            sizes={sizes}
            className="aspect-[4/5] w-full"
          />
          {hasSecond && (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-700 group-focus-within:opacity-100 group-hover:opacity-100">
              <ProductImage url={product.secondImage!.url} alt="" sizes={sizes} className="h-full w-full" />
            </div>
          )}
        </div>
        {/* Gold rules: a fine inner frame that brightens on interaction. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-3 border border-gold/0 transition-[border-color] duration-500 group-focus-within:border-gold/80 group-hover:border-gold/80"
        />
        <span
          aria-hidden="true"
          className="eyebrow absolute right-3 bottom-3 translate-y-3 bg-emerald px-3 py-2 text-[0.65rem] text-ivory opacity-0 transition-[opacity,transform] duration-500 ease-[var(--ease-out)] group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
        >
          Discover →
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center px-2 pt-5 text-center">
        {product.collectionName && <p className="eyebrow mb-2 text-gold-ink">{product.collectionName}</p>}
        <Heading className="font-display text-xl text-emerald sm:text-2xl">
          {/* Stretched link: the whole card is clickable, with one accessible link. */}
          <Link href={`/products/${product.slug}`} data-stretched className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </Heading>
        {!isPlaceholder(product.tagline) && <p className="mt-1 text-sm text-muted">{product.tagline}</p>}
        <div aria-hidden="true" className="my-3 h-px w-8 bg-gold/60 transition-transform duration-500 group-hover:scale-x-150" />
        <Price cents={product.fromPriceCents} prefix={product.hasMultiplePrices ? "From" : undefined} className="text-ink" />
      </div>
    </article>
  );
}

// Short rows are centred instead of hugging the left of a 4-column grid.
const COLS: Record<number, string> = {
  1: "mx-auto max-w-sm min-[480px]:grid-cols-1",
  2: "mx-auto max-w-3xl",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

export function ProductGrid({ products, headingLevel }: { products: ProductCardData[]; headingLevel?: "h2" | "h3" }) {
  if (products.length === 0) return <p className="text-center text-muted">New pieces are coming soon.</p>;
  return (
    <Stagger as="ul" className={`grid grid-cols-1 gap-x-6 gap-y-14 min-[480px]:grid-cols-2 ${COLS[Math.min(products.length, 4)]}`}>
      {products.map((p) => (
        <li key={p.slug}>
          <ProductCard product={p} headingLevel={headingLevel} />
        </li>
      ))}
    </Stagger>
  );
}
