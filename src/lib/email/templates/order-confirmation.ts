import { formatMoney } from "@/lib/domain/money";
import { escapeHtml, layout } from "./layout";

export interface OrderEmailData {
  orderNumber: string;
  buyerName: string;
  currency: string;
  items: { name: string; variant: string; quantity: number; lineTotalCents: number; contents?: string[] }[];
  subtotalCents: number;
  giftWrapCents: number;
  shippingCents: number;
  totalCents: number;
  fulfilment: "DELIVERY" | "PICKUP";
  shippingRuleName: string;
  deliveryDate: string | null;
  recipientName: string;
  address: string[];
  giftNote: string | null;
}

export function orderConfirmationEmail(order: OrderEmailData) {
  const money = (c: number) => formatMoney(c, order.currency);
  const subject = `Your MALAKI order ${order.orderNumber}`;
  const when = order.deliveryDate
    ? `${order.fulfilment === "PICKUP" ? "Pickup" : "Requested delivery"} date: ${order.deliveryDate}`
    : null;

  const itemLines = order.items.map(
    (i) =>
      `${i.quantity} × ${i.name} — ${i.variant}: ${money(i.lineTotalCents)}` +
      (i.contents?.length ? `\n    ${i.contents.join(", ")}` : ""),
  );
  const totals = [
    `Subtotal: ${money(order.subtotalCents)}`,
    ...(order.giftWrapCents > 0 ? [`Gift wrapping: ${money(order.giftWrapCents)}`] : []),
    `${order.shippingRuleName}: ${money(order.shippingCents)}`,
    `Total: ${money(order.totalCents)}`,
  ];

  const text = [
    `Dear ${order.buyerName},`,
    "",
    `Thank you for your order. Your payment has been received and order ${order.orderNumber} is confirmed.`,
    "",
    ...itemLines,
    "",
    ...totals,
    "",
    `For: ${order.recipientName}`,
    ...order.address,
    ...(when ? [when] : []),
    ...(order.giftNote ? ["", `Gift note: "${order.giftNote}"`] : []),
    "",
    "[EMAIL SIGN-OFF — replace with your own wording and contact details]",
  ].join("\n");

  const rows = order.items
    .map(
      (i) => `<tr>
  <td style="padding:8px 0;border-bottom:1px solid #EDE5D3">${i.quantity} × ${escapeHtml(i.name)}<br>
    <span style="color:#4E5A50;font-size:13px">${escapeHtml(i.variant)}${
      i.contents?.length ? ` · ${escapeHtml(i.contents.join(", "))}` : ""
    }</span></td>
  <td style="padding:8px 0;border-bottom:1px solid #EDE5D3;text-align:right">${money(i.lineTotalCents)}</td>
</tr>`,
    )
    .join("");
  const totalRows = totals
    .map((t, idx) => {
      const [label, value] = [t.slice(0, t.lastIndexOf(":")), t.slice(t.lastIndexOf(":") + 1)];
      const weight = idx === totals.length - 1 ? "font-weight:600" : "";
      return `<tr><td style="padding:4px 0;${weight}">${escapeHtml(label)}</td><td style="padding:4px 0;text-align:right;${weight}">${escapeHtml(value.trim())}</td></tr>`;
    })
    .join("");

  const html = layout(
    subject,
    `<p>Dear ${escapeHtml(order.buyerName)},</p>
<p>Thank you for your order. Your payment has been received and order <strong>${escapeHtml(order.orderNumber)}</strong> is confirmed.</p>
<table role="presentation" width="100%" style="border-collapse:collapse;margin:24px 0">${rows}</table>
<table role="presentation" width="100%" style="border-collapse:collapse">${totalRows}</table>
<h2 style="font-family:Georgia,serif;font-weight:normal;font-size:18px;margin:32px 0 8px">For ${escapeHtml(order.recipientName)}</h2>
<p style="margin:0">${order.address.map(escapeHtml).join("<br>")}</p>
${when ? `<p>${escapeHtml(when)}</p>` : ""}
${order.giftNote ? `<p style="font-style:italic">“${escapeHtml(order.giftNote)}”</p>` : ""}
<p style="color:#4E5A50">[EMAIL SIGN-OFF — replace with your own wording and contact details]</p>`,
  );

  return { subject, text, html };
}
