import type { Metadata } from "next";
import { BoxBuilder } from "@/components/box-builder/box-builder";
import { SectionHeading } from "@/components/ui/section-heading";
import { getBoxBuilderData, getStoreSettings } from "@/lib/queries/catalog";

export const metadata: Metadata = {
  title: "Build your own box",
  description: "Choose a box size and fill it with your favorite Moroccan cookies and stuffed dates.",
  alternates: { canonical: "/build-your-own-box" },
};

export default async function BuildYourOwnBoxPage() {
  const [data, settings] = await Promise.all([getBoxBuilderData(), getStoreSettings()]);
  return (
    <div className="container-page py-10 md:py-16">
      <div className="mb-14">
        <SectionHeading as="h1" eyebrow="Made to order" title="Build your own box" intro="[BYO INTRO — one sentence inviting customers to compose their own box]" />
      </div>
      {data ? (
        <BoxBuilder
          product={{ slug: data.product.slug, name: data.product.name, image: data.product.images[0] ?? null }}
          sizes={data.sizes}
          pieces={data.pieces}
          giftWrapPriceCents={settings.giftWrapPriceCents}
        />
      ) : (
        <p className="text-center text-muted">The box builder is coming soon.</p>
      )}
    </div>
  );
}
