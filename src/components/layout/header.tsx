import Link from "next/link";
import { CartButton } from "@/components/cart/cart-button";
import { MobileMenu } from "./mobile-menu";
import { MAIN_LINKS, SHOP_LINKS } from "./nav-links";

const linkClass =
  "eyebrow inline-flex min-h-11 min-w-11 items-center justify-center text-ivory/90 transition-colors hover:text-gold focus-visible:text-gold link-gold link-gold-accent [--underline-offset:11px]";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gold/30 bg-emerald text-ivory">
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
        <div className="flex flex-1 items-center md:hidden">
          <MobileMenu />
        </div>

        <Link href="/" className="wordmark inline-flex min-h-11 items-center text-xl text-gold md:text-2xl" aria-label="MALAKI — home">
          Malaki
        </Link>

        <nav aria-label="Main" className="hidden flex-1 justify-center md:flex">
          <ul className="flex items-center gap-6 lg:gap-9">
            <li className="group relative">
              <Link href="/collections/gift-boxes" className={linkClass}>
                Shop
              </Link>
              {/* Dropdown is reachable by keyboard via focus-within */}
              <ul className="invisible absolute top-full left-1/2 min-w-56 -translate-x-1/2 border border-gold/30 bg-emerald-deep p-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                {SHOP_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={`${linkClass} w-full px-3`}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            {MAIN_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-1 items-center justify-end md:flex-none">
          <CartButton />
        </div>
      </div>
    </header>
  );
}
