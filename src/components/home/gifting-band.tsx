import Link from "next/link";
import { FloatingMotif } from "@/components/motion/floating-motif";
import { Stagger } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { EightPointStar } from "@/components/ui/star";

const occasions = [
  { title: "Weddings", body: "[WEDDINGS — favours, welcome boxes, dessert tables]", type: "WEDDING" },
  { title: "Events", body: "[EVENTS — celebrations, Eid, Ramadan, family gatherings]", type: "EVENT" },
  { title: "Corporate", body: "[CORPORATE — client gifts, branded boxes, bulk orders]", type: "CORPORATE" },
];

export function GiftingBand() {
  return (
    <section aria-labelledby="gifting-title" className="on-dark relative overflow-hidden bg-emerald py-20 text-ivory md:py-28">
      <FloatingMotif density="light" className="opacity-40" />
      <div className="container-page relative">
        <SectionHeading
          id="gifting-title"
          tone="dark"
          eyebrow="Bespoke gifting"
          title="Weddings, events & corporate gifts"
          intro="[GIFTING INTRO — one sentence on bespoke and bulk orders]"
        />
        <Stagger as="ul" className="mt-14 grid gap-px bg-gold/25 md:grid-cols-3">
          {occasions.map((o) => (
            <li key={o.title} className="group relative bg-emerald transition-colors duration-500 hover:bg-emerald-deep">
              <Link
                href={`/enquiries?type=${o.type}`}
                className="flex h-full flex-col items-center px-6 py-10 text-center transition-transform duration-500 active:scale-[0.98]"
              >
                <EightPointStar className="mb-5 h-5 w-5 text-gold transition-transform duration-700 ease-[var(--ease-bounce)] group-hover:rotate-90 group-hover:scale-125" />
                <h3 className="font-display text-2xl">{o.title}</h3>
                <p className="mt-3 text-sand">{o.body}</p>
                <span className="eyebrow mt-5 inline-flex items-center gap-2 text-gold">
                  Enquire
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1.5">
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </Stagger>
        <div className="mt-14 text-center">
          <ButtonLink href="/enquiries" variant="gold" arrow>
            Make an enquiry
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
