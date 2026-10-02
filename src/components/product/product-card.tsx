import Link from "next/link";
import { Price } from "@/components/ui/price";
import { ProductImage } from "@/components/ui/product-image";
import type { ProductCardData } from "@/lib/queries/catalog";

export function ProductCard({ product, headingLevel = "h3" }: { product: ProductCardData; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex flex-col">
      <ProductImage
        url={product.image?.url}
        alt={product.image?.alt ?? `[PHOTO: ${product.name}]`}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-[4/5] w-full transition-opacity group-hover:opacity-90"
      />
      <div className="flex flex-1 flex-col items-center pt-5 text-center">
        {product.collectionName && <p className="eyebrow mb-2 text-gold-ink">{product.collectionName}</p>}
        <Heading className="font-display text-xl text-emerald">
          {/* Stretched link: the whole card is clickable, with one accessible link. */}
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </Heading>
        <Price
          cents={product.fromPriceCents}
          prefix={product.hasMultiplePrices ? "From" : undefined}
          className="mt-2 text-muted"
        />
      </div>
    </article>
  );
}

export function ProductGrid({ products, headingLevel }: { products: ProductCardData[]; headingLevel?: "h2" | "h3" }) {
  if (products.length === 0) return <p className="text-center text-muted">New pieces are coming soon.</p>;
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-12 min-[480px]:grid-cols-2 lg:grid-cols-4">
      {products.map((p) => (
        <li key={p.slug}>
          <ProductCard product={p} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
