"use client";

import Link from "next/link";
import { useState } from "react";
import { CloseButton, Sheet } from "@/components/ui/sheet";
import { StarDivider } from "@/components/ui/star";
import { LEGAL_LINKS, MAIN_LINKS, SHOP_LINKS } from "./nav-links";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="-ml-3 inline-flex h-11 w-11 items-center justify-center text-ivory"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.4" fill="none" />
        </svg>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} side="left" label="Menu">
        <div className="flex items-center justify-between border-b border-sand px-5 py-2">
          <span className="wordmark text-lg text-emerald">Malaki</span>
          <CloseButton onClick={() => setOpen(false)} label="Close menu" />
        </div>
        <nav
          aria-label="Mobile"
          className="flex-1 overflow-y-auto px-5 py-6"
          // Close after following any link.
          onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
        >
          <p className="eyebrow mb-2 text-gold-ink">Shop</p>
          <ul className="mb-6">
            {SHOP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex min-h-12 items-center font-display text-2xl text-emerald">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <StarDivider tone="ink" className="my-6" />
          <ul className="mb-8">
            {MAIN_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex min-h-12 items-center font-display text-xl text-emerald">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul>
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex min-h-11 items-center text-sm text-muted">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Sheet>
    </>
  );
}
