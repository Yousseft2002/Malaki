import { describe, expect, it, vi } from "vitest";
import { campaignStatus, getMetaAds, metaConfig } from "./meta";

const config = { token: "TEST_TOKEN_never_logged", accountId: "act_123", version: "v25.0" };
const range = { since: "2026-09-03", until: "2026-10-02" };
const now = () => new Date("2026-10-02T15:00:00Z");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", date: "Fri, 02 Oct 2026 14:30:00 GMT" } });
}

/** Routes the four Marketing API calls to canned responses. */
function metaFetch() {
  return vi.fn(async (url: string) => {
    if (url.includes("/campaigns?")) {
      return json({
        data: [
          { id: "1", name: "eid-boxes", effective_status: "ACTIVE", daily_budget: "2500", start_time: "2026-09-10T00:00:00-0400" },
          { id: "2", name: "weddings", effective_status: "PAUSED", lifetime_budget: "50000", start_time: "2026-08-01T00:00:00-0400" },
          { id: "3", name: "spring-launch", effective_status: "ACTIVE", lifetime_budget: "10000", stop_time: "2026-09-01T00:00:00-0400" },
          { id: "4", name: "old-idle", effective_status: "PAUSED" },
        ],
        paging: {},
      });
    }
    if (url.includes("level=campaign")) {
      return json({
        data: [
          {
            campaign_id: "1",
            campaign_name: "eid-boxes",
            spend: "120.50",
            impressions: "40000",
            reach: "21000",
            clicks: "800",
            ctr: "2.0",
            cpc: "0.150625",
            cpm: "3.0125",
            actions: [
              { action_type: "link_click", value: "800" },
              { action_type: "omni_purchase", value: "9" },
            ],
            action_values: [{ action_type: "omni_purchase", value: "450.00" }],
          },
          { campaign_id: "2", campaign_name: "weddings", spend: "300", impressions: "50000", reach: "30000", clicks: "500", ctr: "1.0", cpc: "0.6", cpm: "6" },
          { campaign_id: "3", campaign_name: "spring-launch", spend: "10", impressions: "1000", reach: "900", clicks: "10", ctr: "1.0", cpc: "1", cpm: "10" },
        ],
      });
    }
    if (url.includes("level=account") && !url.includes("time_increment")) {
      return json({ data: [{ spend: "300.00", date_start: "2026-08-04" }] });
    }
    if (url.includes("level=account")) {
      return json({ data: [
        { date_start: "2026-10-01", spend: "200.25" },
        { date_start: "2026-10-02", spend: "230.25" },
      ] });
    }
    return json({ currency: "USD", id: "act_123" });
  });
}

describe("Meta ads client", () => {
  it("needs both the token and the ad account", () => {
    expect(metaConfig({ META_ADS_ACCESS_TOKEN: undefined, META_AD_ACCOUNT_ID: "act_1", META_GRAPH_API_VERSION: undefined })).toBeNull();
    expect(metaConfig({ META_ADS_ACCESS_TOKEN: "t", META_AD_ACCOUNT_ID: undefined, META_GRAPH_API_VERSION: undefined })).toBeNull();
    expect(metaConfig({ META_ADS_ACCESS_TOKEN: "t", META_AD_ACCOUNT_ID: "act_1", META_GRAPH_API_VERSION: undefined })?.version).toBe("v25.0");
  });

  it("reports 'not connected' without env vars and never calls Meta", async () => {
    const fetchSpy = vi.fn();
    const result = await getMetaAds(range, { config: null, fetch: fetchSpy });
    expect(result).toEqual({ ok: false, reason: "not_configured", message: "Meta Ads is not connected." });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps campaigns and insights, keeping the token out of URLs", async () => {
    const fetchImpl = metaFetch();
    const result = await getMetaAds({ ...range, previous: { since: "2026-08-04", until: "2026-09-02" } }, { config, fetch: fetchImpl, now });
    if (!result.ok) throw new Error(result.message);

    for (const [url, init] of fetchImpl.mock.calls as unknown as [string, RequestInit & { next?: { revalidate?: number } }][]) {
      expect(url).toMatch(/^https:\/\/graph\.facebook\.com\/v25\.0\/act_123/);
      expect(url).not.toContain("TEST_TOKEN");
      expect((init.headers as Record<string, string>).Authorization).toBe("Bearer TEST_TOKEN_never_logged");
      expect(init.next?.revalidate).toBe(3600);
    }

    // Active first, then by spend; idle old campaign hidden; ended campaign last.
    expect(result.campaigns.map((c) => [c.name, c.status])).toEqual([
      ["eid-boxes", "active"],
      ["weddings", "paused"],
      ["spring-launch", "ended"],
    ]);
    expect(result.campaigns[0]).toMatchObject({
      dailyBudgetCents: 2500,
      lifetimeBudgetCents: null,
      spendCents: 12050,
      impressions: 40000,
      clicks: 800,
      ctr: 2,
      cpcCents: 15,
      purchases: 9,
      purchaseValueCents: 45000,
    });
    expect(result.campaigns[1]).toMatchObject({ purchases: null, purchaseValueCents: null, lifetimeBudgetCents: 50000 });
    expect(result.dailySpend).toEqual([
      { date: "2026-10-01", spendCents: 20025 },
      { date: "2026-10-02", spendCents: 23025 },
    ]);
    expect(result.totalSpendCents).toBe(43050);
    expect(result.previousSpendCents).toBe(30000);
    expect(result.currency).toBe("USD");
    expect(result.fetchedAt).toBe("2026-10-02T14:30:00.000Z");
  });

  it("turns a Meta API error into { ok: false } with Meta's message", async () => {
    const fetchImpl = vi.fn(async () => json({ error: { message: "Invalid OAuth access token.", type: "OAuthException", code: 190 } }, 400));
    const result = await getMetaAds(range, { config, fetch: fetchImpl, now });
    expect(result).toEqual({ ok: false, reason: "error", message: "Meta said: Invalid OAuth access token." });
  });

  it("turns network failures and garbage into { ok: false }", async () => {
    const down = await getMetaAds(range, { config, fetch: vi.fn(async () => Promise.reject(new TypeError("fetch failed"))), now });
    expect(down).toEqual({ ok: false, reason: "error", message: "Could not reach Meta." });
    const garbage = await getMetaAds(range, { config, fetch: vi.fn(async () => new Response("<html>", { status: 502 })), now });
    expect(garbage).toMatchObject({ ok: false, reason: "error", message: "Meta returned HTTP 502" });
  });

  it("gives up after 8 seconds", async () => {
    vi.useFakeTimers();
    try {
      const hang = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason))));
      const pending = getMetaAds(range, { config, fetch: hang, now });
      await vi.advanceTimersByTimeAsync(8_000);
      expect(await pending).toEqual({ ok: false, reason: "error", message: "Meta took longer than 8 seconds to answer." });
    } finally {
      vi.useRealTimers();
    }
  });

  it("classifies campaign status", () => {
    const at = new Date("2026-10-02T00:00:00Z");
    expect(campaignStatus("ACTIVE", null, at)).toBe("active");
    expect(campaignStatus("ACTIVE", "2026-09-01T00:00:00Z", at)).toBe("ended");
    expect(campaignStatus("CAMPAIGN_PAUSED", null, at)).toBe("paused");
    expect(campaignStatus("ARCHIVED", null, at)).toBe("ended");
  });
});
