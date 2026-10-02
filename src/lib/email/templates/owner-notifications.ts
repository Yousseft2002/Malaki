import { formatMoney } from "@/lib/domain/money";
import { escapeHtml, layout } from "./layout";

export function newOrderNotification(o: { orderNumber: string; totalCents: number; currency: string; dispatchDate: string }) {
  const subject = `New paid order ${o.orderNumber}`;
  const text = `Order ${o.orderNumber} has been paid (${formatMoney(o.totalCents, o.currency)}). Dispatch date: ${o.dispatchDate}.`;
  return { subject, text, html: layout(subject, `<p>${escapeHtml(text)}</p>`) };
}

export function newEnquiryNotification(e: { type: string; name: string; email: string; message: string }) {
  const subject = `New ${e.type.toLowerCase()} enquiry from ${e.name}`;
  const text = `${e.name} <${e.email}> wrote:\n\n${e.message}`;
  return {
    subject,
    text,
    html: layout(
      subject,
      `<p><strong>${escapeHtml(e.name)}</strong> &lt;${escapeHtml(e.email)}&gt; wrote:</p><p style="white-space:pre-wrap">${escapeHtml(e.message)}</p>`,
    ),
  };
}
