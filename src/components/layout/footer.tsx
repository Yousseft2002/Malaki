import Link from "next/link";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { StarDivider } from "@/components/ui/star";
import { LEGAL_LINKS, MAIN_LINKS, SHOP_LINKS } from "./nav-links";

const columns = [
  { title: "Shop", links: [...SHOP_LINKS, { href: "/build-your-own-box", label: "Build a Box" }] },
  { title: "MALAKI", links: MAIN_LINKS.filter((l) => l.href !== "/build-your-own-box") },
  { title: "Help", links: LEGAL_LINKS },
];

export function Footer() {
  return (
    <footer className="bg-emerald-deep text-sand">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <p className="wordmark text-2xl text-gold">Malaki</p>
            <h2 className="mt-6 font-display text-2xl text-ivory">Letters from the house</h2>
            <p className="mt-2 mb-6 max-w-sm text-sand">[NEWSLETTER PITCH — one line on what subscribers receive]</p>
            <NewsletterForm source="footer" />
          </div>
          <nav aria-label="Footer" className="grid grid-cols-1 gap-10 min-[420px]:grid-cols-2 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h2 className="eyebrow mb-4 text-gold">{col.title}</h2>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="inline-flex min-h-11 items-center text-sand hover:text-gold">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <StarDivider className="my-12" />
        <div className="flex flex-col gap-2 text-sm text-sand/90 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} MALAKI. [COMPANY LEGAL NAME AND REGISTRATION DETAILS]</p>
          <p>[CONTACT EMAIL] · [SOCIAL LINKS]</p>
        </div>
      </div>
    </footer>
  );
}
