import "server-only";
import { env, requireEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { consoleProvider } from "./providers/console";
import { createSmtpProvider } from "./providers/smtp";
import type { EmailMessage, EmailProvider } from "./types";

let provider: EmailProvider | null = null;

function getProvider(): EmailProvider {
  if (provider) return provider;
  const e = env();
  provider =
    e.EMAIL_PROVIDER === "smtp"
      ? createSmtpProvider({
          host: requireEnv("SMTP_HOST"),
          port: e.SMTP_PORT ?? 587,
          secure: e.SMTP_SECURE,
          user: e.SMTP_USER,
          password: e.SMTP_PASSWORD,
        })
      : consoleProvider;
  return provider;
}

/** Send an email. Throws on failure so callers can decide whether to retry. */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const p = getProvider();
  await p.send({ ...message, from: env().EMAIL_FROM });
  logger.info("email.sent", { provider: p.name, subject: message.subject });
}

/** Test hook. */
export function setEmailProvider(next: EmailProvider | null) {
  provider = next;
}
