// Chart colours: MALAKI brand tokens and color-mix() blends of them only (no
// new hues). Six clearly different product shades — dark/light and green/gold
// alternate so neighbours never look alike — plus a neutral for "Other".

export const PRODUCT_SHADES = [
  "var(--color-emerald)",
  "var(--color-gold)",
  "color-mix(in srgb, var(--color-emerald) 45%, var(--color-ivory))",
  "var(--color-gold-ink)",
  "color-mix(in srgb, var(--color-emerald) 55%, var(--color-gold))",
  "color-mix(in srgb, var(--color-gold-ink) 40%, var(--color-ivory))",
] as const;

export const OTHER_SHADE = "color-mix(in srgb, var(--color-muted) 30%, var(--color-sand))";
