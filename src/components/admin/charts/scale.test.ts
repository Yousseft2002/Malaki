import { describe, expect, it } from "vitest";
import { labelIndexes, longDate, niceMax, shortDate } from "./scale";

describe("chart scale helpers", () => {
  it("rounds axis maxima up to a nice number", () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(7)).toBe(10);
    expect(niceMax(180)).toBe(200);
    expect(niceMax(2100)).toBe(2500);
    expect(niceMax(42000)).toBe(50000);
  });

  it("picks a few evenly spaced labels including both ends", () => {
    expect(labelIndexes(30)).toEqual([0, 7, 15, 22, 29]);
    expect(labelIndexes(3)).toEqual([0, 1, 2]);
  });

  it("formats calendar dates without shifting the day", () => {
    expect(shortDate("2026-10-02")).toBe("Oct 2");
    expect(longDate("2026-10-02")).toBe("Friday, October 2");
  });
});
