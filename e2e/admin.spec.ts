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

  for (const path of ["/admin", "/admin/orders", "/admin/products", "/admin/box-items", "/admin/enquiries", "/admin/shipping"]) {
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

  test("unauthenticated visitors are redirected to the login page", async ({ browser, baseURL }) => {
    const fresh = await browser.newContext();
    const page = await fresh.newPage();
    await page.goto(`${baseURL}/admin/orders`);
    await expect(page).toHaveURL(/\/admin\/login$/);
    await fresh.close();
  });
});
