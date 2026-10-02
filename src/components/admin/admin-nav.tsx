import Link from "next/link";
import { logout } from "@/app/admin/actions/auth";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/box-items", label: "Box items" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/shipping", label: "Shipping & capacity" },
];

export function AdminNav() {
  return (
    <header className="bg-emerald text-ivory">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2">
        <Link href="/admin" className="wordmark mr-4 py-2 text-lg text-gold">
          Malaki <span className="text-xs tracking-normal normal-case">admin</span>
        </Link>
        <nav aria-label="Admin" className="flex-1">
          <ul className="flex flex-wrap gap-x-5">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-11 items-center text-sm hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm hover:text-gold" target="_blank">
            View shop ↗
          </Link>
          <form action={logout}>
            <button type="submit" className="min-h-11 text-sm underline underline-offset-4 hover:text-gold">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
