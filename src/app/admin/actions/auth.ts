"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";
import type { FormState } from "@/lib/validation/schemas";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = clientIp(await headers());
  if (!rateLimit(`admin-login:${ip}`, LIMITS.adminLogin).ok) {
    logger.warn("admin.login_rate_limited", { ip });
    return { status: "error", message: "Too many attempts. Please wait 15 minutes." };
  }

  const config = env();
  if (!config.ADMIN_EMAIL || !config.ADMIN_PASSWORD_HASH || !config.ADMIN_SESSION_SECRET) {
    logger.error("admin.not_configured");
    return { status: "error", message: "Admin access is not configured. See README → Admin." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const emailOk = email === config.ADMIN_EMAIL.toLowerCase();
  // Always run the hash check so timing doesn't reveal whether the email matched.
  const passwordOk = await verifyPassword(password, config.ADMIN_PASSWORD_HASH);
  if (!emailOk || !passwordOk) {
    logger.warn("admin.login_failed", { ip });
    return { status: "error", message: "Incorrect email or password." };
  }

  const token = await signSession({ sub: email, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }, config.ADMIN_SESSION_SECRET);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_TTL_SECONDS,
  });
  logger.info("admin.login");
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
  redirect("/admin/login");
}
