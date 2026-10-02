import type { Metadata } from "next";
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

export default function OurStoryPage() {
  return (
    <>
      <section className="bg-emerald py-20 text-ivory md:py-28">
        <div className="container-page">
          <SectionHeading as="h1" tone="dark" eyebrow="Our story" title="Malaki means royal" intro="[STORY INTRO — one or two sentences]" />
        </div>
      </section>
      <div className="container-page flex flex-col gap-20 py-20 md:gap-28 md:py-28">
        {chapters.map((c, i) => (
          <section key={c.title} className="grid items-center gap-10 md:grid-cols-2 lg:gap-20">
            <ImagePlaceholder label={c.image} className={`aspect-[4/5] w-full ${i % 2 ? "md:order-last" : ""}`} />
            <div>
              <h2 className="text-3xl text-emerald sm:text-4xl">{c.title}</h2>
              <StarDivider tone="ink" className="my-6 justify-start" />
              <p className="text-lg text-muted">{c.body}</p>
            </div>
          </section>
        ))}
        <div className="text-center">
          <ButtonLink href="/collections/gift-boxes">Discover the collection</ButtonLink>
        </div>
      </div>
    </>
  );
}
