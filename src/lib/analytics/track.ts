// First-party page-view counting for /api/track. No raw IPs, no tracking
// cookies: a visitor is a SHA-256 of (daily salt + IP + user agent), so they can
// only be recognised within one day — the approach Plausible uses.
//
// The one cookie this sets is the ad-attribution cookie, and only on a visit
// that arrives from a tagged ad link (utm_* / fbclid). It holds the campaign,
// not an identifier, and is read at checkout to credit the order to the ad.

import { createHash } from "node:crypto";
import { z } from "zod";
import { todayIn } from "@/lib/domain/dates";

const short = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

export const trackSchema = z.object({
  path: z.string().trim().min(1).max(300).startsWith("/"),
  referrer: z.string().trim().max(2000).nullish(),
  utmSource: short(100),
  utmMedium: short(100),
  utmCampaign: short(200),
  fbclid: short(500),
});
export type TrackInput = z.infer<typeof trackSchema>;

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|curl|wget|python|axios|node-fetch|undici|go-http|java\/|httpclient|monitor|uptime/i;

/** Obvious bots and scripts, plus requests with no user agent at all. */
export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT.test(userAgent);
}

export function isMobileUserAgent(userAgent: string): boolean {
  return /Mobi|Android|iPhone|iPod|Windows Phone|IEMobile|Opera Mini/i.test(userAgent);
}

/** Only shop pages are counted: never admin, API or Next internals. */
export function isTrackedPath(path: string): boolean {
  return !/^\/(admin|api|_next)(\/|$)/.test(path);
}

/** The path without query string or fragment (those can hold personal data). */
export function cleanPath(path: string): string {
  return path.split(/[?#]/)[0]!.slice(0, 300) || "/";
}

/** "https://l.instagram.com/?u=…" → "l.instagram.com"; same-site or invalid → null. */
export function referrerHost(referrer: string | null | undefined, siteHost: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return host && host !== siteHost.toLowerCase() ? host : null;
  } catch {
    return null;
  }
}

/** A salt that changes every store-time-zone day, so hashes can't be linked across days. */
export function dailySalt(secret: string, now: Date, timeZone: string): string {
  return createHash("sha256").update(`malaki-visitors:${secret}:${todayIn(timeZone, now)}`).digest("hex");
}

export function visitorHash(salt: string, ip: string, userAgent: string): string {
  return createHash("sha256").update(`${salt}|${ip}|${userAgent}`).digest("hex");
}

// ─── Ad attribution cookie ───────────────────────────────────────────────────

export const ATTRIBUTION_COOKIE = "malaki_attr";
export const ATTRIBUTION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export const attributionSchema = z.object({
  utmSource: short(100),
  utmMedium: short(100),
  utmCampaign: short(200),
  fbclid: short(500),
});
export type Attribution = z.infer<typeof attributionSchema>;

export function hasAttribution(input: Partial<Attribution>): boolean {
  return Boolean(input.utmSource || input.fbclid);
}

export function encodeAttribution(a: Attribution): string {
  return encodeURIComponent(JSON.stringify(a));
}

/** Parses the cookie value; anything malformed → null (never throws). */
export function parseAttribution(raw: string | undefined | null): Attribution | null {
  if (!raw) return null;
  try {
    const parsed = attributionSchema.safeParse(JSON.parse(decodeURIComponent(raw)));
    return parsed.success && hasAttribution(parsed.data) ? parsed.data : null;
  } catch {
    return null;
  }
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

// ─── Request handling ────────────────────────────────────────────────────────

export type PageViewRecord = {
  path: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  visitorHash: string;
  isMobile: boolean;
};

export type TrackDeps = {
  /** Stores the view. Called after the response where possible. */
  save: (view: PageViewRecord) => void | Promise<void>;
  secret: string | undefined;
  timeZone: string;
  siteHost: string;
  secureCookies: boolean;
  ip: string;
  /** true = allowed. */
  allow: (ip: string) => boolean;
  now?: () => Date;
  onError?: (err: unknown) => void;
};

const NO_CONTENT = () => new Response(null, { status: 204 });

/**
 * POST /api/track. Always answers 204 quickly — even for bad input, bots or
 * errors — so the beacon never surfaces anything to the visitor.
 */
export async function handleTrack(request: Request, deps: TrackDeps): Promise<Response> {
  try {
    const userAgent = request.headers.get("user-agent");
    if (isBot(userAgent) || !deps.secret || !deps.allow(deps.ip)) return NO_CONTENT();

    const parsed = trackSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NO_CONTENT();
    const input = parsed.data;
    const path = cleanPath(input.path);
    if (!isTrackedPath(path)) return NO_CONTENT();

    const now = deps.now?.() ?? new Date();
    await deps.save({
      path,
      referrer: referrerHost(input.referrer, deps.siteHost),
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      visitorHash: visitorHash(dailySalt(deps.secret, now, deps.timeZone), deps.ip, userAgent!),
      isMobile: isMobileUserAgent(userAgent!),
    });

    // First ad-tagged visit: remember the campaign for checkout (first touch wins).
    const response = NO_CONTENT();
    const attribution = { utmSource: input.utmSource, utmMedium: input.utmMedium, utmCampaign: input.utmCampaign, fbclid: input.fbclid };
    if (hasAttribution(attribution) && !parseAttribution(readCookie(request.headers.get("cookie"), ATTRIBUTION_COOKIE))) {
      response.headers.append(
        "Set-Cookie",
        `${ATTRIBUTION_COOKIE}=${encodeAttribution(attribution)}; Path=/; Max-Age=${ATTRIBUTION_MAX_AGE}; SameSite=Lax; HttpOnly${deps.secureCookies ? "; Secure" : ""}`,
      );
    }
    return response;
  } catch (err) {
    deps.onError?.(err);
    return NO_CONTENT();
  }
}
