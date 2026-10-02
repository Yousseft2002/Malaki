import "dotenv/config";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { SESSION_COOKIE, signSession } from "../src/lib/auth/session";

// Signs a session with the local .env admin secret; skipped when admin isn't configured.
const email = process.env.ADMIN_EMAIL?.toLowerCase();
const secret = process.env.ADMIN_SESSION_SECRET;

test.describe("admin", () => {
  test.skip(!email || !secret, "ADMIN_EMAIL / ADMIN_SESSION_SECRET not set");

  test.beforeEach(async ({ context, baseURL }) => {
    const token = await signSession({ sub: email!, exp: Math.floor(Date.now() / 1000) + 600 }, secret!);
    await context.addCookies([{ name: SESSION_COOKIE, value: token, url: `${baseURL}/admin` }]);
  });

  for (const path of ["/admin", "/admin/analytics", "/admin/analytics?range=7", "/admin/orders", "/admin/products", "/admin/box-items", "/admin/enquiries", "/admin/shipping"]) {
    test(`${path} is accessible and fits the screen`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const violations = axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
      expect(violations, violations.join("\n")).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("analytics: every section renders and the sales chart can be read with the keyboard", async ({ page }) => {
    await page.goto("/admin/analytics");
    for (const name of ["Sales per day", "Best sellers", "Instagram & Facebook ads", "Visitors"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    await expect(page.getByRole("region", { name: /Key numbers/ }).getByText("Revenue", { exact: true })).toBeVisible();
    // Ads: either the "Connect Meta Ads" card or Meta data — never made-up numbers.
    await expect(page.getByRole("heading", { name: "Connect Meta Ads" }).or(page.getByText(/Data from Meta, updated/))).toBeVisible();

    const chart = page.getByRole("slider", { name: /Revenue per day/ });
    if (await chart.count()) {
      await chart.focus();
      const latest = await chart.getAttribute("aria-valuetext");
      await page.keyboard.press("ArrowLeft");
      await expect(chart).not.toHaveAttribute("aria-valuetext", latest!);
      await expect(chart).toHaveAttribute("aria-valuetext", /order/);
    } else {
      await expect(page.getByText("No paid orders in this period yet.")).toBeVisible();
    }

    // The range links switch the period.
    await page.getByRole("link", { name: "7 days" }).click();
    await expect(page).toHaveURL(/range=7/);
    await expect(page.getByRole("link", { name: "7 days" })).toHaveAttribute("aria-current", "page");
  });

  test("unauthenticated visitors are redirected to the login page", async ({ browser, baseURL }) => {
    const fresh = await browser.newContext();
    const page = await fresh.newPage();
    for (const path of ["/admin/orders", "/admin/analytics"]) {
      await page.goto(`${baseURL}${path}`);
      await expect(page).toHaveURL(/\/admin\/login$/);
    }
    await fresh.close();
  });
});
