import Link from "next/link";
import { Suspense, cache } from "react";
import { BarList } from "@/components/admin/charts/bar-list";
import { Donut } from "@/components/admin/charts/donut";
import { DataTable, ProgressBar, SectionSkeleton, StatusPill } from "@/components/admin/charts/misc";
import { OTHER_SHADE, PRODUCT_SHADES } from "@/components/admin/charts/palette";
import { shortDate } from "@/components/admin/charts/scale";
import { StatTile } from "@/components/admin/charts/stat-tile";
import { TimeChart } from "@/components/admin/charts/time-chart";
import { type AdsData, type Campaign, getMetaAds, metaConfig } from "@/lib/ads/meta";
import {
  type CampaignRevenue,
  RANGES,
  type Range,
  conversionRate,
  formatChange,
  formatRoas,
  parseRange,
  percentChange,
  periods,
  roas,
  shadeIndexes,
} from "@/lib/analytics/compute";
import { requireAdmin } from "@/lib/auth/admin";
import { type IsoDate, diffDays, todayIn } from "@/lib/domain/dates";
import { formatMoney } from "@/lib/domain/money";
import { env } from "@/lib/env";
import { getSalesAnalytics, getVisitorAnalytics } from "@/lib/queries/analytics";
import { STORE_CURRENCY } from "@/lib/store-config";

export const metadata = { title: "Analytics" };

const money = (cents: number) => formatMoney(cents, STORE_CURRENCY);
const axisMoney = (cents: number) => formatMoney(cents, STORE_CURRENCY, "en-US", { wholeUnits: true });
const count = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));
const pct = (n: number | null, digits = 1) => (n === null ? null : `${n.toFixed(digits)}%`);

/** Meta is called once per request even though two sections use it. */
const loadAds = cache(async (range: Range) => {
  const config = env();
  const p = periods(todayIn(config.STORE_TIMEZONE), range);
  return getMetaAds(
    { since: p.current[0]!, until: p.current.at(-1)!, previous: { since: p.previous[0]!, until: p.previous.at(-1)! } },
    { config: metaConfig(config) },
  );
});

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const range = parseRange((await searchParams).range);
  const periodLabel = `${range} days`;
  const [sales, visitors] = await Promise.all([getSalesAnalytics(range), getVisitorAnalytics(range)]);
  // Start Meta now, in parallel; its sections stream in when ready.
  void loadAds(range);

  const conversion = conversionRate(sales.summary.orders, visitors.totals.visitors);
  const previousConversion = conversionRate(sales.previousOrders, visitors.previousTotals.visitors);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl text-emerald">Analytics</h1>
          <p className="mt-1 text-sm text-muted">Paid orders, best sellers, Instagram ads and visitors. Days are in store time ({env().STORE_TIMEZONE}).</p>
        </div>
        {/* A) Date range */}
        <nav aria-label="Date range">
          <ul className="flex border border-emerald">
            {RANGES.map((r) => (
              <li key={r}>
                <Link
                  href={`/admin/analytics?range=${r}`}
                  aria-current={r === range ? "page" : undefined}
                  className={`inline-flex min-h-11 min-w-16 items-center justify-center px-3 text-sm ${r === range ? "bg-emerald text-ivory" : "text-emerald hover:bg-sand"}`}
                >
                  {r} days
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* B) KPIs */}
      <section aria-labelledby="kpi-title">
        <h2 id="kpi-title" className="sr-only">
          Key numbers for the last {periodLabel}
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 xl:grid-cols-7">
          <li>
            <StatTile label="Revenue" value={money(sales.summary.revenueCents)} change={formatChange(sales.summary.change.revenue)} periodLabel={periodLabel} />
          </li>
          <li>
            <StatTile label="Orders" value={count(sales.summary.orders)} change={formatChange(sales.summary.change.orders)} periodLabel={periodLabel} />
          </li>
          <li>
            <StatTile
              label="Average order"
              value={sales.summary.averageOrderCents === null ? null : money(sales.summary.averageOrderCents)}
              change={formatChange(sales.summary.change.averageOrder)}
              periodLabel={periodLabel}
            />
          </li>
          <li>
            <StatTile
              label="Unique visitors"
              value={visitors.totals.visitors ? count(visitors.totals.visitors) : null}
              change={formatChange(percentChange(visitors.totals.visitors, visitors.previousTotals.visitors))}
              periodLabel={periodLabel}
            />
          </li>
          <li>
            <StatTile
              label="Conversion rate"
              value={pct(conversion, 2)}
              change={conversion === null || previousConversion === null ? null : formatChange(percentChange(conversion, previousConversion))}
              periodLabel={periodLabel}
              note="Orders ÷ unique visitors"
            />
          </li>
          <Suspense fallback={<AdTilesFallback />}>
            <AdTiles range={range} adRevenueCents={sales.adRevenueCents} previousAdRevenueCents={sales.previousAdRevenueCents} periodLabel={periodLabel} />
          </Suspense>
        </ul>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* C) Sales over time */}
        <Card id="sales-title" title="Sales per day" subtitle={`Revenue from paid orders, last ${periodLabel}`}>
          <TimeChart
            label="Revenue per day"
            format={axisMoney}
            emptyText="No paid orders in this period yet."
            points={sales.days.map((d) => ({
              date: d.date,
              value: d.revenueCents,
              lines: [money(d.revenueCents), `${d.orders} order${d.orders === 1 ? "" : "s"}`],
            }))}
          />
          <DataTable
            caption={`Revenue and orders per day, last ${periodLabel}`}
            columns={["Date", "Revenue", "Orders"]}
            rows={sales.days.map((d) => [shortDate(d.date), money(d.revenueCents), d.orders])}
          />
        </Card>

        {/* D) Best sellers */}
        <BestSellers data={sales.bestSellers} periodLabel={periodLabel} />
      </div>

      {/* E) Ads */}
      <Card id="ads-title" title="Instagram & Facebook ads" subtitle={`Campaigns from Meta, last ${periodLabel}`} className="mt-6">
        <Suspense fallback={<SectionSkeleton label="Loading Meta ads" />}>
          <AdsTracker range={range} campaignsRevenue={sales.campaigns} />
        </Suspense>
        <AttributedOrders campaigns={sales.campaigns} periodLabel={periodLabel} />
      </Card>

      {/* F) Visitors */}
      <Card id="visitors-title" title="Visitors" subtitle={`First-party counts (no cookies), last ${periodLabel}`} className="mt-6">
        <p className="mt-2 text-sm text-ink">
          <strong className="font-medium">{count(visitors.today)}</strong> unique visitor{visitors.today === 1 ? "" : "s"} today ·{" "}
          {count(visitors.totals.views)} page views in the period ·{" "}
          {visitors.mobileShare === null ? "no device data yet" : `${Math.round(visitors.mobileShare)}% mobile, ${100 - Math.round(visitors.mobileShare)}% desktop`}
        </p>
        <h3 className="mt-6 text-sm font-medium text-emerald">Unique visitors per day</h3>
        <TimeChart
          kind="area"
          size="sm"
          label="Unique visitors per day"
          format={count}
          emptyText="No visits recorded in this period yet."
          points={visitors.days.map((d) => ({ date: d.date, value: d.visitors, lines: [`${count(d.visitors)} visitors`, `${count(d.views)} page views`] }))}
        />
        <DataTable
          caption={`Unique visitors and page views per day, last ${periodLabel}`}
          columns={["Date", "Visitors", "Page views"]}
          rows={visitors.days.map((d) => [shortDate(d.date), d.visitors, d.views])}
        />
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-emerald">Top traffic sources</h3>
            <BarList
              label="Top traffic sources by visitors"
              emptyText="No visits yet."
              items={visitors.topSources.map((s) => ({ label: s.label, value: `${count(s.count)} visitors · ${Math.round(s.share)}%`, share: s.share }))}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-emerald">Top pages</h3>
            <BarList
              label="Top pages by page views"
              emptyText="No page views yet."
              items={visitors.topPages.map((p) => ({ label: p.label, value: `${count(p.count)} views`, share: p.share }))}
            />
          </div>
        </div>
      </Card>
    </>
  );
}

function Card({ id, title, subtitle, className = "", children }: { id: string; title: string; subtitle: string; className?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className={`min-w-0 border border-sand bg-ivory p-4 sm:p-6 ${className}`}>
      <h2 id={id} className="font-display text-2xl text-emerald">
        {title}
      </h2>
      <p className="text-sm text-muted">{subtitle}</p>
      {children}
    </section>
  );
}

// ─── D) Best sellers ─────────────────────────────────────────────────────────

function BestSellers({ data, periodLabel }: { data: Awaited<ReturnType<typeof getSalesAnalytics>>["bestSellers"]; periodLabel: string }) {
  const title = "Best sellers";
  const subtitle = `Share of product revenue, last ${periodLabel}`;
  if (data.products === 0) {
    return (
      <Card id="best-title" title={title} subtitle={subtitle}>
        <p className="mt-4 border border-dashed border-muted/40 p-6 text-center text-sm text-muted">No products sold in this period yet.</p>
      </Card>
    );
  }
  if (data.products === 1) {
    const only = data.slices[0]!;
    return (
      <Card id="best-title" title={title} subtitle={subtitle}>
        <div className="mt-4">
          <StatTile label="Only product sold" value={only.name} periodLabel={periodLabel} note={`${count(only.units)} sold · ${money(only.revenueCents)}`} />
        </div>
      </Card>
    );
  }
  const shades = shadeIndexes(data.slices.filter((s) => !s.isOther).map((s) => s.key));
  const slices = data.slices.map((s) => ({
    key: s.key,
    name: s.name,
    value: s.revenueCents,
    share: s.share,
    color: s.isOther ? OTHER_SHADE : PRODUCT_SHADES[shades.get(s.key)!]!,
    detail: `${count(s.units)} sold · ${money(s.revenueCents)}`,
  }));
  return (
    <Card id="best-title" title={title} subtitle={subtitle}>
      <Donut slices={slices} centerLabel="Products" centerValue={money(data.totalCents)} />
      <DataTable
        caption={`Best sellers by revenue, last ${periodLabel}`}
        columns={["Product", "Units", "Revenue", "Share"]}
        rows={data.slices.map((s) => [s.name, s.units, money(s.revenueCents), `${Math.round(s.share)}%`])}
      />
    </Card>
  );
}

// ─── B) Ad tiles + E) Ads tracker ────────────────────────────────────────────

function AdTilesFallback() {
  return (
    <>
      {["Ad spend", "ROAS"].map((l) => (
        <li key={l}>
          <div className="h-full border border-sand bg-ivory p-4">
            <p className="text-xs tracking-wide text-muted uppercase">{l}</p>
            <span className="mt-2 block h-7 w-20 animate-pulse bg-sand" />
          </div>
        </li>
      ))}
    </>
  );
}

async function AdTiles({ range, adRevenueCents, previousAdRevenueCents, periodLabel }: { range: Range; adRevenueCents: number; previousAdRevenueCents: number; periodLabel: string }) {
  const ads = await loadAds(range);
  const missing = ads.ok ? "-" : ads.reason === "not_configured" ? "Not connected" : "Unavailable";
  const spend = ads.ok ? ads.totalSpendCents : null;
  const value = spend === null ? null : roas(adRevenueCents, spend);
  const previous = ads.ok && ads.previousSpendCents !== null ? roas(previousAdRevenueCents, ads.previousSpendCents) : null;
  return (
    <>
      <li>
        <StatTile
          label="Ad spend"
          value={spend === null ? null : money(spend)}
          missing={missing}
          change={ads.ok ? formatChange(ads.previousSpendCents === null ? null : percentChange(ads.totalSpendCents, ads.previousSpendCents)) : undefined}
          periodLabel={periodLabel}
        />
      </li>
      <li>
        <StatTile
          label="ROAS"
          value={spend === null ? null : formatRoas(value)}
          missing={missing}
          change={value === null || previous === null ? (spend === null ? undefined : null) : formatChange(percentChange(value, previous))}
          periodLabel={periodLabel}
          note="Revenue from ad-tagged orders ÷ ad spend"
        />
      </li>
    </>
  );
}

/** Sum our own attributed orders for a Meta campaign (matched on utm_campaign = campaign name). */
function attributed(campaign: Campaign, rows: CampaignRevenue[]) {
  const name = campaign.name.trim().toLowerCase();
  const hits = rows.filter((r) => r.campaign.trim().toLowerCase() === name);
  return { orders: hits.reduce((s, r) => s + r.orders, 0), revenueCents: hits.reduce((s, r) => s + r.revenueCents, 0) };
}

function budgetText(c: Campaign, range: { since: IsoDate; until: IsoDate }, periodLabel: string): { text: string; max: number | null } {
  const spent = `${money(c.spendCents)} spent in the last ${periodLabel}`;
  if (c.lifetimeBudgetCents) return { text: `${spent} · lifetime budget ${money(c.lifetimeBudgetCents)}`, max: c.lifetimeBudgetCents };
  if (c.dailyBudgetCents) {
    const start = c.startTime && c.startTime.slice(0, 10) > range.since ? c.startTime.slice(0, 10) : range.since;
    const stop = c.stopTime && c.stopTime.slice(0, 10) < range.until ? c.stopTime.slice(0, 10) : range.until;
    const days = Math.max(1, diffDays(start, stop) + 1);
    const budget = c.dailyBudgetCents * days;
    return { text: `${money(c.spendCents)} of ${money(budget)} budget (${money(c.dailyBudgetCents)}/day × ${days} days)`, max: budget };
  }
  return { text: `${spent} · budget set on ad sets`, max: null };
}

function runDates(c: Campaign) {
  const start = c.startTime ? shortDate(c.startTime.slice(0, 10)) : "—";
  const stop = c.stopTime ? shortDate(c.stopTime.slice(0, 10)) : "ongoing";
  return `${start} – ${stop}`;
}

async function AdsTracker({ range, campaignsRevenue }: { range: Range; campaignsRevenue: CampaignRevenue[] }) {
  const ads = await loadAds(range);
  if (!ads.ok && ads.reason === "not_configured") return <ConnectMeta />;
  if (!ads.ok) {
    return (
      <p role="alert" className="mt-4 border border-muted/40 p-4 text-sm text-ink">
        Couldn&apos;t load Meta ads right now: {ads.message} Sales and visitor numbers are unaffected.
      </p>
    );
  }
  return <AdsList ads={ads} range={range} campaignsRevenue={campaignsRevenue} />;
}

function AdsList({ ads, range, campaignsRevenue }: { ads: AdsData; range: Range; campaignsRevenue: CampaignRevenue[] }) {
  const tz = env().STORE_TIMEZONE;
  const p = periods(todayIn(tz), range);
  const periodLabel = `${range} days`;
  const spendByDay = new Map(ads.dailySpend.map((d) => [d.date, d.spendCents]));
  const points = p.current.map((date) => {
    const v = spendByDay.get(date) ?? 0;
    return { date, value: v, lines: [`${money(v)} spent`] };
  });
  const span = { since: p.current[0]!, until: p.current.at(-1)! };
  const updated = new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(ads.fetchedAt));

  return (
    <div className="mt-4">
      {ads.currency && ads.currency !== STORE_CURRENCY && (
        <p className="mb-3 text-sm text-ink">
          Note: the ad account reports in {ads.currency}, the store sells in {STORE_CURRENCY}. Spend and ROAS mix currencies until these match.
        </p>
      )}
      <p className="text-sm text-ink">
        Total spend: <strong className="font-display text-xl text-emerald">{money(ads.totalSpendCents)}</strong>
      </p>
      <h3 className="mt-4 text-sm font-medium text-emerald">Spend per day</h3>
      <TimeChart size="sm" label="Ad spend per day" format={axisMoney} emptyText="No ad spend in this period." points={points} />

      {ads.campaigns.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No campaigns ran in this period.</p>
      ) : (
        <ul className="mt-6 grid gap-4 lg:grid-cols-2">
          {ads.campaigns.map((c) => {
            const own = attributed(c, campaignsRevenue);
            const budget = budgetText(c, span, periodLabel);
            return (
              <li key={c.id} className="flex flex-col gap-4 border border-sand p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium break-words text-ink">{c.name}</h3>
                    <p className="text-xs text-muted">{runDates(c)}</p>
                  </div>
                  <StatusPill status={c.status} />
                </div>
                <ProgressBar value={c.spendCents} max={budget.max} text={budget.text} />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                  <Metric label="Impressions" value={count(c.impressions)} />
                  <Metric label="Clicks" value={count(c.clicks)} />
                  <Metric label="CTR" value={c.ctr === null ? "-" : `${c.ctr.toFixed(2)}%`} />
                  <Metric label="Cost per click" value={c.cpcCents === null ? "-" : money(c.cpcCents)} />
                </dl>
                <dl className="grid grid-cols-3 gap-x-4 border-t border-sand pt-3 text-sm">
                  <Metric label="Our orders" value={count(own.orders)} />
                  <Metric label="Our revenue" value={money(own.revenueCents)} />
                  <Metric label="ROAS" value={formatRoas(roas(own.revenueCents, c.spendCents))} />
                </dl>
                {c.purchases !== null && (
                  <p className="text-xs text-muted">
                    Meta reports {count(c.purchases)} purchase{c.purchases === 1 ? "" : "s"}
                    {c.purchaseValueCents !== null ? ` worth ${money(c.purchaseValueCents)}` : ""} (its own tracking; ours above is from our orders).
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">
        Data from Meta, updated {updated}.{" "}
        <a
          href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${ads.accountId.replace(/^act_/, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-emerald underline underline-offset-4"
        >
          Open Ads Manager ↗
        </a>
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium text-ink tabular-nums">{value}</dd>
    </div>
  );
}

function ConnectMeta() {
  return (
    <div className="mt-4 border border-dashed border-gold-ink/50 bg-sand/40 p-5">
      <h3 className="font-display text-xl text-emerald">Connect Meta Ads</h3>
      <p className="mt-1 text-sm text-ink">See what your Instagram and Facebook campaigns cost and earn, next to your sales. No numbers are shown until it&apos;s connected.</p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink">
        <li>In Meta Business settings, create a System User and give it your ad account with “View performance”.</li>
        <li>Generate a token for it with the <code>ads_read</code> permission (no expiry).</li>
        <li>
          Set <code>META_ADS_ACCESS_TOKEN</code> and <code>META_AD_ACCOUNT_ID</code> (like <code>act_1234567890</code>) in the hosting environment, then redeploy.
        </li>
        <li>
          Tag every ad link: <code className="break-all">?utm_source=instagram&amp;utm_medium=paid&amp;utm_campaign=&lt;campaign name&gt;</code>
        </li>
      </ol>
      <p className="mt-3 text-xs text-muted">Full step-by-step guide: docs/META_ADS_SETUP.md in the code repository.</p>
    </div>
  );
}

function AttributedOrders({ campaigns, periodLabel }: { campaigns: CampaignRevenue[]; periodLabel: string }) {
  const total = campaigns.reduce((s, c) => s + c.revenueCents, 0);
  return (
    <div className="mt-8 border-t border-sand pt-6">
      <h3 className="text-sm font-medium text-emerald">Orders from tagged ad links (our records)</h3>
      <BarList
        label={`Revenue by ad campaign, last ${periodLabel}`}
        emptyText="No orders from tagged ad links in this period. Links need utm_source and utm_campaign."
        items={campaigns.map((c) => ({
          label: `${c.campaign}${c.source ? ` · ${c.source}` : ""}`,
          value: `${c.orders} order${c.orders === 1 ? "" : "s"} · ${money(c.revenueCents)}`,
          share: total ? (c.revenueCents / total) * 100 : 0,
        }))}
      />
    </div>
  );
}

