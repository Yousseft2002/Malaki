// Stripe webhook event handling. Pure orchestration over injected
// dependencies so it can be unit-tested without a database or Stripe.

export interface SessionLike {
  id: string;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  payment_intent: string | { id: string } | null;
  metadata: Record<string, string> | null;
}

export interface EventLike {
  id: string;
  type: string;
  data: { object: unknown };
}

export interface PaidDetails {
  orderId: string;
  sessionId: string;
  paymentIntentId: string | null;
  amountTotal: number | null;
  currency: string | null;
}

export interface WebhookDeps {
  /** Record the event id; returns false if it was already processed. */
  claimEvent(id: string, type: string): Promise<boolean>;
  /** Forget a claimed event so Stripe's retry can process it again. */
  releaseEvent(id: string): Promise<void>;
  /** PENDING_PAYMENT → PAID (+ stock). Returns true only on the first transition. */
  markOrderPaid(details: PaidDetails): Promise<boolean>;
  /** PENDING_PAYMENT → CANCELLED. No-op for any other status. */
  cancelPendingOrder(orderId: string, reason: string): Promise<void>;
  /** Send buyer confirmation (and owner notification). Must not throw. */
  sendConfirmation(orderId: string): Promise<void>;
  log(level: "info" | "warn" | "error", msg: string, ctx?: Record<string, unknown>): void;
}

export type WebhookOutcome = "duplicate" | "ignored" | "paid" | "already_paid" | "awaiting_payment" | "cancelled" | "no_order";

const HANDLED = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

export async function handleStripeEvent(event: EventLike, deps: WebhookDeps): Promise<WebhookOutcome> {
  if (!HANDLED.has(event.type)) return "ignored";
  if (!(await deps.claimEvent(event.id, event.type))) {
    deps.log("info", "stripe.webhook.duplicate", { eventId: event.id });
    return "duplicate";
  }

  try {
    const session = event.data.object as SessionLike;
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      deps.log("warn", "stripe.webhook.no_order_id", { eventId: event.id, sessionId: session.id });
      return "no_order";
    }

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        // Delayed payment methods complete the session before the money arrives.
        if (session.payment_status !== "paid") {
          deps.log("info", "stripe.webhook.awaiting_payment", { orderId, eventId: event.id });
          return "awaiting_payment";
        }
        const firstTime = await deps.markOrderPaid({
          orderId,
          sessionId: session.id,
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
          amountTotal: session.amount_total,
          currency: session.currency,
        });
        if (!firstTime) return "already_paid";
        await deps.sendConfirmation(orderId);
        return "paid";
      }
      case "checkout.session.async_payment_failed":
        await deps.cancelPendingOrder(orderId, "Payment failed");
        return "cancelled";
      case "checkout.session.expired":
        await deps.cancelPendingOrder(orderId, "Checkout expired");
        return "cancelled";
      default:
        return "ignored";
    }
  } catch (err) {
    // Let Stripe retry: un-claim the event and surface the failure.
    await deps.releaseEvent(event.id);
    deps.log("error", "stripe.webhook.failed", { eventId: event.id, type: event.type, err });
    throw err;
  }
}
