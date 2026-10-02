import { ButtonLink } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { StarDivider } from "@/components/ui/star";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-emerald text-ivory">
      <div className="container-page grid items-center gap-10 py-14 md:grid-cols-2 md:py-24 lg:gap-16">
        <div className="text-center md:text-left">
          <p className="eyebrow mb-6 text-gold">Moroccan confectionery &amp; gift boxes</p>
          <h1 id="hero-title" className="text-[2.6rem] leading-[1.08] sm:text-6xl lg:text-7xl">
            Gifts fit for royalty.
          </h1>
          <StarDivider className="my-8 md:justify-start" />
          <p className="mx-auto max-w-md text-lg text-sand md:mx-0">
            [HERO SUBHEADING — one or two sentences about your cookies, stuffed dates and gift boxes]
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 min-[420px]:flex-row md:justify-start">
            <ButtonLink href="/collections/gift-boxes" variant="gold">
              Shop gift boxes
            </ButtonLink>
            <ButtonLink href="/build-your-own-box" variant="outline-light">
              Build your own box
            </ButtonLink>
          </div>
        </div>
        <ImagePlaceholder
          tone="emerald"
          label="[PHOTO: Hero — The Malaki Box open on emerald silk, gold ribbon]"
          className="aspect-[4/5] w-full border border-gold/30 md:aspect-square"
        />
      </div>
    </section>
  );
}
