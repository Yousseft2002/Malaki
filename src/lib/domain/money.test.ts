import { describe, expect, it } from "vitest";
import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("formats cents in the store currency", () => {
    expect(formatMoney(123456, "usd")).toBe("$1,234.56");
    expect(formatMoney(null, "USD")).toBe("[PRICE]");
  });

  it("can round to whole units for chart axes", () => {
    expect(formatMoney(125049, "USD", "en-US", { wholeUnits: true })).toBe("$1,250");
    expect(formatMoney(0, "USD", "en-US", { wholeUnits: true })).toBe("$0");
  });
});
