import Link from "next/link";
import { Stagger } from "@/components/motion/reveal";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { SectionHeading } from "@/components/ui/section-heading";
import { EightPointStar } from "@/components/ui/star";

type CollectionCard = { slug: string; name: string; tagline: string | null; imageLabel: string | null };

const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];
const isPlaceholder = (s: string | null) => !s || /^\[.*\]$/.test(s.trim());

/**
 * Each collection is a "chapter". On hover / focus / press: the image zooms
 * gently, the caption panel rises, the gold arrow slides and a faint star
 * lattice emerges. The title is the accessible link; an aria-hidden overlay
 * link makes the whole card tappable.
 */
export function CollectionsSection({ collections }: { collections: CollectionCard[] }) {
  return (
    <section aria-labelledby="collections-title" className="py-20 md:py-28">
      <div className="container-page">
        <SectionHeading id="collections-title" eyebrow="Shop by collection" title="Something for every table" />
        <Stagger as="ul" className="mt-14 grid gap-6 md:grid-cols-3">
          {collections.map((c, i) => (
            <li key={c.slug} className="group relative grid overflow-hidden shadow-[0_28px_50px_-40px_color-mix(in_srgb,var(--color-emerald-deep)_55%,transparent)]">
              <div className="col-start-1 row-start-1 overflow-hidden">
                <div className="transition-transform duration-[1200ms] ease-[var(--ease-out)] group-focus-within:scale-[1.06] group-hover:scale-[1.06] group-active:scale-[1.04]">
                  <ImagePlaceholder label={c.imageLabel ?? c.name} className="aspect-[4/5] w-full md:aspect-[3/4]" />
                </div>
              </div>
              {/* Star lattice that emerges on interaction. */}
              <div
                aria-hidden="true"
                className="pointer-events-none relative col-start-1 row-start-1 bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-gold)_45%,transparent)_1px,transparent_1.5px)] [background-size:18px_18px] opacity-0 transition-opacity duration-700 group-focus-within:opacity-60 group-hover:opacity-60"
              />
              <span
                aria-hidden="true"
                className="relative col-start-1 row-start-1 m-5 self-start justify-self-end font-display text-5xl text-gold-ink/80 transition-transform duration-700 group-hover:-translate-y-1"
              >
                {NUMERALS[i] ?? i + 1}
              </span>
              {/* Whole-card hit area for pointer users; the title link below is the accessible one. */}
              <Link href={`/collections/${c.slug}`} aria-hidden="true" tabIndex={-1} className="absolute inset-0 z-[1]" />
              <div className="relative z-[2] col-start-1 row-start-1 m-4 self-end bg-ivory/95 px-5 py-5 md:m-3 md:px-3 md:py-4 lg:m-4 lg:px-5 lg:py-5 text-center transition-transform duration-500 ease-[var(--ease-out)] group-focus-within:-translate-y-2 group-hover:-translate-y-2">
                <p className="eyebrow mb-1 text-gold-ink">Chapter {NUMERALS[i] ?? i + 1}</p>
                <h3 className="font-display text-2xl text-emerald md:text-xl lg:text-2xl">
                  <Link href={`/collections/${c.slug}`} className="inline-flex min-h-11 items-center">
                    {c.name}
                  </Link>
                </h3>
                {!isPlaceholder(c.tagline) && <p className="mt-1 text-sm text-muted">{c.tagline}</p>}
                <p className="eyebrow mt-2 inline-flex items-center gap-2 text-gold-ink" aria-hidden="true">
                  <EightPointStar className="h-2.5 w-2.5 transition-transform duration-700 group-hover:rotate-90" />
                  Discover
                  <span className="transition-transform duration-300 ease-[var(--ease-bounce)] group-focus-within:translate-x-1.5 group-hover:translate-x-1.5">→</span>
                </p>
              </div>
            </li>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
