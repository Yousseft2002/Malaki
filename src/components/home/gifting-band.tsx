import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { EightPointStar } from "@/components/ui/star";

const occasions = [
  { title: "Weddings", body: "[WEDDINGS — favours, welcome boxes, dessert tables]" },
  { title: "Events", body: "[EVENTS — celebrations, Eid, Ramadan, family gatherings]" },
  { title: "Corporate", body: "[CORPORATE — client gifts, branded boxes, bulk orders]" },
];

export function GiftingBand() {
  return (
    <section aria-labelledby="gifting-title" className="bg-emerald py-20 text-ivory md:py-28">
      <div className="container-page">
        <SectionHeading
          id="gifting-title"
          tone="dark"
          eyebrow="Bespoke gifting"
          title="Weddings, events & corporate gifts"
          intro="[GIFTING INTRO — one sentence on bespoke and bulk orders]"
        />
        <ul className="mt-14 grid gap-px bg-gold/25 md:grid-cols-3">
          {occasions.map((o) => (
            <li key={o.title} className="bg-emerald px-6 py-10 text-center">
              <EightPointStar className="mx-auto mb-5 h-5 w-5 text-gold" />
              <h3 className="font-display text-2xl">{o.title}</h3>
              <p className="mt-3 text-sand">{o.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-14 text-center">
          <ButtonLink href="/enquiries" variant="gold">
            Make an enquiry
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
