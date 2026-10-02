import "server-only";
import type { IsoDate } from "@/lib/domain/dates";
import type { Env } from "@/lib/env";
import { logger } from "@/lib/logger";

// Read-only Meta (Instagram/Facebook) ads data for /admin/analytics, via the
// Marketing API. Server-only: the token never leaves the server (it is sent in
// the Authorization header, not the URL). Never throws: any failure becomes
// { ok: false, reason } so the admin page always renders.
//
// Field names checked against Meta's Marketing API reference (v25.0):
//   /act_{id}/campaigns  id, name, effective_status, daily_budget, lifetime_budget
//                        (int64, currency subunits), start_time, stop_time
//   /act_{id}/insights   level=campaign | account, time_range, time_increment;
//                        spend/cpc/cpm (numeric strings, account currency),
//                        impressions, reach, clicks, ctr (%), actions /
//                        action_values ([{ action_type, value }])

export const DEFAULT_GRAPH_VERSION = "v25.0";
const TIMEOUT_MS = 8_000;
const CACHE_SECONDS = 60 * 60;
const MAX_PAGES = 5;
const PURCHASE_ACTIONS = ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"];

export type MetaConfig = { token: string; accountId: string; version: string };

export function metaConfig(config: Pick<Env, "META_ADS_ACCESS_TOKEN" | "META_AD_ACCOUNT_ID" | "META_GRAPH_API_VERSION">): MetaConfig | null {
  if (!config.META_ADS_ACCESS_TOKEN || !config.META_AD_ACCOUNT_ID) return null;
  return { token: config.META_ADS_ACCESS_TOKEN, accountId: config.META_AD_ACCOUNT_ID, version: config.META_GRAPH_API_VERSION ?? DEFAULT_GRAPH_VERSION };
}

export type CampaignStatus = "active" | "paused" | "ended";

export type Campaign = {
  id: string;
  name: string;
  status: CampaignStatus;
  effectiveStatus: string;
  dailyBudgetCents: number | null;
  lifetimeBudgetCents: number | null;
  startTime: string | null;
  stopTime: string | null;
  spendCents: number;
  impressions: number;
  reach: number;
  clicks: number;
  /** Click-through rate in %, null without impressions. */
  ctr: number | null;
  cpcCents: number | null;
  cpmCents: number | null;
  purchases: number | null;
  purchaseValueCents: number | null;
};

export type AdsData = {
  ok: true;
  campaigns: Campaign[];
  dailySpend: { date: IsoDate; spendCents: number }[];
  totalSpendCents: number;
  /** Spend in the comparison period, when one was asked for. */
  previousSpendCents: number | null;
  currency: string | null;
  /** When Meta produced this data (the response Date header), ISO string. */
  fetchedAt: string;
  accountId: string;
};

export type AdsResult = AdsData | { ok: false; reason: "not_configured" | "error"; message: string };

type Fetch = (url: string, init: RequestInit & { next?: { revalidate?: number } }) => Promise<Response>;

type Action = { action_type: string; value: string };
type RawCampaign = {
  id: string;
  name: string;
  effective_status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
};
type RawInsight = {
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: Action[];
  action_values?: Action[];
  date_start?: string;
};

class MetaError extends Error {}

const num = (v: string | undefined) => (v === undefined || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
/** "12.34" (major units) → 1234 cents. */
const cents = (v: string | undefined) => {
  const n = num(v);
  return n === null ? null : Math.round(n * 100);
};
const int = (v: string | undefined) => (v === undefined || !/^\d+$/.test(v) ? null : Number(v));

function purchaseValue(list: Action[] | undefined): string | undefined {
  for (const type of PURCHASE_ACTIONS) {
    const hit = list?.find((a) => a.action_type === type);
    if (hit) return hit.value;
  }
  return undefined;
}

export function campaignStatus(effectiveStatus: string, stopTime: string | null, now: Date): CampaignStatus {
  if (["DELETED", "ARCHIVED"].includes(effectiveStatus) || (stopTime && new Date(stopTime) < now)) return "ended";
  return effectiveStatus === "ACTIVE" ? "active" : "paused";
}

/** Active first, then by spend. */
export function sortCampaigns(list: Campaign[]): Campaign[] {
  const rank: Record<CampaignStatus, number> = { active: 0, paused: 1, ended: 2 };
  return [...list].sort((a, b) => rank[a.status] - rank[b.status] || b.spendCents - a.spendCents || a.name.localeCompare(b.name));
}

async function getJson<T>(fetchImpl: Fetch, url: string, token: string, signal: AbortSignal): Promise<{ body: T; date: string | null }> {
  const res = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
    // Next's data cache (no Cache Components in this app): refresh about hourly.
    next: { revalidate: CACHE_SECONDS },
  });
  const body = (await res.json().catch(() => null)) as (T & { error?: { message?: string; code?: number } }) | null;
  if (!res.ok || !body || body.error) {
    throw new MetaError(body?.error?.message ? `Meta said: ${body.error.message}` : `Meta returned HTTP ${res.status}`);
  }
  return { body, date: res.headers.get("date") };
}

/** Follows paging.next (bounded). */
async function getAll<T>(fetchImpl: Fetch, firstUrl: string, token: string, signal: AbortSignal) {
  const rows: T[] = [];
  let url: string | undefined = firstUrl;
  let date: string | null = null;
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const r: { body: { data?: T[]; paging?: { next?: string } }; date: string | null } = await getJson(fetchImpl, url, token, signal);
    rows.push(...(r.body.data ?? []));
    date ??= r.date;
    url = r.body.paging?.next;
  }
  return { rows, date };
}

export async function getMetaAds(
  range: { since: IsoDate; until: IsoDate; previous?: { since: IsoDate; until: IsoDate } },
  deps: { config: MetaConfig | null; fetch?: Fetch; now?: () => Date },
): Promise<AdsResult> {
  const config = deps.config;
  if (!config) return { ok: false, reason: "not_configured", message: "Meta Ads is not connected." };
  const fetchImpl = deps.fetch ?? (fetch as Fetch);
  const now = deps.now?.() ?? new Date();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new MetaError("Meta took longer than 8 seconds to answer.")), TIMEOUT_MS);

  try {
    const base = `https://graph.facebook.com/${config.version}/${config.accountId}`;
    const timeRange = encodeURIComponent(JSON.stringify({ since: range.since, until: range.until }));
    const [account, campaigns, insights, daily, previous] = await Promise.all([
      getJson<{ currency?: string }>(fetchImpl, `${base}?fields=currency`, config.token, controller.signal),
      getAll<RawCampaign>(fetchImpl, `${base}/campaigns?fields=id,name,effective_status,daily_budget,lifetime_budget,start_time,stop_time&limit=200`, config.token, controller.signal),
      getAll<RawInsight>(
        fetchImpl,
        `${base}/insights?level=campaign&time_range=${timeRange}&fields=campaign_id,campaign_name,spend,impressions,reach,clicks,ctr,cpc,cpm,actions,action_values&limit=500`,
        config.token,
        controller.signal,
      ),
      getAll<RawInsight>(fetchImpl, `${base}/insights?level=account&time_range=${timeRange}&time_increment=1&fields=spend&limit=500`, config.token, controller.signal),
      range.previous
        ? getAll<RawInsight>(fetchImpl, `${base}/insights?level=account&time_range=${encodeURIComponent(JSON.stringify(range.previous))}&fields=spend`, config.token, controller.signal)
        : null,
    ]);

    const byId = new Map(insights.rows.map((i) => [i.campaign_id, i]));
    const list: Campaign[] = campaigns.rows.map((c) => {
      const i = byId.get(c.id) ?? {};
      const impressions = int(i.impressions) ?? 0;
      const stopTime = c.stop_time ?? null;
      return {
        id: c.id,
        name: c.name,
        status: campaignStatus(c.effective_status, stopTime, now),
        effectiveStatus: c.effective_status,
        dailyBudgetCents: int(c.daily_budget),
        lifetimeBudgetCents: int(c.lifetime_budget),
        startTime: c.start_time ?? null,
        stopTime,
        spendCents: cents(i.spend) ?? 0,
        impressions,
        reach: int(i.reach) ?? 0,
        clicks: int(i.clicks) ?? 0,
        ctr: impressions ? num(i.ctr) : null,
        cpcCents: cents(i.cpc),
        cpmCents: cents(i.cpm),
        purchases: num(purchaseValue(i.actions)),
        purchaseValueCents: cents(purchaseValue(i.action_values)),
      };
    });
    // Show what is running or spent money in the period; hide old, idle campaigns.
    const shown = list.filter((c) => c.status === "active" || c.spendCents > 0);
    const dailySpend = daily.rows.filter((d) => d.date_start).map((d) => ({ date: d.date_start!, spendCents: cents(d.spend) ?? 0 }));

    return {
      ok: true,
      campaigns: sortCampaigns(shown),
      dailySpend,
      totalSpendCents: dailySpend.reduce((s, d) => s + d.spendCents, 0) || shown.reduce((s, c) => s + c.spendCents, 0),
      previousSpendCents: previous ? previous.rows.reduce((s, r) => s + (cents(r.spend) ?? 0), 0) : null,
      currency: account.body.currency ?? null,
      fetchedAt: new Date(campaigns.date ?? insights.date ?? now.toISOString()).toISOString(),
      accountId: config.accountId,
    };
  } catch (err) {
    const message = err instanceof MetaError ? err.message : controller.signal.aborted ? "Meta took longer than 8 seconds to answer." : "Could not reach Meta.";
    logger.warn("meta_ads.failed", { err, message });
    return { ok: false, reason: "error", message };
  } finally {
    clearTimeout(timer);
  }
}
