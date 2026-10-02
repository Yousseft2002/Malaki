"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Sends one first-party page view per route change to /api/track. No cookies
 * are read or written here, nothing is sent when the browser asks not to be
 * tracked (Do Not Track / Global Privacy Control), and sendBeacon never blocks
 * the page.
 */
export function PageViewBeacon() {
  const path = usePathname();
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl || !nav.sendBeacon) return;
    const q = new URLSearchParams(location.search);
    const body = {
      path,
      referrer: document.referrer || null,
      utmSource: q.get("utm_source"),
      utmMedium: q.get("utm_medium"),
      utmCampaign: q.get("utm_campaign"),
      fbclid: q.get("fbclid"),
    };
    nav.sendBeacon("/api/track", new Blob([JSON.stringify(body)], { type: "application/json" }));
  }, [path]);
  return null;
}
