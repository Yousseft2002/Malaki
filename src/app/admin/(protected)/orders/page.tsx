import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { money } from "@/components/ui/price";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { fromUtcDate } from "@/lib/domain/dates";

const STATUSES = ["PAID", "PACKED", "SHIPPED", "PENDING_PAYMENT", "CANCELLED"] as const;
const PAGE_SIZE = 50;

type Props = { searchParams: Promise<{ status?: string; page?: string }> };

export const metadata = { title: "Orders" };

function qs(status?: string, page?: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page && page > 1) params.set("page", String(page));
  const str = params.toString();
  return str ? `?${str}` : "";
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin();
  const { status, page } = await searchParams;
  const filter = STATUSES.find((s) => s === status);
  const pageNo = Math.max(Number(page) || 1, 1);
  const where = filter ? { status: filter } : { status: { not: "PENDING_PAYMENT" as const } };
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: [{ dispatchDate: "asc" }, { createdAt: "asc" }],
      skip: (pageNo - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { giftOptions: { select: { recipientName: true, deliveryDate: true } } },
    }),
    db.order.count({ where }),
  ]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl text-emerald">Orders</h1>
        <a
          href={`/admin/orders/export${qs(filter)}`}
          className="inline-flex min-h-11 items-center border border-emerald px-4 text-sm text-emerald hover:bg-emerald hover:text-ivory"
        >
          Export CSV
        </a>
      </div>
      <nav aria-label="Filter orders" className="mb-6">
        <ul className="flex flex-wrap gap-2">
          {[undefined, ...STATUSES].map((s) => (
            <li key={s ?? "all"}>
              <Link
                href={`/admin/orders${qs(s)}`}
                aria-current={s === filter ? "page" : undefined}
                className={`inline-flex min-h-11 items-center px-3 text-sm ${s === filter ? "bg-emerald text-ivory" : "bg-white text-ink hover:bg-sand"}`}
              >
                {s ? s.replace("_", " ").toLowerCase() : "all (excl. pending)"}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {orders.length === 0 ? (
        <p className="text-muted">No orders.</p>
      ) : (
        <div className="overflow-x-auto border border-sand bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Orders sorted by dispatch date</caption>
            <thead className="bg-sand">
              <tr>
                <th scope="col" className="p-3">Order</th>
                <th scope="col" className="p-3">Status</th>
                <th scope="col" className="p-3">Dispatch</th>
                <th scope="col" className="p-3">Delivery</th>
                <th scope="col" className="p-3">Buyer → recipient</th>
                <th scope="col" className="p-3">Method</th>
                <th scope="col" className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-sand">
                  <th scope="row" className="p-3 font-medium">
                    <Link href={`/admin/orders/${o.id}`} className="text-emerald underline underline-offset-4">
                      {o.number}
                    </Link>
                    {o.stockIssue && (
                      <span className="ml-2 text-error" title="Stock issue">
                        ⚠<span className="sr-only"> stock issue</span>
                      </span>
                    )}
                  </th>
                  <td className="p-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="p-3">{fromUtcDate(o.dispatchDate)}</td>
                  <td className="p-3">{o.giftOptions?.deliveryDate ? fromUtcDate(o.giftOptions.deliveryDate) : "—"}</td>
                  <td className="p-3">
                    {o.buyerName} → {o.giftOptions?.recipientName ?? "—"}
                  </td>
                  <td className="p-3">{o.fulfilment === "PICKUP" ? "Pickup" : o.shippingRuleName}</td>
                  <td className="p-3 text-right">{money(o.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > PAGE_SIZE && (
        <nav aria-label="Pagination" className="mt-6 flex items-center gap-4">
          {pageNo > 1 && (
            <Link className="inline-flex min-h-11 items-center underline" href={`/admin/orders${qs(filter, pageNo - 1)}`}>
              ← Previous
            </Link>
          )}
          <span className="text-muted">
            Page {pageNo} of {Math.ceil(total / PAGE_SIZE)}
          </span>
          {pageNo * PAGE_SIZE < total && (
            <Link className="inline-flex min-h-11 items-center underline" href={`/admin/orders${qs(filter, pageNo + 1)}`}>
              Next →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
