import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/ui/section-heading";
import { LEGAL_PAGES, getLegalPage } from "@/content/legal";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LEGAL_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getLegalPage((await params).slug);
  return page ? { title: page.title, description: page.description, alternates: { canonical: `/legal/${page.slug}` } } : {};
}

export default async function LegalPage({ params }: Props) {
  const page = getLegalPage((await params).slug);
  if (!page) notFound();
  return (
    <article className="container-page max-w-3xl py-12 md:py-20">
      <p role="note" className="mb-10 border-2 border-dashed border-gold-ink bg-sand p-4 text-sm">
        <strong>TEMPLATE — not yet reviewed.</strong> Replace every [PLACEHOLDER] and have this page checked by a qualified adviser before launch.
      </p>
      <SectionHeading as="h1" title={page.title} />
      <div className="mt-12 flex flex-col gap-10">
        {page.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mb-3 font-display text-2xl text-emerald">{s.heading}</h2>
            {s.body.map((p) => (
              <p key={p} className="mb-3 text-muted">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
