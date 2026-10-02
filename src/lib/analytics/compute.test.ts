import { describe, expect, it } from "vitest";
import {
  bestSellers,
  conversionRate,
  dayList,
  formatChange,
  formatRoas,
  mobileShare,
  parseRange,
  percentChange,
  periods,
  revenueByCampaign,
  roas,
  salesByDay,
  salesSummary,
  shadeIndexes,
  sourceOf,
  storeDay,
  topSources,
  visitorsByDay,
} from "./compute";

const TZ = "America/New_York";

describe("ranges and days", () => {
  it("accepts 7, 30 and 90 and defaults to 30", () => {
    expect(parseRange("7")).toBe(7);
    expect(parseRange("90")).toBe(90);
    expect(parseRange(undefined)).toBe(30);
    expect(parseRange("365")).toBe(30);
    expect(parseRange(["7", "90"])).toBe(7);
  });

  it("lists days oldest first, ending today", () => {
    expect(dayList("2026-03-02", 3)).toEqual(["2026-02-28", "2026-03-01", "2026-03-02"]);
  });

  it("puts the previous period directly before the current one", () => {
    const p = periods("2026-10-02", 7);
    expect(p.current[0]).toBe("2026-09-26");
    expect(p.previous).toHaveLength(7);
    expect(p.previous[6]).toBe("2026-09-25");
    expect(p.earliest).toBe("2026-09-19");
  });
});

describe("store time zone day boundary", () => {
  it("counts an 11:30pm Boston sale on that Boston day, not the next UTC day", () => {
    const late = new Date("2026-03-10T03:30:00Z"); // 23:30 on 9 March in Boston (EDT, UTC−4)
    expect(storeDay(late, TZ)).toBe("2026-03-09");
    const days = salesByDay([{ paidAt: late, totalCents: 4200 }], ["2026-03-09", "2026-03-10"], TZ);
    expect(days).toEqual([
      { date: "2026-03-09", revenueCents: 4200, orders: 1 },
      { date: "2026-03-10", revenueCents: 0, orders: 0 },
    ]);
  });

  it("handles winter time (UTC−5) as well", () => {
    expect(storeDay(new Date("2026-01-15T04:59:00Z"), TZ)).toBe("2026-01-14");
    expect(storeDay(new Date("2026-01-15T05:00:00Z"), TZ)).toBe("2026-01-15");
  });
});

describe("sales", () => {
  it("fills in days with no sales and ignores sales outside the period", () => {
    const days = dayList("2026-10-02", 5);
    const result = salesByDay(
      [
        { paidAt: new Date("2026-09-30T15:00:00Z"), totalCents: 1000 },
        { paidAt: new Date("2026-09-30T18:00:00Z"), totalCents: 500 },
        { paidAt: new Date("2026-08-01T15:00:00Z"), totalCents: 9999 },
      ],
      days,
      TZ,
    );
    expect(result).toHaveLength(5);
    expect(result.map((d) => d.orders)).toEqual([0, 0, 2, 0, 0]);
    expect(result[2]!.revenueCents).toBe(1500);
  });

  it("summarises revenue, orders and average order value with % change", () => {
    const current = [
      { date: "2026-10-01", revenueCents: 3000, orders: 2 },
      { date: "2026-10-02", revenueCents: 3000, orders: 1 },
    ];
    const previous = [
      { date: "2026-09-29", revenueCents: 2000, orders: 1 },
      { date: "2026-09-30", revenueCents: 2000, orders: 1 },
    ];
    const s = salesSummary(current, previous);
    expect(s.revenueCents).toBe(6000);
    expect(s.orders).toBe(3);
    expect(s.averageOrderCents).toBe(2000);
    expect(s.change.revenue).toBe(50);
    expect(s.change.orders).toBe(50);
    expect(s.change.averageOrder).toBe(0);
  });

  it("does not divide by zero when the previous period had no sales", () => {
    expect(percentChange(5000, 0)).toBeNull();
    const s = salesSummary([{ date: "2026-10-02", revenueCents: 5000, orders: 1 }], [{ date: "2026-09-25", revenueCents: 0, orders: 0 }]);
    expect(s.change).toEqual({ revenue: null, orders: null, averageOrder: null });
    expect(formatChange(s.change.revenue)).toBeNull();
  });

  it("has no average order value without orders", () => {
    expect(salesSummary([], []).averageOrderCents).toBeNull();
  });

  it("formats changes with a sign", () => {
    expect(formatChange(12.4)).toBe("+12%");
    expect(formatChange(-8)).toBe("−8%");
    expect(formatChange(0)).toBe("±0%");
  });
});

describe("best sellers", () => {
  const row = (productId: string | null, productName: string, quantity: number, lineTotalCents: number) => ({ productId, productName, quantity, lineTotalCents });

  it("groups by product, sorts by revenue and buckets the rest into Other", () => {
    const rows = [
      row("a", "A", 1, 100),
      row("b", "B", 2, 700),
      row("c", "C", 1, 300),
      row("d", "D", 1, 200),
      row("e", "E", 1, 500),
      row("f", "F", 1, 50),
      row("g", "G", 3, 150),
      row("b", "B", 1, 300),
    ];
    const { slices, totalCents, products } = bestSellers(rows);
    expect(products).toBe(7);
    expect(totalCents).toBe(2300);
    expect(slices.map((s) => s.key)).toEqual(["b", "e", "c", "d", "g", "other"]);
    expect(slices[0]).toMatchObject({ units: 3, revenueCents: 1000 });
    expect(slices[5]).toMatchObject({ name: "Other (2 products)", units: 2, revenueCents: 150, isOther: true });
    expect(slices.reduce((s, x) => s + x.share, 0)).toBeCloseTo(100);
  });

  it("falls back to the product name for deleted products", () => {
    const { slices } = bestSellers([row(null, "Old box", 1, 100), row(null, "Old box", 2, 200)]);
    expect(slices).toEqual([{ key: "name:Old box", name: "Old box", units: 3, revenueCents: 300, share: 100, isOther: false }]);
  });

  it("has no Other slice with five products or fewer", () => {
    expect(bestSellers([row("a", "A", 1, 1)]).slices.some((s) => s.isOther)).toBe(false);
  });

  it("gives each product the same colour regardless of rank or range", () => {
    const wide = shadeIndexes(["a", "b", "c", "d", "e"]);
    const narrow = shadeIndexes(["c", "a"]);
    expect(new Set(wide.values()).size).toBe(5);
    // Without a collision in the smaller set, colours match the bigger set.
    if (wide.get("a") !== wide.get("c")) {
      expect(narrow.get("a")).toBe(shadeIndexes(["a"]).get("a"));
    }
    expect(shadeIndexes(["e", "d", "c", "b", "a"])).toEqual(wide);
  });
});

describe("ads", () => {
  it("groups ad-tagged revenue by campaign and ignores untagged orders", () => {
    const result = revenueByCampaign([
      { utmSource: "instagram", utmCampaign: "eid-boxes", totalCents: 4000 },
      { utmSource: "instagram", utmCampaign: "eid-boxes", totalCents: 1000 },
      { utmSource: "instagram", utmCampaign: "weddings", totalCents: 9000 },
      { utmSource: null, utmCampaign: null, totalCents: 7000 },
    ]);
    expect(result).toEqual([
      { campaign: "weddings", source: "instagram", orders: 1, revenueCents: 9000 },
      { campaign: "eid-boxes", source: "instagram", orders: 2, revenueCents: 5000 },
    ]);
  });

  it("shows ROAS as '-' when nothing was spent", () => {
    expect(roas(5000, 0)).toBeNull();
    expect(formatRoas(roas(5000, 0))).toBe("-");
    expect(formatRoas(roas(5000, 2000))).toBe("2.5×");
  });
});

describe("visitors", () => {
  const view = (iso: string, visitorHash: string, extra: Partial<{ path: string; referrer: string | null; utmSource: string | null; isMobile: boolean }> = {}) => ({
    createdAt: new Date(iso),
    visitorHash,
    path: "/",
    referrer: null,
    utmSource: null,
    isMobile: false,
    ...extra,
  });

  it("counts unique visitors per store day and fills empty days", () => {
    const days = dayList("2026-10-02", 3);
    const result = visitorsByDay(
      [view("2026-10-02T14:00:00Z", "x"), view("2026-10-02T15:00:00Z", "x"), view("2026-10-02T16:00:00Z", "y"), view("2026-10-01T03:00:00Z", "z")],
      days,
      TZ,
    );
    expect(result).toEqual([
      { date: "2026-09-30", visitors: 1, views: 1 }, // 23:00 Boston on the 30th
      { date: "2026-10-01", visitors: 0, views: 0 },
      { date: "2026-10-02", visitors: 2, views: 3 },
    ]);
  });

  it("names traffic sources so Instagram is recognisable", () => {
    expect(sourceOf({ utmSource: "Instagram", referrer: null })).toBe("instagram");
    expect(sourceOf({ utmSource: null, referrer: "l.instagram.com" })).toBe("instagram");
    expect(sourceOf({ utmSource: null, referrer: "m.facebook.com" })).toBe("facebook");
    expect(sourceOf({ utmSource: null, referrer: "www.google.com" })).toBe("google.com");
    expect(sourceOf({ utmSource: null, referrer: null })).toBe("Direct");
  });

  it("counts each visitor once, by the first source they arrived from", () => {
    const ranked = topSources([
      view("2026-10-02T14:00:00Z", "v1", { utmSource: "instagram" }),
      view("2026-10-02T14:01:00Z", "v1"), // same visitor browsing on: still one Instagram visitor
      view("2026-10-02T14:02:00Z", "v1"),
      view("2026-10-02T15:00:00Z", "v2", { referrer: "l.instagram.com" }),
      view("2026-10-02T16:00:00Z", "v3"),
    ]);
    expect(ranked).toEqual([
      { label: "instagram", count: 2, share: (2 / 3) * 100 },
      { label: "Direct", count: 1, share: (1 / 3) * 100 },
    ]);
  });

  it("works out mobile share and conversion without dividing by zero", () => {
    expect(mobileShare([])).toBeNull();
    expect(mobileShare([{ isMobile: true }, { isMobile: false }, { isMobile: true }, { isMobile: true }])).toBe(75);
    expect(conversionRate(3, 0)).toBeNull();
    expect(conversionRate(3, 150)).toBe(2);
  });
});
