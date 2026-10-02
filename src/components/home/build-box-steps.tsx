import { InView, Stagger } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  { title: "Choose your box", body: "Pick the size that suits the occasion." },
  { title: "Fill it with favorites", body: "Mix cookies and stuffed dates, piece by piece." },
  { title: "Add a personal note", body: "We'll wrap it and send it on the date you choose." },
];

/** Three steps joined by a gold thread that draws across as they appear. */
export function BuildBoxSteps() {
  return (
    <section aria-labelledby="byo-title" className="py-20 md:py-28">
      <div className="container-page">
        <SectionHeading id="byo-title" eyebrow="Made to order" title="Build your own box" />
        <div className="relative mx-auto mt-14 max-w-5xl">
          {/* The thread between the diamonds (desktop). */}
          <InView aria-hidden="true" className="star-divider absolute top-7 right-[16.5%] left-[16.5%] hidden md:flex">
            <span className="divider-line h-px flex-1 border-t border-dashed border-gold" />
            <span className="divider-line h-px flex-1 border-t border-dashed border-gold" />
          </InView>
          <Stagger as="ol" className="relative grid gap-12 md:grid-cols-3 md:gap-10">
            {steps.map((s, i) => (
              <li key={s.title} className="group flex flex-col items-center text-center">
                <span
                  aria-hidden="true"
                  className="mb-6 flex h-14 w-14 rotate-45 items-center justify-center border border-gold-ink bg-ivory transition-transform duration-500 ease-[var(--ease-bounce)] group-hover:rotate-[135deg]"
                >
                  <span className="-rotate-45 font-display text-xl text-emerald transition-transform duration-500 group-hover:-rotate-[135deg]">{i + 1}</span>
                </span>
                <h3 className="font-display text-2xl text-emerald">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mt-2 max-w-xs text-muted">{s.body}</p>
              </li>
            ))}
          </Stagger>
        </div>
        <div className="mt-14 text-center">
          <ButtonLink href="/build-your-own-box" arrow>
            Start building
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
