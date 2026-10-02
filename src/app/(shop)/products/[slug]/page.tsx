import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Gallery } from "@/components/product/gallery";
import { ProductGrid } from "@/components/product/product-card";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { AccordionItem } from "@/components/ui/accordion";
import { PageIntro, introStep } from "@/components/motion/page-intro";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SectionHeading } from "@/components/ui/section-heading";
import { StarDivider } from "@/components/ui/star";
import { getProductBySlug, getStoreSettings } from "@/lib/queries/catalog";
import { jsonLdScript, productJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  const image = product.images.find((i) => i.url)?.url;
  return {
    title: product.name,
    description: product.tagline ?? product.description ?? undefined,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, ...(image ? { images: [image] } : {}) },
  };
}

export default async function ProductPage({ params }: Props) {
  const [product, settings] = await Promise.all([getProductBySlug((await params).slug), getStoreSettings()]);
  if (!product) notFound();
  if (product.kind === "CUSTOM_BOX") redirect("/build-your-own-box");

  const firstImage = product.images[0] ?? null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd(product)) }} />
      <div className="container-page py-8 md:py-14">
        <Breadcrumbs
          items={[
            { href: "/", label: "Home" },
            ...(product.collection ? [{ href: `/collections/${product.collection.slug}`, label: product.collection.name }] : []),
            { label: product.name },
          ]}
        />

        {/* Mobile: gallery → purchase → details. Desktop: gallery + details left, sticky purchase panel right. */}
        <div className="mt-6 grid gap-10 [grid-template-areas:'gallery'_'panel'_'details'] lg:grid-cols-[1.15fr_1fr] lg:[grid-template-areas:'gallery_panel'_'details_panel'] lg:gap-x-16">
          <div className="[grid-area:gallery]">
            <Gallery images={product.images} productName={product.name} />
          </div>

          <div className="[grid-area:panel] lg:sticky lg:top-24 lg:self-start">
            <PageIntro>
              {product.collection && (
                <p className="eyebrow mb-3 text-gold-ink" {...introStep(0)}>
                  {product.collection.name}
                </p>
              )}
              <h1 className="text-4xl leading-[1.05] text-emerald sm:text-5xl lg:text-6xl" {...introStep(1)}>
                {product.name}
              </h1>
              {product.tagline && (
                <p className="mt-3 text-lg text-muted" {...introStep(2)}>
                  {product.tagline}
                </p>
              )}
            </PageIntro>
            <StarDivider tone="ink" align="start" className="my-7" />
            <PurchasePanel
              product={{ slug: product.slug, name: product.name, image: firstImage }}
              variants={product.variants.map((v) => ({ id: v.id, name: v.name, priceCents: v.priceCents, stock: v.stock }))}
              giftWrapPriceCents={settings.giftWrapPriceCents}
            />
          </div>

          <div className="[grid-area:details]">
            {product.description && <p className="mb-8 text-lg leading-relaxed whitespace-pre-line text-muted">{product.description}</p>}
            <div className="border-t border-hairline">
              <AccordionItem title="What's inside">{product.contents ?? "[CONTENTS]"}</AccordionItem>
              <AccordionItem title="Ingredients & allergens">
                {product.ingredients ?? "[INGREDIENTS]"}
                {"\n\n"}
                <strong className="font-medium text-ink">Allergens: </strong>
                {product.allergens ?? "[ALLERGENS]"}
              </AccordionItem>
              <AccordionItem title="Storage">{product.storage ?? "[STORAGE]"}</AccordionItem>
              <AccordionItem title="Shipping">{product.shippingInfo ?? "[SHIPPING TIMES]"}</AccordionItem>
            </div>
          </div>
        </div>
      </div>

      {product.pairsWith.length > 0 && (
        <section aria-labelledby="pairs-title" className="mt-16 border-t border-hairline bg-sand/40 py-16 md:py-24">
          <div className="container-page">
            <SectionHeading id="pairs-title" eyebrow="Complete the gift" title="Pairs well with" />
            <div className="mt-12">
              <ProductGrid products={product.pairsWith} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
