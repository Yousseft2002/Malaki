import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FloatingMotif } from "@/components/motion/floating-motif";
import { ProductGrid } from "@/components/product/product-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCollectionWithProducts } from "@/lib/queries/catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = await getCollectionWithProducts((await params).slug);
  if (!collection) return {};
  return {
    title: collection.name,
    description: collection.description ?? undefined,
    alternates: { canonical: `/collections/${collection.slug}` },
  };
}

export default async function CollectionPage({ params }: Props) {
  const collection = await getCollectionWithProducts((await params).slug);
  if (!collection) notFound();

  return (
    <>
      <section className="relative overflow-hidden border-b border-hairline bg-sand">
        <FloatingMotif density="light" className="opacity-50" />
        <div className="container-page relative pt-6 pb-14 md:pb-20">
          <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: collection.name }]} />
          <div className="mt-8">
            <SectionHeading as="h1" eyebrow="Collection" title={collection.name} intro={collection.description ?? undefined} />
          </div>
        </div>
      </section>
      <div className="container-page py-14 md:py-20">
        <ProductGrid products={collection.products} headingLevel="h2" />
      </div>
    </>
  );
}
