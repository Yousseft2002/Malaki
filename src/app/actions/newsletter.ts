"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";
import { isLikelySpam } from "@/lib/spam";
import { type FormState, fieldErrorsOf, newsletterSchema } from "@/lib/validation/schemas";

const THANKS = "Thank you — you're on the list.";

export async function subscribeToNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "Please check your email address.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const ip = clientIp(await headers());
  if (!rateLimit(`newsletter:${ip}`, LIMITS.newsletter).ok) {
    return { status: "error", message: "Too many attempts. Please try again later." };
  }
  // Pretend success to bots so they learn nothing.
  if (isLikelySpam({ honeypot: parsed.data.website, startedAt: parsed.data.startedAt })) return { status: "success", message: THANKS };

  try {
    await db.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: { unsubscribedAt: null },
      create: { email: parsed.data.email, source: parsed.data.source },
    });
    logger.info("newsletter.subscribed", { source: parsed.data.source });
    return { status: "success", message: THANKS };
  } catch (err) {
    logger.error("newsletter.failed", { err });
    return { status: "error", message: "Something went wrong. Please try again." };
  }
}
