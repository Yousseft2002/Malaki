import { notFound } from "next/navigation";
import { resendConfirmation, saveOrderNote, updateOrderStatus } from "@/app/admin/actions/orders";
import { AdminForm } from "@/components/admin/admin-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { money } from "@/components/ui/price";
import { canTransition } from "@/lib/admin/forms";
import { requireAdmin } from "@/lib/auth/admin";
import { countryName } from "@/lib/countries";
import { db } from "@/lib/db";
import { fromUtcDate } from "@/lib/domain/dates";

type Props = { params: Promise<{ id: string }> };
type BoxContent = { name: string; quantity: number };

const fmt = (d: Date | null) => (d ? d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");

export default async function AdminOrderPage({ params }: Props) {
  await requireAdmin();
  const order = await db.order.findUnique({ where: { id: (await params).id }, include: { items: true, giftOptions: true } });
  if (!order) notFound();
  const paid = order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED";
  const address = [order.addressLine1, order.addressLine2, order.city, order.region, order.postalCode, order.country && countryName(order.country)]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="text-3xl text-emerald">Order {order.number}</h1>
        <StatusBadge status={order.status} />
      </div>
      {order.stockIssue && (
        <p role="alert" className="mb-6 border border-error bg-white p-3 text-error">
          Stock ran out for an item in this order — check before packing.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="items-title" className="h-fit border border-sand bg-white p-5">
          <h2 id="items-title" className="eyebrow mb-4 text-emerald">
            Items
          </h2>
          <ul className="divide-y divide-sand">
            {order.items.map((i) => (
              <li key={i.id} className="py-3">
                <div className="flex justify-between gap-4">
                  <span>
                    {i.quantity} × {i.productName} — {i.variantName}
                  </span>
                  <span>{money(i.lineTotalCents)}</span>
                </div>
                {Array.isArray(i.boxContents) && (
                  <p className="text-sm text-muted">
                    {(i.boxContents as BoxContent[]).map((p) => `${p.quantity} × ${p.name}`).join(", ")}
                  </p>
                )}
                {i.giftWrap && <p className="text-sm text-gold-ink">Gift wrap</p>}
                {i.giftNote && <p className="text-sm italic">Note: “{i.giftNote}”</p>}
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-1 border-t border-sand pt-4 text-sm">
            <dt>Subtotal</dt>
            <dd className="text-right">{money(order.subtotalCents)}</dd>
            <dt>Gift wrapping</dt>
            <dd className="text-right">{money(order.giftWrapCents)}</dd>
            <dt>{order.shippingRuleName}</dt>
            <dd className="text-right">{money(order.shippingCents)}</dd>
            <dt className="font-medium">Total ({order.currency})</dt>
            <dd className="text-right font-medium">{money(order.totalCents)}</dd>
          </dl>
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="fulfil-title" className="border border-sand bg-white p-5">
            <h2 id="fulfil-title" className="eyebrow mb-4 text-emerald">
              Fulfilment
            </h2>
            <p className="text-sm">
              Dispatch: <strong>{fromUtcDate(order.dispatchDate)}</strong>
            </p>
            <p className="text-sm">
              Requested {order.fulfilment === "PICKUP" ? "collection" : "delivery"}:{" "}
              <strong>{order.giftOptions?.deliveryDate ? fromUtcDate(order.giftOptions.deliveryDate) : "—"}</strong>
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4">
              {(["PACKED", "SHIPPED"] as const)
                .filter((s) => canTransition(order.status, s))
                .map((s) => (
                  <AdminForm key={s} action={updateOrderStatus} submitLabel={`Mark ${s.toLowerCase()}`}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="status" value={s} />
                  </AdminForm>
                ))}
            </div>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 text-sm text-muted">
              <dt>Created</dt>
              <dd>{fmt(order.createdAt)}</dd>
              <dt>Paid</dt>
              <dd>{fmt(order.paidAt)}</dd>
              <dt>Packed</dt>
              <dd>{fmt(order.packedAt)}</dd>
              <dt>Shipped</dt>
              <dd>{fmt(order.shippedAt)}</dd>
              <dt>Email sent</dt>
              <dd>{fmt(order.confirmationEmailAt)}</dd>
            </dl>
            {paid && (
              <AdminForm action={resendConfirmation} submitLabel="Resend confirmation email">
                <input type="hidden" name="orderId" value={order.id} />
              </AdminForm>
            )}
          </section>

          <section aria-labelledby="people-title" className="border border-sand bg-white p-5 text-sm">
            <h2 id="people-title" className="eyebrow mb-4 text-emerald">
              Buyer &amp; recipient
            </h2>
            <p>
              <strong>{order.buyerName}</strong>
              <br />
              {order.buyerEmail}
              {order.buyerPhone && (
                <>
                  <br />
                  {order.buyerPhone}
                </>
              )}
            </p>
            <p className="mt-4">
              <strong>For {order.giftOptions?.recipientName}</strong>
              {order.giftOptions?.recipientPhone && (
                <>
                  <br />
                  {order.giftOptions.recipientPhone}
                </>
              )}
            </p>
            <p>{order.fulfilment === "DELIVERY" ? address : "Collecting in person"}</p>
            {order.giftOptions?.note && <p className="mt-4 italic">Gift note: “{order.giftOptions.note}”</p>}
            {order.giftOptions?.giftWrap && <p className="mt-2 text-gold-ink">Gift wrap requested</p>}
          </section>

          <section aria-labelledby="note-title" className="border border-sand bg-white p-5">
            <h2 id="note-title" className="eyebrow mb-4 text-emerald">
              Internal note
            </h2>
            <AdminForm action={saveOrderNote} submitLabel="Save note">
              <input type="hidden" name="orderId" value={order.id} />
              <label htmlFor="adminNote" className="sr-only">
                Internal note
              </label>
              <textarea id="adminNote" name="adminNote" rows={4} defaultValue={order.adminNote ?? ""} className="field-input text-sm" />
            </AdminForm>
            {order.stripePaymentIntentId && <p className="mt-4 text-xs text-muted">Stripe payment: {order.stripePaymentIntentId}</p>}
          </section>
        </div>
      </div>
    </>
  );
}
