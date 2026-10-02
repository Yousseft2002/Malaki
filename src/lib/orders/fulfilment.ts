import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { fromUtcDate } from "@/lib/domain/dates";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { newOrderNotification } from "@/lib/email/templates/owner-notifications";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { PaidDetails, WebhookDeps } from "./webhook";

type BoxContent = { boxItemId: string; name: string; quantity: number };

async function claimEvent(id: string, type: string) {
  try {
    await db.webhookEvent.create({ data: { id, type } });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return false;
    throw err;
  }
}

async function releaseEvent(id: string) {
  await db.webhookEvent.deleteMany({ where: { id } });
}

/** Mark paid and decrement stock in one transaction. Idempotent. */
async function markOrderPaid(d: PaidDetails): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: d.orderId }, include: { items: true } });
    if (!order) throw new Error(`Order ${d.orderId} not found`);
    if (order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED") return false;
    if (order.stripeCheckoutSessionId && order.stripeCheckoutSessionId !== d.sessionId) {
      throw new Error(`Session mismatch for order ${order.id}`);
    }

    const notes: string[] = [];
    if (order.status === "CANCELLED") notes.push("Payment arrived after the order had been cancelled — check capacity.");
    if (d.amountTotal !== order.totalCents || d.currency?.toUpperCase() !== order.currency.toUpperCase()) {
      notes.push(`Amount mismatch: Stripe charged ${d.amountTotal} ${d.currency}, order total ${order.totalCents} ${order.currency}.`);
    }

    let stockIssue = false;
    const decrement = async (where: { variantId?: string; boxItemId?: string }, qty: number) => {
      const result = where.variantId
        ? await tx.variant.updateMany({ where: { id: where.variantId, stock: { gte: qty } }, data: { stock: { decrement: qty } } })
        : await tx.boxItem.updateMany({ where: { id: where.boxItemId, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
      if (result.count === 0) stockIssue = true;
    };
    for (const item of order.items) {
      if (item.variantId) await decrement({ variantId: item.variantId }, item.quantity);
      for (const piece of (item.boxContents as BoxContent[] | null) ?? []) {
        await decrement({ boxItemId: piece.boxItemId }, piece.quantity * item.quantity);
      }
    }
    if (stockIssue) notes.push("Stock ran out for at least one item between checkout and payment.");

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        cancelledAt: null,
        stripeCheckoutSessionId: d.sessionId,
        stripePaymentIntentId: d.paymentIntentId,
        stockIssue,
        adminNote: notes.length ? [order.adminNote, ...notes].filter(Boolean).join("\n") : order.adminNote,
      },
    });
    for (const note of notes) logger.warn("order.paid_with_issue", { orderId: order.id, note });
    return true;
  });
}

async function cancelPendingOrder(orderId: string, reason: string) {
  await db.order.updateMany({
    where: { id: orderId, status: "PENDING_PAYMENT" },
    data: { status: "CANCELLED", cancelledAt: new Date(), adminNote: reason },
  });
}

export async function sendOrderConfirmation(orderId: string): Promise<boolean> {
  try {
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true, giftOptions: true } });
    const email = orderConfirmationEmail({
      orderNumber: order.number,
      buyerName: order.buyerName,
      currency: order.currency,
      items: order.items.map((i) => ({
        name: i.productName,
        variant: i.variantName,
        quantity: i.quantity,
        lineTotalCents: i.lineTotalCents,
        contents: ((i.boxContents as BoxContent[] | null) ?? []).map((p) => `${p.quantity} × ${p.name}`),
      })),
      subtotalCents: order.subtotalCents,
      giftWrapCents: order.giftWrapCents,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      fulfilment: order.fulfilment,
      shippingRuleName: order.shippingRuleName,
      deliveryDate: order.giftOptions?.deliveryDate ? fromUtcDate(order.giftOptions.deliveryDate) : null,
      recipientName: order.giftOptions?.recipientName ?? order.buyerName,
      address:
        order.fulfilment === "DELIVERY"
          ? [order.addressLine1, order.addressLine2, [order.postalCode, order.city].filter(Boolean).join(" "), order.region, order.country].filter(
              (l): l is string => !!l,
            )
          : ["Collection in person"],
      giftNote: order.giftOptions?.note ?? null,
    });
    await sendEmail({ to: order.buyerEmail, ...email });
    await db.order.update({ where: { id: order.id }, data: { confirmationEmailAt: new Date() } });

    const owner = env().ORDER_NOTIFICATION_EMAIL;
    if (owner) {
      await sendEmail({
        to: owner,
        ...newOrderNotification({
          orderNumber: order.number,
          totalCents: order.totalCents,
          currency: order.currency,
          dispatchDate: fromUtcDate(order.dispatchDate),
        }),
      });
    }
    return true;
  } catch (err) {
    // The order is paid either way; the admin can resend from the order page.
    logger.error("order.confirmation_email_failed", { orderId, err });
    return false;
  }
}

export const webhookDeps: WebhookDeps = {
  claimEvent,
  releaseEvent,
  markOrderPaid,
  cancelPendingOrder,
  sendConfirmation: async (orderId) => {
    await sendOrderConfirmation(orderId);
  },
  log: (level, msg, ctx) => logger[level](msg, ctx),
};
