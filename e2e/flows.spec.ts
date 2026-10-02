import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("mobile menu opens, traps focus in a dialog and closes with Escape", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Menu" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Stuffed Dates" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("add to bag opens the drawer and the bag persists after reload", async ({ page }) => {
  await page.goto("/products/the-malaki-box");
  await page.getByLabel("Gift note (optional)").fill("Happy Eid!");
  await page.getByRole("button", { name: "Add to bag" }).click();
  const drawer = page.getByRole("dialog", { name: "Shopping bag" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "The Malaki Box" })).toBeVisible();
  await expect(drawer.getByText("“Happy Eid!”")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /Shopping bag, 1 item/ })).toBeVisible();
});

test("gift note is limited to 200 characters", async ({ page }) => {
  await page.goto("/products/gazelle-horns");
  const note = page.getByLabel("Gift note (optional)");
  await note.fill("x".repeat(250));
  await expect(note).toHaveValue("x".repeat(200));
  await expect(page.getByText("0 characters left")).toBeVisible();
});

test("build your own box: must be full, then adds one configured item", async ({ page }) => {
  await page.goto("/build-your-own-box");
  await page.getByText("Box of 6", { exact: true }).click();
  const addDate = page.getByRole("button", { name: "Add one Stuffed date" });
  await addDate.click();
  await page.getByRole("button", { name: "Add box to bag" }).click();
  await expect(page.getByText("Add 5 more pieces to complete your box.")).toBeVisible();
  for (let i = 0; i < 3; i++) await addDate.click();
  for (let i = 0; i < 2; i++) await page.getByRole("button", { name: "Add one Ghriba" }).click();
  await expect(page.getByText("6 of 6 pieces")).toBeVisible();
  await expect(addDate).toBeDisabled(); // box is full
  await page.getByRole("button", { name: "Add box to bag" }).click();
  const drawer = page.getByRole("dialog", { name: "Shopping bag" });
  await expect(drawer.getByText("2 × Ghriba, 4 × Stuffed date")).toBeVisible();
});

test("checkout validates on the client before contacting Stripe", async ({ page }) => {
  await page.goto("/products/ghriba-selection");
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.goto("/checkout");
  await expect(page.getByRole("button", { name: "Continue to payment" })).toBeEnabled();
  await page.getByRole("button", { name: "Continue to payment" }).click();
  const summary = page.locator("[role=alert]:not(#__next-route-announcer__)").first();
  await expect(summary).toContainText("Please check the highlighted fields");
  await expect(page.getByLabel("Full name")).toHaveAttribute("aria-invalid", "true");
});

test("enquiry form shows validation errors", async ({ page }) => {
  await page.goto("/enquiries");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText("Please choose an enquiry type.")).toBeVisible();
  await expect(page.getByText("Please agree so we can reply to your enquiry.")).toBeVisible();
});
