import { after } from "next/server";
import { handleTrack } from "@/lib/analytics/track";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/store-config";

// First-party page views from the shop's beacon (components/layout/page-view-beacon).
// Write-only: it never returns analytics data. Always answers 204.
export async function POST(request: Request) {
  const config = env();
  const ip = clientIp(request.headers);
  return handleTrack(request, {
    // Stored after the response is sent, so the beacon is never kept waiting.
    save: (view) =>
      after(async () => {
        try {
          await db.pageView.create({ data: view });
        } catch (err) {
          logger.warn("track.save_failed", { err });
        }
      }),
    secret: config.ANALYTICS_SALT ?? config.ADMIN_SESSION_SECRET,
    timeZone: config.STORE_TIMEZONE,
    siteHost: new URL(SITE_URL).hostname,
    secureCookies: SITE_URL.startsWith("https://"),
    ip,
    allow: (key) => rateLimit(`track:${key}`, LIMITS.track).ok,
    onError: (err) => logger.warn("track.failed", { err }),
  });
}
