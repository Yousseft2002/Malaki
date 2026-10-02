"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { newEnquiryNotification } from "@/lib/email/templates/owner-notifications";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";
import { isLikelySpam } from "@/lib/spam";
import { type FormState, enquirySchema, fieldErrorsOf } from "@/lib/validation/schemas";

const THANKS = "Thank you — your enquiry has been received. We'll be in touch soon.";

export async function submitEnquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = clientIp(await headers());
  if (!rateLimit(`enquiry:${ip}`, LIMITS.enquiry).ok) {
    return { status: "error", message: "You've sent several enquiries recently. Please try again later or email us directly." };
  }

  const parsed = enquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const data = parsed.data;
  if (isLikelySpam({ honeypot: data.website, startedAt: data.startedAt })) {
    logger.info("enquiry.spam_blocked");
    return { status: "success", message: THANKS };
  }

  try {
    const enquiry = await db.enquiry.create({
      data: {
        type: data.type,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        eventDate: data.eventDate ? new Date(`${data.eventDate}T00:00:00Z`) : undefined,
        quantity: data.quantity,
        budget: data.budget,
        message: data.message,
      },
    });
    logger.info("enquiry.created", { enquiryId: enquiry.id, type: data.type });

    const owner = env().ORDER_NOTIFICATION_EMAIL;
    if (owner) {
      await sendEmail({ to: owner, replyTo: data.email, ...newEnquiryNotification(data) }).catch((err) =>
        logger.error("enquiry.notify_failed", { enquiryId: enquiry.id, err }),
      );
    }
    return { status: "success", message: THANKS };
  } catch (err) {
    logger.error("enquiry.failed", { err });
    return { status: "error", message: "Something went wrong sending your enquiry. Please try again." };
  }
}
