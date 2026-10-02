import type { Metadata } from "next";
import { FloatingMotif } from "@/components/motion/floating-motif";
import { InView, Stagger } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { SectionHeading } from "@/components/ui/section-heading";
import { StarDivider } from "@/components/ui/star";

export const metadata: Metadata = {
  title: "Our Story",
  description: "[META — the story behind MALAKI]",
  alternates: { canonical: "/our-story" },
};

const chapters = [
  { title: "[CHAPTER 1 TITLE — e.g. where it began]", body: "[CHAPTER 1 — 2–4 sentences]", image: "[PHOTO: Founder / family kitchen]" },
  { title: "[CHAPTER 2 TITLE — e.g. the recipes]", body: "[CHAPTER 2 — 2–4 sentences]", image: "[PHOTO: Ingredients — almonds, dates, orange blossom]" },
  { title: "[CHAPTER 3 TITLE — e.g. made by hand today]", body: "[CHAPTER 3 — 2–4 sentences]", image: "[PHOTO: Packing gift boxes]" },
];

const NUMERALS = ["I", "II", "III"];

export default function OurStoryPage() {
  return (
    <>
      <section className="on-dark relative overflow-hidden bg-emerald py-20 text-ivory md:py-28">
        <FloatingMotif density="light" className="opacity-50" />
        <div className="container-page relative">
          <SectionHeading as="h1" tone="dark" eyebrow="Our story" title="Malaki means royal" intro="[STORY INTRO — one or two sentences]" />
        </div>
      </section>
      <div className="container-page flex flex-col gap-24 py-20 md:gap-32 md:py-28">
        {chapters.map((c, i) => (
          <section key={c.title} className="grid items-center gap-12 md:grid-cols-2 lg:gap-20">
            {/* Each chapter's photo is revealed through a Moroccan arch, like the homepage story. */}
            <InView className={`arch-reveal relative mx-auto w-full max-w-md ${i % 2 ? "md:order-last" : ""}`}>
              <div aria-hidden="true" className="absolute -inset-3 rounded-t-full border border-gold/50" />
              <div className="relative overflow-hidden rounded-t-full shadow-[0_30px_60px_-40px_color-mix(in_srgb,var(--color-emerald-deep)_55%,transparent)]">
                <div className="arch-image">
                  <ImagePlaceholder label={c.image} className="aspect-[3/4] w-full" frame={false} />
                </div>
                <div aria-hidden="true" className="arch-curtain absolute inset-0 bg-ivory" />
              </div>
            </InView>
            <Stagger>
              <p aria-hidden="true" className="font-display text-6xl text-gold-ink/80">
                {NUMERALS[i]}
              </p>
              <h2 className="mt-2 text-3xl text-emerald sm:text-4xl">{c.title}</h2>
              <StarDivider tone="ink" align="start" className="my-6" />
              <p className="text-lg text-muted">{c.body}</p>
            </Stagger>
          </section>
        ))}
        <div className="text-center">
          <ButtonLink href="/collections/gift-boxes" arrow>
            Discover the collection
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
