// Central, validated access to environment variables. Every variable is
// documented in .env.example. Values are read lazily so `next build` works
// without production secrets; a missing variable fails loudly at first use.

import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  STORE_TIMEZONE: z.string().default("UTC"),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Stripe sessions must expire 30 min – 24 h after creation; keep a margin both ways.
  CHECKOUT_HOLD_MINUTES: z.coerce.number().int().min(31).max(1380).default(60),

  EMAIL_PROVIDER: z.enum(["console", "smtp"]).default("console"),
  EMAIL_FROM: z.string().default("MALAKI <orders@example.com>"),
  ORDER_NOTIFICATION_EMAIL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  ADMIN_SESSION_SECRET: z.string().optional(),

  ERROR_WEBHOOK_URL: z.url().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Read a variable that a specific feature requires, with a clear error if it's missing. */
export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env()[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing environment variable ${String(key)} (see .env.example)`);
  }
  return value as NonNullable<Env[K]>;
}
