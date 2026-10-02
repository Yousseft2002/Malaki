import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { SectionHeading } from "@/components/ui/section-heading";

type CollectionCard = { slug: string; name: string; tagline: string | null; imageLabel: string | null };

export function CollectionsSection({ collections }: { collections: CollectionCard[] }) {
  return (
    <section aria-labelledby="collections-title" className="py-20 md:py-28">
      <div className="container-page">
        <SectionHeading id="collections-title" eyebrow="Shop by collection" title="Something for every table" />
        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {collections.map((c) => (
            <li key={c.slug} className="group relative">
              <ImagePlaceholder label={c.imageLabel ?? c.name} className="aspect-[4/5] w-full md:aspect-[3/4]" />
              <div className="absolute inset-x-4 bottom-4 bg-ivory/95 px-5 py-4 text-center">
                <h3 className="font-display text-2xl text-emerald">
                  <Link href={`/collections/${c.slug}`} className="after:absolute after:inset-0">
                    {c.name}
                  </Link>
                </h3>
                <p className="eyebrow mt-1 text-gold-ink" aria-hidden="true">
                  Discover →
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
