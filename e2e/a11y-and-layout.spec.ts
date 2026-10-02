import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/collections/gift-boxes",
  "/products/the-malaki-box",
  "/build-your-own-box",
  "/cart",
  "/checkout",
  "/enquiries",
  "/our-story",
  "/legal/privacy",
  "/admin/login",
  "/does-not-exist",
];

/** Interactive elements smaller than 44×44 CSS px (inline links in running text are exempt). */
async function smallTapTargets(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const els = document.querySelectorAll<HTMLElement>("a[href], button, select, textarea, input:not([type=hidden]), summary");
    for (const el of els) {
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none" || el.closest("[aria-hidden=true]")) continue;
      if (el.matches("input[type=checkbox], input[type=radio]") && el.closest("label")) continue; // the label is the target
      if (el.matches(".sr-only, .sr-only *")) continue;
      if (el.matches("a") && el.closest("p, dd, li > span, label")) continue; // inline text link (WCAG 2.5.8 exception)
      // Stretched links make their whole card the hit area (via ::after).
      const target = el.hasAttribute("data-stretched")
        ? (el.closest("article, li") as HTMLElement)
        : el.matches("input") && el.closest("label")
          ? el.closest("label")!
          : el;
      const r = target.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.height < 43.5 || r.width < 43.5) out.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    return out;
  });
}

for (const path of PAGES) {
  test(`${path}: no axe violations, no horizontal scroll, 44px targets`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const violations = axe.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
    expect(violations, violations.join("\n")).toEqual([]);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "page scrolls horizontally").toBeLessThanOrEqual(0);

    const small = await smallTapTargets(page);
    expect(small, small.join("\n")).toEqual([]);
  });
}
