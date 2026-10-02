import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  { title: "Choose your box", body: "Pick the size that suits the occasion." },
  { title: "Fill it with favourites", body: "Mix cookies and stuffed dates, piece by piece." },
  { title: "Add a personal note", body: "We'll wrap it and send it on the date you choose." },
];

export function BuildBoxSteps() {
  return (
    <section aria-labelledby="byo-title" className="py-20 md:py-28">
      <div className="container-page">
        <SectionHeading id="byo-title" eyebrow="Made to order" title="Build your own box" />
        <ol className="mx-auto mt-14 grid max-w-5xl gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex flex-col items-center text-center">
              <span
                aria-hidden="true"
                className="mb-5 flex h-14 w-14 rotate-45 items-center justify-center border border-gold-ink"
              >
                <span className="-rotate-45 font-display text-xl text-emerald">{i + 1}</span>
              </span>
              <h3 className="font-display text-2xl text-emerald">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-2 max-w-xs text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 text-center">
          <ButtonLink href="/build-your-own-box">Start building</ButtonLink>
        </div>
      </div>
    </section>
  );
}
