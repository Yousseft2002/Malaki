// Public, non-secret store settings that both server and client code read.
// These are NEXT_PUBLIC_* so they are inlined at build time.

/** ISO 4217 code. MALAKI is based in Boston, so prices are in US dollars by default. */
export const STORE_CURRENCY = (process.env.NEXT_PUBLIC_STORE_CURRENCY || "USD").toUpperCase();

export const STORE_LOCALE = process.env.NEXT_PUBLIC_STORE_LOCALE || "en-US";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const BRAND_NAME = "MALAKI";
