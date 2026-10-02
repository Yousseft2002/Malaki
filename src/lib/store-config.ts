// Public, non-secret store settings that both server and client code read.
// These are NEXT_PUBLIC_* so they are inlined at build time.

/** ISO 4217 code. DECISION NEEDED: set NEXT_PUBLIC_STORE_CURRENCY to the currency you sell in. */
export const STORE_CURRENCY = (process.env.NEXT_PUBLIC_STORE_CURRENCY || "EUR").toUpperCase();

export const STORE_LOCALE = process.env.NEXT_PUBLIC_STORE_LOCALE || "en-GB";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const BRAND_NAME = "MALAKI";
