"use server";

import { revalidatePath } from "next/cache";
import { canTransition } from "@/lib/admin/forms";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendOrderConfirmation } from "@/lib/orders/fulfilment";
import type { FormState } from "@/lib/validation/schemas";

const TARGETS = ["PAID", "PACKED", "SHIPPED"] as const;

export async function updateOrderStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("orderId"));
  const to = String(formData.get("status")) as (typeof TARGETS)[number];
  if (!TARGETS.includes(to)) return { status: "error", message: "Unknown status." };

  const order = await db.order.findUnique({ where: { id }, select: { status: true } });
  if (!order) return { status: "error", message: "Order not found." };
  if (!canTransition(order.status, to)) {
    return { status: "error", message: `An order that is ${order.status.toLowerCase().replace("_", " ")} can't be marked ${to.toLowerCase()}.` };
  }
  // Conditional update guards against two admins clicking at once.
  const result = await db.order.updateMany({
    where: { id, status: order.status },
    data: {
      status: to,
      ...(to === "PACKED" ? { packedAt: new Date() } : {}),
      ...(to === "SHIPPED" ? { shippedAt: new Date() } : {}),
    },
  });
  if (result.count === 0) return { status: "error", message: "The order changed meanwhile — please reload." };
  logger.info("admin.order_status", { orderId: id, from: order.status, to });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  return { status: "success", message: `Marked ${to.toLowerCase()}.` };
}

export async function saveOrderNote(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("orderId"));
  const note = String(formData.get("adminNote") ?? "").slice(0, 5000);
  await db.order.update({ where: { id }, data: { adminNote: note || null } });
  revalidatePath(`/admin/orders/${id}`);
  return { status: "success", message: "Note saved." };
}

export async function resendConfirmation(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("orderId"));
  const order = await db.order.findUnique({ where: { id }, select: { status: true } });
  if (!order || order.status === "PENDING_PAYMENT" || order.status === "CANCELLED") {
    return { status: "error", message: "Only paid orders can be confirmed." };
  }
  const ok = await sendOrderConfirmation(id);
  revalidatePath(`/admin/orders/${id}`);
  return ok ? { status: "success", message: "Confirmation email sent." } : { status: "error", message: "Sending failed — check the email settings and logs." };
}
