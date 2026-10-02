import { describe, expect, it } from "vitest";
import type { BoxPiece } from "./box";
import { type Catalog, type CatalogVariant, GIFT_NOTE_MAX, priceCart } from "./pricing";

const variant = (over: Partial<CatalogVariant>): CatalogVariant => ({
  id: "v",
  productId: "p",
  productName: "The Malaki Box",
  variantName: "Box of 12",
  kind: "STANDARD",
  priceCents: 3000,
  stock: 10,
  isActive: true,
  isPerishable: true,
  boxCapacity: null,
  allowedItemIds: [],
  ...over,
});

const boxItems: BoxPiece[] = [
  { id: "date", name: "Stuffed date", priceCents: 200, stock: 20, maxPerBox: null, isActive: true },
  { id: "horn", name: "Gazelle horn", priceCents: 100, stock: 20, maxPerBox: null, isActive: true },
];

const catalog: Catalog = {
  variants: new Map(
    [
      variant({ id: "malaki12" }),
      variant({ id: "tin", productName: "Ghriba Selection", variantName: "Tin", priceCents: 1500, isPerishable: false }),
      variant({ id: "unpriced", priceCents: null }),
      variant({ id: "hidden", isActive: false }),
      variant({
        id: "byo6",
        productName: "Build Your Own Box",
        variantName: "Box of 6",
        kind: "CUSTOM_BOX",
        priceCents: 500,
        stock: 5,
        boxCapacity: 6,
      }),
    ].map((v) => [v.id, v]),
  ),
  boxItems,
};

const opts = { giftWrapPriceCents: 250 };
const codes = (r: ReturnType<typeof priceCart>) => r.errors.map((e) => e.code);

describe("priceCart", () => {
  it("prices standard lines from the catalogue, ignoring anything the client claims", () => {
    const r = priceCart(
      [
        { variantId: "malaki12", quantity: 2, giftWrap: true },
        { variantId: "tin", quantity: 1, giftWrap: false },
      ],
      catalog,
      opts,
    );
    expect(r.ok).toBe(true);
    expect(r.subtotalCents).toBe(2 * 3000 + 1500);
    expect(r.giftWrapCents).toBe(2 * 250);
    expect(r.units).toBe(3);
    expect(r.hasPerishables).toBe(true);
  });

  it("flags an empty cart", () => {
    expect(codes(priceCart([], catalog, opts))).toEqual(["EMPTY_CART"]);
  });

  it("refuses lines without a price", () => {
    expect(codes(priceCart([{ variantId: "unpriced", quantity: 1, giftWrap: false }], catalog, opts))).toEqual([
      "PRICE_MISSING",
    ]);
  });

  it("refuses inactive or unknown variants", () => {
    const r = priceCart(
      [
        { variantId: "hidden", quantity: 1, giftWrap: false },
        { variantId: "ghost", quantity: 1, giftWrap: false },
      ],
      catalog,
      opts,
    );
    expect(codes(r)).toEqual(["LINE_UNAVAILABLE", "LINE_UNAVAILABLE"]);
  });

  it("validates quantity bounds", () => {
    expect(codes(priceCart([{ variantId: "tin", quantity: 0, giftWrap: false }], catalog, opts))).toEqual([
      "INVALID_QUANTITY",
    ]);
    expect(codes(priceCart([{ variantId: "tin", quantity: 21, giftWrap: false }], catalog, opts))).toEqual([
      "INVALID_QUANTITY",
    ]);
  });

  it("checks stock across repeated lines of the same variant", () => {
    const r = priceCart(
      [
        { variantId: "malaki12", quantity: 6, giftWrap: false },
        { variantId: "malaki12", quantity: 5, giftWrap: true, giftNote: "For Amina" },
      ],
      catalog,
      opts,
    );
    expect(codes(r)).toEqual(["OUT_OF_STOCK"]);
  });

  it("limits gift notes to 200 characters", () => {
    const r = priceCart(
      [{ variantId: "tin", quantity: 1, giftWrap: false, giftNote: "x".repeat(GIFT_NOTE_MAX + 1) }],
      catalog,
      opts,
    );
    expect(codes(r)).toEqual(["GIFT_NOTE_TOO_LONG"]);
  });

  it("prices a custom box as box price + pieces, per box", () => {
    const r = priceCart([{ variantId: "byo6", quantity: 2, giftWrap: false, box: { date: 3, horn: 3 } }], catalog, opts);
    expect(r.ok).toBe(true);
    expect(r.lines[0].unitPriceCents).toBe(500 + 3 * 200 + 3 * 100);
    expect(r.subtotalCents).toBe(2 * 1400);
    expect(r.lines[0].boxContents).toEqual([
      { boxItemId: "date", name: "Stuffed date", quantity: 3, unitPriceCents: 200 },
      { boxItemId: "horn", name: "Gazelle horn", quantity: 3, unitPriceCents: 100 },
    ]);
  });

  it("rejects incomplete custom boxes and boxes with no contents", () => {
    expect(codes(priceCart([{ variantId: "byo6", quantity: 1, giftWrap: false, box: { date: 2 } }], catalog, opts))).toEqual([
      "INVALID_BOX",
    ]);
    expect(codes(priceCart([{ variantId: "byo6", quantity: 1, giftWrap: false }], catalog, opts))).toEqual(["INVALID_BOX"]);
  });

  it("rejects box contents on a standard product", () => {
    expect(codes(priceCart([{ variantId: "tin", quantity: 1, giftWrap: false, box: { date: 6 } }], catalog, opts))).toEqual([
      "INVALID_BOX",
    ]);
  });

  it("shares piece stock across several custom box lines", () => {
    // 20 dates in stock: 2 boxes × 6 + 2 boxes × 6 = 24 > 20
    const r = priceCart(
      [
        { variantId: "byo6", quantity: 2, giftWrap: false, box: { date: 6 } },
        { variantId: "byo6", quantity: 2, giftWrap: false, box: { date: 6 } },
      ],
      catalog,
      opts,
    );
    expect(codes(r)).toContain("OUT_OF_STOCK");
  });

  it("shares box stock across several custom box lines", () => {
    // 5 boxes in stock: 3 + 3 = 6
    const r = priceCart(
      [
        { variantId: "byo6", quantity: 3, giftWrap: false, box: { horn: 6 } },
        { variantId: "byo6", quantity: 3, giftWrap: false, box: { date: 6 } },
      ],
      catalog,
      opts,
    );
    expect(codes(r)).toContain("OUT_OF_STOCK");
  });
});
