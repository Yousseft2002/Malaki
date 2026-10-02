import { toCsv } from "@/lib/admin/csv";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { fromUtcDate } from "@/lib/domain/dates";

const STATUSES = ["PENDING_PAYMENT", "PAID", "PACKED", "SHIPPED", "CANCELLED"] as const;
type BoxContent = { name: string; quantity: number };

const HEADERS = [
  "order",
  "status",
  "created_at",
  "paid_at",
  "dispatch_date",
  "delivery_date",
  "method",
  "shipping",
  "buyer_name",
  "buyer_email",
  "buyer_phone",
  "recipient_name",
  "recipient_phone",
  "address_1",
  "address_2",
  "city",
  "region",
  "postcode",
  "country",
  "items",
  "gift_wrap",
  "gift_note",
  "currency",
  "subtotal",
  "gift_wrap_total",
  "shipping_total",
  "total",
  "stock_issue",
  "admin_note",
];

const amount = (c: number) => (c / 100).toFixed(2);

export async function GET(request: Request) {
  await requireAdmin();
  const status = STATUSES.find((s) => s === new URL(request.url).searchParams.get("status"));
  const orders = await db.order.findMany({
    where: status ? { status } : { status: { not: "PENDING_PAYMENT" } },
    orderBy: { createdAt: "asc" },
    include: { items: true, giftOptions: true },
  });

  const rows = orders.map((o) => [
    o.number,
    o.status,
    o.createdAt,
    o.paidAt,
    fromUtcDate(o.dispatchDate),
    o.giftOptions?.deliveryDate ? fromUtcDate(o.giftOptions.deliveryDate) : "",
    o.fulfilment,
    o.shippingRuleName,
    o.buyerName,
    o.buyerEmail,
    o.buyerPhone,
    o.giftOptions?.recipientName,
    o.giftOptions?.recipientPhone,
    o.addressLine1,
    o.addressLine2,
    o.city,
    o.region,
    o.postalCode,
    o.country,
    o.items
      .map((i) => {
        const box = Array.isArray(i.boxContents)
          ? ` [${(i.boxContents as BoxContent[]).map((p) => `${p.quantity}x ${p.name}`).join("; ")}]`
          : "";
        return `${i.quantity}x ${i.productName} (${i.variantName})${box}`;
      })
      .join(" | "),
    o.giftOptions?.giftWrap ? "yes" : "no",
    o.giftOptions?.note,
    o.currency,
    amount(o.subtotalCents),
    amount(o.giftWrapCents),
    amount(o.shippingCents),
    amount(o.totalCents),
    o.stockIssue ? "yes" : "",
    o.adminNote,
  ]);

  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(HEADERS, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="malaki-orders-${status?.toLowerCase() ?? "all"}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
