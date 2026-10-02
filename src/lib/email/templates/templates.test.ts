import { describe, expect, it } from "vitest";
import { orderConfirmationEmail } from "./order-confirmation";

const order = {
  orderNumber: "MLK-ABC123",
  buyerName: "Sara <script>",
  currency: "EUR",
  items: [{ name: "The Malaki Box", variant: "Box of 12", quantity: 2, lineTotalCents: 6000 }],
  subtotalCents: 6000,
  giftWrapCents: 0,
  shippingCents: 500,
  totalCents: 6500,
  fulfilment: "DELIVERY" as const,
  shippingRuleName: "Standard delivery",
  deliveryDate: "2026-10-08",
  recipientName: "Amina",
  address: ["1 Rue Example", "Paris 75001", "FR"],
  giftNote: "Happy birthday & love",
};

describe("orderConfirmationEmail", () => {
  it("includes order number, totals and gift details", () => {
    const email = orderConfirmationEmail(order);
    expect(email.subject).toContain("MLK-ABC123");
    expect(email.text).toContain("2 × The Malaki Box — Box of 12");
    expect(email.text).toContain("Requested delivery date: 2026-10-08");
    expect(email.text).toContain('Gift note: "Happy birthday & love"');
    expect(email.text).not.toContain("Gift wrapping");
  });
  it("escapes customer-provided text in HTML", () => {
    const email = orderConfirmationEmail(order);
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("Sara &lt;script&gt;");
    expect(email.html).toContain("Happy birthday &amp; love");
  });
});
