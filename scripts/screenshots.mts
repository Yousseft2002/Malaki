// Screenshot pages at 360 / 768 / 1440 px for visual review.
// Usage: npx tsx scripts/screenshots.mts <outDir> [path ...]
// Scrolls through each page first so scroll-reveals have played.
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const [outDir = "preview-screenshots", ...paths] = process.argv.slice(2);
const pages = paths.length
  ? paths
  : ["/", "/collections/gift-boxes", "/products/the-malaki-box", "/build-your-own-box", "/cart", "/checkout", "/enquiries", "/our-story", "/does-not-exist"];
const widths = [360, 768, 1440];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: width < 768 ? 780 : 900 } });
  for (const path of pages) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    // Scroll to the bottom in steps so every reveal fires, then back to top.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.waitForTimeout(900);
    const name = path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "_");
    await page.screenshot({ path: `${outDir}/${name}-${width}.png`, fullPage: true });
    console.log(`${name}-${width}`);
  }
  await page.close();
}
await browser.close();
