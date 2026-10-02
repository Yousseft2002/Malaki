import { describe, expect, it, vi } from "vitest";
import {
  ATTRIBUTION_COOKIE,
  type PageViewRecord,
  type TrackDeps,
  encodeAttribution,
  handleTrack,
  isBot,
  parseAttribution,
  referrerHost,
} from "./track";

const PHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const IP = "203.0.113.42";

function setup(over: Partial<TrackDeps> = {}) {
  const saved: PageViewRecord[] = [];
  const deps: TrackDeps = {
    save: (v) => void saved.push(v),
    secret: "test-secret-0123456789abcdef0123456789",
    timeZone: "America/New_York",
    siteHost: "malaki.example",
    secureCookies: true,
    ip: IP,
    allow: () => true,
    now: () => new Date("2026-10-02T15:00:00Z"),
    ...over,
  };
  return { saved, deps };
}

function req(body: unknown, { ua = PHONE_UA, cookie }: { ua?: string | null; cookie?: string } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (ua) headers.set("user-agent", ua);
  if (cookie) headers.set("cookie", cookie);
  return new Request("http://localhost/api/track", { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) });
}

describe("POST /api/track", () => {
  it("stores a page view with host-only referrer, no raw IP and no query string", async () => {
    const { saved, deps } = setup();
    const res = await handleTrack(req({ path: "/products/the-malaki-box?email=a@b.c#x", referrer: "https://l.instagram.com/?u=secret" }), deps);
    expect(res.status).toBe(204);
    expect(saved).toHaveLength(1);
    const view = saved[0]!;
    expect(view).toMatchObject({ path: "/products/the-malaki-box", referrer: "l.instagram.com", isMobile: true });
    expect(view.visitorHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(view)).not.toContain(IP);
    expect(JSON.stringify(view)).not.toContain("secret");
  });

  it("gives the same visitor the same hash within a day and a different one the next day", async () => {
    const day1 = setup();
    await handleTrack(req({ path: "/" }), day1.deps);
    await handleTrack(req({ path: "/cart" }), day1.deps);
    const day2 = setup({ now: () => new Date("2026-10-03T15:00:00Z") });
    await handleTrack(req({ path: "/" }), day2.deps);
    expect(day1.saved[0]!.visitorHash).toBe(day1.saved[1]!.visitorHash);
    expect(day2.saved[0]!.visitorHash).not.toBe(day1.saved[0]!.visitorHash);
  });

  it("rejects bad input quietly", async () => {
    const { saved, deps } = setup();
    for (const body of ["not json", { path: "no-slash" }, { path: "" }, { path: "/x".repeat(400) }, { referrer: "https://x.com" }]) {
      expect((await handleTrack(req(body), deps)).status).toBe(204);
    }
    expect(saved).toHaveLength(0);
  });

  it("ignores bots, scripts and requests without a user agent", async () => {
    const { saved, deps } = setup();
    for (const ua of ["Googlebot/2.1 (+http://www.google.com/bot.html)", "Mozilla/5.0 HeadlessChrome/141.0", "curl/8.4.0", "facebookexternalhit/1.1", null]) {
      await handleTrack(req({ path: "/" }, { ua }), deps);
    }
    expect(saved).toHaveLength(0);
    expect(isBot(DESKTOP_UA)).toBe(false);
  });

  it("ignores admin and API paths", async () => {
    const { saved, deps } = setup();
    await handleTrack(req({ path: "/admin" }), deps);
    await handleTrack(req({ path: "/admin/analytics?range=7" }), deps);
    await handleTrack(req({ path: "/api/track" }), deps);
    expect(saved).toHaveLength(0);
    await handleTrack(req({ path: "/administration-of-joy" }), deps);
    expect(saved).toHaveLength(1);
  });

  it("is rate limited, and does nothing without a salt secret", async () => {
    const limited = setup({ allow: () => false });
    await handleTrack(req({ path: "/" }), limited.deps);
    expect(limited.saved).toHaveLength(0);
    const unsalted = setup({ secret: undefined });
    await handleTrack(req({ path: "/" }), unsalted.deps);
    expect(unsalted.saved).toHaveLength(0);
  });

  it("never throws to the client, even if saving fails", async () => {
    const onError = vi.fn();
    const { deps } = setup({ save: () => Promise.reject(new Error("db down")), onError });
    const res = await handleTrack(req({ path: "/" }), deps);
    expect(res.status).toBe(204);
    expect(onError).toHaveBeenCalled();
  });

  it("sets the ad-attribution cookie on the first ad-tagged visit only", async () => {
    const { deps } = setup();
    const first = await handleTrack(req({ path: "/", utmSource: "instagram", utmMedium: "paid", utmCampaign: "eid-boxes" }), deps);
    const cookie = first.headers.get("set-cookie")!;
    expect(cookie).toContain(`${ATTRIBUTION_COOKIE}=`);
    expect(cookie).toMatch(/Max-Age=2592000/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
    const value = cookie.split(";")[0]!.split("=").slice(1).join("=");
    expect(parseAttribution(value)).toEqual({ utmSource: "instagram", utmMedium: "paid", utmCampaign: "eid-boxes", fbclid: null });

    // First touch wins: a later tagged visit keeps the original campaign.
    const later = await handleTrack(req({ path: "/", utmSource: "instagram", utmCampaign: "other" }, { cookie: `${ATTRIBUTION_COOKIE}=${value}` }), deps);
    expect(later.headers.get("set-cookie")).toBeNull();
    // Untagged visits never set it.
    expect((await handleTrack(req({ path: "/" }), deps)).headers.get("set-cookie")).toBeNull();
  });
});

describe("attribution cookie parsing", () => {
  it("round-trips and rejects junk", () => {
    const a = { utmSource: "instagram", utmMedium: null, utmCampaign: "c", fbclid: null };
    expect(parseAttribution(encodeAttribution(a))).toEqual(a);
    expect(parseAttribution("%7Bnot-json")).toBeNull();
    expect(parseAttribution(encodeURIComponent(JSON.stringify({ utmSource: "x".repeat(500) })))).toBeNull();
    expect(parseAttribution(encodeAttribution({ utmSource: null, utmMedium: "paid", utmCampaign: null, fbclid: null }))).toBeNull();
    expect(parseAttribution(undefined)).toBeNull();
  });
});

describe("referrerHost", () => {
  it("keeps only the host and drops same-site referrers", () => {
    expect(referrerHost("https://www.google.com/search?q=gift", "malaki.example")).toBe("www.google.com");
    expect(referrerHost("https://malaki.example/cart", "malaki.example")).toBeNull();
    expect(referrerHost("not a url", "malaki.example")).toBeNull();
    expect(referrerHost(null, "malaki.example")).toBeNull();
  });
});
