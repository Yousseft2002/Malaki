import { NewsletterForm } from "@/components/forms/newsletter-form";
import { BuildBoxSteps } from "@/components/home/build-box-steps";
import { CollectionsSection } from "@/components/home/collections-section";
import { GiftingBand } from "@/components/home/gifting-band";
import { Hero } from "@/components/home/hero";
import { StorySection } from "@/components/home/story-section";
import { ProductGrid } from "@/components/product/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCollections, getSignatureProducts } from "@/lib/queries/catalog";
import { jsonLdScript } from "@/lib/seo";
import { SITE_URL } from "@/lib/store-config";

export default async function HomePage() {
  const [collections, signature] = await Promise.all([getCollections(), getSignatureProducts()]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript({ "@context": "https://schema.org", "@type": "Organization", name: "MALAKI", url: SITE_URL }) }}
      />
      <Hero />
      <CollectionsSection collections={collections} />

      <section aria-labelledby="signature-title" className="border-t border-sand pb-20 pt-20 md:pb-28 md:pt-28">
        <div className="container-page">
          <SectionHeading id="signature-title" eyebrow="The signature collection" title="House favourites" />
          <div className="mt-14">
            <ProductGrid products={signature} />
          </div>
        </div>
      </section>

      <StorySection />
      <BuildBoxSteps />
      <GiftingBand />

      <section aria-labelledby="newsletter-title" className="py-20 md:py-24">
        <div className="container-page flex flex-col items-center text-center">
          <SectionHeading id="newsletter-title" eyebrow="Newsletter" title="First to know" intro="[NEWSLETTER PITCH — new collections, seasonal boxes, order deadlines]" />
          <div className="mt-10 flex w-full justify-center text-left">
            <NewsletterForm source="homepage" tone="light" />
          </div>
        </div>
      </section>
    </>
  );
}
