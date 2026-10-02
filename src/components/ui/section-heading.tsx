import { StarDivider } from "./star";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  tone = "light",
  as: Tag = "h2",
  id,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  tone?: "light" | "dark";
  as?: "h1" | "h2";
  id?: string;
}) {
  const dark = tone === "dark";
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && <p className={`eyebrow mb-4 ${dark ? "text-gold" : "text-gold-ink"}`}>{eyebrow}</p>}
      <Tag id={id} className={`text-3xl sm:text-4xl ${dark ? "text-ivory" : "text-emerald"}`}>
        {title}
      </Tag>
      <StarDivider className="mt-6" tone={dark ? "gold" : "ink"} />
      {intro && <p className={`mt-6 ${dark ? "text-sand" : "text-muted"}`}>{intro}</p>}
    </div>
  );
}
