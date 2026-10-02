import type { Metadata } from "next";
import { ClearCart } from "@/components/checkout/clear-cart";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

type Props = { searchParams: Promise<{ session_id?: string }> };

// This page never changes an order's status — only the verified Stripe
// webhook does. It just reports what the webhook has recorded so far.
export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;
  const order =
    typeof session_id === "string" && session_id.startsWith("cs_")
      ? await db.order.findUnique({
          where: { stripeCheckoutSessionId: session_id },
          select: { number: true, status: true, buyerEmail: true },
        })
      : null;

  if (!order) {
    return (
      <div className="container-page py-20 text-center">
        <SectionHeading as="h1" title="We couldn't find that order" intro="If you completed a payment, your confirmation email is on its way." />
        <ButtonLink href="/" variant="outline" className="mt-10">
          Back to the shop
        </ButtonLink>
      </div>
    );
  }

  const confirmed = order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED";
  return (
    <div className="container-page py-20 text-center">
      <ClearCart />
      <SectionHeading
        as="h1"
        eyebrow={`Order ${order.number}`}
        title="Thank you"
        intro={
          confirmed
            ? `Your order is confirmed. A confirmation has been sent to ${order.buyerEmail}.`
            : `We're confirming your payment. You'll receive an email at ${order.buyerEmail} as soon as it's complete.`
        }
      />
      <ButtonLink href="/" variant="outline" className="mt-10">
        Continue browsing
      </ButtonLink>
    </div>
  );
}
