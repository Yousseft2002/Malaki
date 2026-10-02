import { requireEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { webhookDeps } from "@/lib/orders/fulfilment";
import { handleStripeEvent } from "@/lib/orders/webhook";
import { getStripe } from "@/lib/stripe";

// Stripe calls this endpoint; orders are only confirmed here, after the
// signature has been verified against the raw request body.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const payload = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, requireEnv("STRIPE_WEBHOOK_SECRET"));
  } catch (err) {
    logger.warn("stripe.webhook.bad_signature", { err });
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const outcome = await handleStripeEvent(event, webhookDeps);
    logger.info("stripe.webhook.handled", { eventId: event.id, type: event.type, outcome });
    return Response.json({ received: true, outcome });
  } catch {
    // Non-2xx makes Stripe retry with backoff.
    return new Response("Webhook handler failed", { status: 500 });
  }
}
