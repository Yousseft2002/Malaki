import { InView, Stagger } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { EightPointStar, StarDivider } from "@/components/ui/star";

/** "Malaki means royal" — the photo is revealed through a Moroccan arch. */
export function StorySection() {
  return (
    <section aria-labelledby="story-title" className="relative overflow-hidden bg-sand py-20 md:py-28">
      <div className="container-page grid items-center gap-14 md:grid-cols-2 lg:gap-24">
        <InView className="arch-reveal relative order-last mx-auto w-full max-w-md md:order-first">
          {/* Thin gold arch outline offset behind the image. */}
          <div aria-hidden="true" className="absolute -inset-3 rounded-t-full border border-gold/50" />
          <div className="relative overflow-hidden rounded-t-full shadow-[0_30px_60px_-40px_color-mix(in_srgb,var(--color-emerald-deep)_55%,transparent)]">
            <div className="arch-image">
              <ImagePlaceholder label="[PHOTO: Hands shaping gazelle horns / atelier detail]" className="aspect-[3/4] w-full bg-ivory" frame={false} />
            </div>
            <div aria-hidden="true" className="arch-curtain absolute inset-0 bg-ivory" />
          </div>
          <EightPointStar className="motif-float absolute -top-2 left-1/2 h-6 w-6 -translate-x-1/2 text-gold" />
        </InView>

        <Stagger className="text-center md:text-left">
          <p className="eyebrow mb-4 text-gold-ink">Our story</p>
          <h2 id="story-title" className="text-4xl text-emerald sm:text-5xl lg:text-6xl">
            Malaki <em className="text-gold-ink italic">means</em> royal
          </h2>
          <StarDivider tone="ink" align="start" className="my-7 max-md:justify-center" />
          <p className="text-lg text-muted">
            [BRAND STORY — 2–3 sentences: who you are, where the recipes come from, what makes MALAKI special]
          </p>
          <div>
            <ButtonLink href="/our-story" variant="outline" className="mt-10" arrow>
              Read our story
            </ButtonLink>
          </div>
        </Stagger>
      </div>
    </section>
  );
}
