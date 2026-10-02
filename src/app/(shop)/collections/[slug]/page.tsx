import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    <div className="container-page py-10 md:py-16">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: collection.name }]} />
      <div className="mt-8 mb-14">
        <SectionHeading as="h1" eyebrow="Collection" title={collection.name} intro={collection.description ?? undefined} />
      </div>
      <ProductGrid products={collection.products} headingLevel="h2" />
    </div>
  );
}
