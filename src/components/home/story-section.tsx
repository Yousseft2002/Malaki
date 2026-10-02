import { ButtonLink } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { EightPointStar } from "@/components/ui/star";

export function StorySection() {
  return (
    <section aria-labelledby="story-title" className="bg-sand py-20 md:py-28">
      <div className="container-page grid items-center gap-12 md:grid-cols-2 lg:gap-20">
        <ImagePlaceholder
          label="[PHOTO: Hands shaping gazelle horns / atelier detail]"
          className="order-last aspect-[4/5] w-full bg-ivory md:order-first"
        />
        <div className="text-center md:text-left">
          <EightPointStar className="mx-auto mb-6 h-6 w-6 text-gold-ink md:mx-0" />
          <p className="eyebrow mb-4 text-gold-ink">Our story</p>
          <h2 id="story-title" className="text-4xl text-emerald sm:text-5xl">
            Malaki means royal
          </h2>
          <p className="mt-6 text-lg text-muted">
            [BRAND STORY — 2–3 sentences: who you are, where the recipes come from, what makes MALAKI special]
          </p>
          <ButtonLink href="/our-story" variant="outline" className="mt-10">
            Read our story
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
