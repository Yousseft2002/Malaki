import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";
import { canTransition, formatMoneyInput, parseIntInput, parseList, parseMoneyInput, parseWeekdays, slugify } from "./forms";

describe("parseMoneyInput", () => {
  it("parses decimal amounts into minor units", () => {
    expect(parseMoneyInput("12.5")).toBe(1250);
    expect(parseMoneyInput("12.05")).toBe(1205);
    expect(parseMoneyInput("0")).toBe(0);
    expect(parseMoneyInput("7,99")).toBe(799);
    expect(parseMoneyInput(" 30 ")).toBe(3000);
  });
  it("treats blank as 'no price' and rejects garbage", () => {
    expect(parseMoneyInput("")).toBeNull();
    expect(parseMoneyInput(null)).toBeNull();
    expect(parseMoneyInput("-1")).toBeUndefined();
    expect(parseMoneyInput("1.234")).toBeUndefined();
    expect(parseMoneyInput("abc")).toBeUndefined();
  });
  it("round-trips through formatMoneyInput", () => {
    expect(formatMoneyInput(1205)).toBe("12.05");
    expect(formatMoneyInput(null)).toBe("");
    expect(parseMoneyInput(formatMoneyInput(99999))).toBe(99999);
  });
});

describe("other form parsers", () => {
  it("parses integers", () => {
    expect(parseIntInput("12")).toBe(12);
    expect(parseIntInput("", 0)).toBe(0);
    expect(parseIntInput("-3")).toBeUndefined();
    expect(parseIntInput("1.5")).toBeUndefined();
  });
  it("parses weekday checkboxes and country lists", () => {
    expect(parseWeekdays(["3", "1", "1", "9", "x"])).toEqual([1, 3]);
    expect(parseList("gb, fr  ie")).toEqual(["GB", "FR", "IE"]);
  });
  it("slugifies names", () => {
    expect(slugify("Gazelle Horns — Édition Royale!")).toBe("gazelle-horns-edition-royale");
  });
});

describe("canTransition", () => {
  it("allows the fulfilment flow", () => {
    expect(canTransition("PAID", "PACKED")).toBe(true);
    expect(canTransition("PACKED", "SHIPPED")).toBe(true);
    expect(canTransition("PAID", "SHIPPED")).toBe(true);
  });
  it("never lets the admin mark unpaid or cancelled orders as fulfilled", () => {
    expect(canTransition("PENDING_PAYMENT", "PACKED")).toBe(false);
    expect(canTransition("CANCELLED", "SHIPPED")).toBe(false);
    expect(canTransition("PAID", "PENDING_PAYMENT")).toBe(false);
  });
});

describe("toCsv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(toCsv(["a", "b"], [["x,y", 'say "hi"'], ["line\nbreak", null]])).toBe('a,b\r\n"x,y","say ""hi"""\r\n"line\nbreak",\r\n');
  });
  it("neutralises spreadsheet formulas in text cells", () => {
    expect(toCsv(["note"], [["=HYPERLINK(\"x\")"], ["+44 20"], ["@SUM(A1)"]])).toBe('note\r\n"\'=HYPERLINK(""x"")"\r\n\'+44 20\r\n\'@SUM(A1)\r\n');
  });
  it("leaves numbers alone", () => {
    expect(toCsv(["n"], [[-5]])).toBe("n\r\n-5\r\n");
  });
});
