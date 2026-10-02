// MALAKI motion tokens — the single source of the site's motion personality:
// smooth, elegant, slightly bouncy. CSS mirrors these as custom properties in
// globals.css (--dur-*, --ease-*, --stagger-*); keep the two in sync.

/** Durations in seconds (Motion) — CSS equivalents are in ms. */
export const duration = {
  instant: 0.12, // --dur-instant  press feedback
  fast: 0.2, //     --dur-fast     hovers, small state changes
  base: 0.32, //    --dur-base     most transitions
  slow: 0.55, //    --dur-slow     panels, drawers, image swaps
  reveal: 0.7, //   --dur-reveal   scroll reveals
  ceremony: 1.1, // --dur-ceremony box completion, success page
} as const;

/** Cubic-bezier easings. */
export const ease = {
  out: [0.22, 1, 0.36, 1], //        --ease-out     default "settle" curve
  inOut: [0.65, 0, 0.35, 1], //      --ease-in-out  symmetric moves (shimmer)
  bounce: [0.34, 1.56, 0.64, 1], //  --ease-bounce  playful overshoot (pieces, badges)
  spring: [0.32, 1.25, 0.5, 1], //   --ease-spring  drawer / sheet slide with a small overshoot
} as const;

/** Spring presets for Motion. */
export const spring = {
  soft: { type: "spring", stiffness: 260, damping: 26 },
  bouncy: { type: "spring", stiffness: 420, damping: 17 },
  drawer: { type: "spring", stiffness: 320, damping: 32 },
} as const;

/** Delay between staggered children, in seconds. */
export const stagger = {
  tight: 0.04, // --stagger-tight  lists of small items
  base: 0.07, //  --stagger-base   cards
  loose: 0.12, // --stagger-loose  hero / ceremony sequences
} as const;

/** Small deterministic "hand-placed" rotation for an index, in degrees (−4…4). */
export function handPlacedRotation(index: number): number {
  const pattern = [-3, 2, -1, 4, -2, 1, 3, -4];
  return pattern[index % pattern.length]!;
}
