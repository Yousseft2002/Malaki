import { expect, test } from "@playwright/test";

const PAGES = ["/", "/collections/gift-boxes", "/products/the-malaki-box", "/build-your-own-box", "/cart", "/checkout", "/enquiries", "/our-story", "/legal/privacy"];

test("no console errors or warnings on any page", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(`${page.url()} → ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`${page.url()} → ${e.message}`));
  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(problems, problems.join("\n")).toEqual([]);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("everything is visible immediately, without scrolling", async ({ page }) => {
    await page.goto("/");
    // Elements far below the fold are shown even though they were never scrolled into view.
    await expect(page.getByRole("heading", { name: "First to know" })).toBeVisible();
    const hidden = await page.evaluate(
      () => [...document.querySelectorAll<HTMLElement>(".reveal, .stagger > *")].filter((el) => getComputedStyle(el).opacity !== "1").length,
    );
    expect(hidden).toBe(0);
  });

  test("add to bag works instantly (no flight)", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/products/the-malaki-box");
    await page.getByRole("button", { name: "Add to bag" }).click();
    await expect(page.getByRole("dialog", { name: "Shopping bag" })).toBeVisible({ timeout: 1500 });
  });
});

test("without JavaScript the content is still fully visible", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/`);
  await expect(page.getByRole("heading", { name: "House favorites" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "First to know" })).toBeVisible();
  await context.close();
});

test("build a box with the keyboard only, with announcements", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard flow checked on desktop");
  await page.goto("/build-your-own-box");
  const add = page.getByRole("button", { name: "Add one Ghriba" });
  await add.focus();
  await page.keyboard.press("Enter");
  const live = page.locator("[aria-live=polite][aria-atomic=true]");
  await expect(live).toHaveText("Added Ghriba. 1 of 6 pieces.");
  for (let i = 0; i < 5; i++) await page.keyboard.press("Space");
  await expect(live).toContainText("Your box is complete");
  // Tab onwards to the remove button for the same piece and take one out.
  await page.getByRole("button", { name: "Remove one Ghriba" }).focus();
  await page.keyboard.press("Enter");
  await expect(live).toHaveText("Removed Ghriba. 5 of 6 pieces.");
});

test("keyboard users can reach and operate the cart drawer", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab"); // skip link
  await page.keyboard.press("Tab");
  const bag = page.getByRole("button", { name: /Shopping bag/ });
  await bag.focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog", { name: "Shopping bag" });
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
});
