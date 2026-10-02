import Link from "next/link";
import { FloatingMotif } from "@/components/motion/floating-motif";
import { PageIntro, introStep } from "@/components/motion/page-intro";
import { ButtonLink } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { EightPointStar } from "@/components/ui/star";

/**
 * Editorial, asymmetric hero. The entrance is pure CSS (PageIntro) so it plays
 * on first paint and never blocks interaction: eyebrow → headline → divider
 * draws outward → body → CTAs → the box settles into place.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="on-dark relative overflow-hidden bg-emerald text-ivory">
      {/* Soft depth: a palette-only radial glow behind the product side. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_45%,color-mix(in_srgb,var(--color-emerald-soft)_90%,transparent),transparent_60%)]"
      />
      <PageIntro className="container-page relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
        <div className="relative z-10 text-center lg:col-span-5 lg:text-left">
          <p className="eyebrow mb-6 text-gold" {...introStep(0)}>
            Moroccan confectionery &amp; gift boxes
          </p>
          <h1 id="hero-title" className="text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[5.25rem]" {...introStep(1)}>
            Gifts fit
            <br />
            for <em className="font-display text-gold italic">royalty.</em>
          </h1>
          <div className="my-8 flex items-center justify-center gap-4 text-gold lg:justify-start" role="presentation" style={{ "--d": 2 } as React.CSSProperties}>
            <span className="draw-line h-px w-16 bg-current opacity-70 sm:w-24" />
            <span className="turn-star inline-flex">
              <EightPointStar className="h-3.5 w-3.5" />
            </span>
            <span className="draw-line h-px w-16 bg-current opacity-70 sm:w-24" />
          </div>
          <p className="mx-auto max-w-md text-lg text-sand lg:mx-0" {...introStep(3)}>
            [HERO SUBHEADING — one or two sentences about your cookies, stuffed dates and gift boxes]
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 min-[420px]:flex-row lg:justify-start" {...introStep(4)}>
            <ButtonLink href="/collections/gift-boxes" variant="gold" arrow>
              Shop gift boxes
            </ButtonLink>
            <ButtonLink href="/build-your-own-box" variant="outline-light">
              Build your own box
            </ButtonLink>
          </div>
        </div>

        <div className="relative lg:col-span-7 lg:-mr-10 xl:-mr-16" {...introStep(4, "settle")}>
          <FloatingMotif className="-inset-8 sm:-inset-12" />
          {/* Double gold frame, like a presentation box. */}
          <div className="relative mx-auto max-w-xl lg:max-w-none">
            <div aria-hidden="true" className="absolute -inset-3 border border-gold/40 sm:-inset-4" />
            <div className="relative shadow-[0_40px_80px_-30px_var(--color-emerald-deep)]">
              <ImagePlaceholder
                tone="emerald"
                label="[PHOTO: Hero — The Malaki Box open on emerald silk, gold ribbon]"
                className="aspect-[4/5] w-full sm:aspect-[5/4] lg:aspect-[6/5]"
              />
            </div>
            {/* Layered caption card overlapping the frame. */}
            <Link
              href="/products/the-malaki-box"
              className="group absolute -bottom-6 left-4 flex items-center gap-4 bg-ivory px-5 py-4 text-ink shadow-[0_18px_40px_-20px_var(--color-emerald-deep)] transition-transform duration-300 hover:-translate-y-1 active:scale-[0.98] sm:left-8"
            >
              <EightPointStar className="h-5 w-5 text-gold-ink transition-transform duration-500 group-hover:rotate-45" />
              <span>
                <span className="eyebrow block text-gold-ink">The signature</span>
                <span className="font-display text-lg text-emerald">The Malaki Box</span>
              </span>
              <span aria-hidden="true" className="text-gold-ink transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </PageIntro>
      <div aria-hidden="true" className="h-10 lg:h-6" />
    </section>
  );
}
