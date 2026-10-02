// Fails if source uses colours outside the MALAKI palette.
// Allowed: the ten brand hexes (any case / 3-digit forms are rejected), palette
// tokens, transparent/currentColor. Run: node scripts/palette-audit.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const PALETTE = ["#0b3a2e", "#072e24", "#0f4a3a", "#c9a24a", "#7a5a1c", "#f6f1e6", "#ede5d3", "#0b2a22", "#4e5a50", "#9b2c1f"];
const ROOTS = ["src"];
const SKIP = [/[\/]generated[\/]/, /\.test\.tsx?$/];
const problems = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|css)$/.test(name) && !SKIP.some((r) => r.test(p))) check(p);
  }
}

function check(file) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      if (!PALETTE.includes(m[0].toLowerCase())) problems.push(`${file}:${i + 1}  ${m[0]}`);
    }
    // Tailwind default colours and raw named colours.
    for (const m of line.matchAll(/\b(?:bg|text|border|from|to|via|fill|stroke|ring|outline|decoration|accent|shadow)-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald-\d|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)\b/g)) {
      problems.push(`${file}:${i + 1}  ${m[0]}`);
    }
    for (const m of line.matchAll(/\b(rgb|rgba|hsl|hsla)\(/g)) problems.push(`${file}:${i + 1}  ${m[0]}…`);
  });
}

ROOTS.forEach(walk);
if (problems.length) {
  console.error(`Off-palette colours (${problems.length}):\n${problems.join("\n")}`);
  process.exit(1);
}
console.log("Palette audit passed: only MALAKI colours are used.");
