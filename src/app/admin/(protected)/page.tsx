import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { todayIn, toUtcDate } from "@/lib/domain/dates";
import { env } from "@/lib/env";

export default async function AdminDashboard() {
  await requireAdmin();
  const today = toUtcDate(todayIn(env().STORE_TIMEZONE));
  const [toPack, toShip, dispatchToday, newEnquiries, lowStock] = await Promise.all([
    db.order.count({ where: { status: "PAID" } }),
    db.order.count({ where: { status: "PACKED" } }),
    db.order.count({ where: { status: { in: ["PAID", "PACKED"] }, dispatchDate: today } }),
    db.enquiry.count({ where: { status: "NEW" } }),
    db.variant.count({ where: { isActive: true, stock: { lte: 5 } } }),
  ]);
  const tiles = [
    { label: "Paid, to pack", value: toPack, href: "/admin/orders?status=PAID" },
    { label: "Packed, to ship", value: toShip, href: "/admin/orders?status=PACKED" },
    { label: "Dispatching today", value: dispatchToday, href: "/admin/orders" },
    { label: "New enquiries", value: newEnquiries, href: "/admin/enquiries" },
    { label: "Variants with ≤ 5 in stock", value: lowStock, href: "/admin/products" },
  ];
  return (
    <>
      <h1 className="mb-8 text-3xl text-emerald">Dashboard</h1>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="block border border-sand bg-white p-5 hover:border-emerald">
              <span className="block font-display text-4xl text-emerald">{t.value}</span>
              <span className="mt-1 block text-sm text-muted">{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
