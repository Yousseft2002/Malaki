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
            <li key={c.slug} className="group relative grid">
              {/* Image and caption share one grid cell; the caption stays unpositioned so the
                  stretched link's ::after covers the whole card. */}
              <ImagePlaceholder label={c.imageLabel ?? c.name} className="col-start-1 row-start-1 aspect-[4/5] w-full md:aspect-[3/4]" />
              <div className="col-start-1 row-start-1 m-4 self-end bg-ivory/95 px-5 py-4 text-center">
                <h3 className="font-display text-2xl text-emerald">
                  <Link href={`/collections/${c.slug}`} data-stretched className="after:absolute after:inset-0">
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
