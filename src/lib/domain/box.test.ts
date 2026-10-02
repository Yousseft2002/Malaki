import { describe, expect, it } from "vitest";
import {
  type BoxPiece,
  type BoxSize,
  addPieceBlocker,
  eligiblePieces,
  normalizeSelection,
  priceBox,
  validateBox,
} from "./box";

const size = (over: Partial<BoxSize> = {}): BoxSize => ({
  id: "box6",
  name: "Box of 6",
  capacity: 6,
  priceCents: 1000,
  stock: 10,
  isActive: true,
  allowedItemIds: [],
  ...over,
});

const pieces: BoxPiece[] = [
  { id: "date", name: "Stuffed date", priceCents: 200, stock: 50, maxPerBox: null, isActive: true },
  { id: "horn", name: "Gazelle horn", priceCents: 150, stock: 5, maxPerBox: 4, isActive: true },
  { id: "ghriba", name: "Ghriba", priceCents: null, stock: 50, maxPerBox: null, isActive: true },
  { id: "old", name: "Retired", priceCents: 100, stock: 50, maxPerBox: null, isActive: false },
];

const codes = (r: ReturnType<typeof validateBox>) => r.errors.map((e) => e.code);

describe("validateBox", () => {
  it("accepts a box filled exactly to capacity", () => {
    const r = validateBox(size(), pieces, { date: 4, horn: 2 });
    expect(r).toMatchObject({ ok: true, filled: 6, remaining: 0, errors: [] });
  });

  it("rejects a partially filled box unless allowPartial is set", () => {
    expect(codes(validateBox(size(), pieces, { date: 2 }))).toEqual(["BOX_NOT_FULL"]);
    const partial = validateBox(size(), pieces, { date: 2 }, { allowPartial: true });
    expect(partial).toMatchObject({ ok: true, remaining: 4 });
  });

  it("rejects overfilling", () => {
    expect(codes(validateBox(size(), pieces, { date: 7 }))).toContain("OVER_CAPACITY");
  });

  it("enforces per-item maximums", () => {
    expect(codes(validateBox(size(), pieces, { horn: 5, date: 1 }))).toContain("ITEM_LIMIT_EXCEEDED");
  });

  it("enforces eligibility for the chosen box size", () => {
    const small = size({ allowedItemIds: ["date"] });
    expect(codes(validateBox(small, pieces, { date: 4, horn: 2 }))).toContain("ITEM_NOT_ELIGIBLE");
    expect(eligiblePieces(small, pieces).map((p) => p.id)).toEqual(["date"]);
  });

  it("rejects inactive and unknown items", () => {
    expect(codes(validateBox(size(), pieces, { old: 6 }))).toContain("ITEM_UNAVAILABLE");
    expect(codes(validateBox(size(), pieces, { nope: 6 }))).toContain("ITEM_NOT_FOUND");
  });

  it("rejects negative or fractional quantities", () => {
    expect(codes(validateBox(size(), pieces, { date: -1 }, { allowPartial: true }))).toContain("INVALID_QUANTITY");
    expect(codes(validateBox(size(), pieces, { date: 1.5 }, { allowPartial: true }))).toContain("INVALID_QUANTITY");
  });

  it("checks item stock across multiple identical boxes and reserved units", () => {
    // 2 horns × 3 boxes = 6 > stock 5
    expect(codes(validateBox(size(), pieces, { date: 4, horn: 2 }, { boxQuantity: 3 }))).toContain("ITEM_OUT_OF_STOCK");
    // 2 horns + 4 reserved elsewhere = 6 > 5
    expect(
      codes(validateBox(size(), pieces, { date: 4, horn: 2 }, { reservedItemUnits: { horn: 4 } })),
    ).toContain("ITEM_OUT_OF_STOCK");
  });

  it("checks box stock and availability", () => {
    expect(codes(validateBox(size({ stock: 1 }), pieces, { date: 6 }, { boxQuantity: 2 }))).toContain("BOX_OUT_OF_STOCK");
    expect(codes(validateBox(size({ isActive: false }), pieces, { date: 6 }))).toContain("BOX_UNAVAILABLE");
    expect(codes(validateBox(size({ capacity: 0 }), pieces, {}))).toContain("BOX_UNAVAILABLE");
  });
});

describe("addPieceBlocker", () => {
  it("allows adding while there is room", () => {
    expect(addPieceBlocker(size(), pieces, { date: 2 }, "date")).toBeNull();
  });
  it("blocks when the box is full", () => {
    expect(addPieceBlocker(size(), pieces, { date: 6 }, "date")?.code).toBe("OVER_CAPACITY");
  });
  it("blocks when the item limit is reached", () => {
    expect(addPieceBlocker(size(), pieces, { horn: 4 }, "horn")?.code).toBe("ITEM_LIMIT_EXCEEDED");
  });
});

describe("priceBox", () => {
  it("adds box price and piece prices", () => {
    expect(priceBox(size(), pieces, { date: 4, horn: 2 })).toEqual({
      totalCents: 1000 + 4 * 200 + 2 * 150,
      boxCents: 1000,
      piecesCents: 1100,
    });
  });
  it("returns null total when any price is missing", () => {
    expect(priceBox(size(), pieces, { ghriba: 6 }).totalCents).toBeNull();
    expect(priceBox(size({ priceCents: null }), pieces, { date: 6 }).totalCents).toBeNull();
  });
});

describe("normalizeSelection", () => {
  it("drops zeros and sorts keys", () => {
    expect(Object.keys(normalizeSelection({ horn: 1, date: 2, ghriba: 0 }))).toEqual(["date", "horn"]);
  });
});
