// Lightweight, privacy-friendly spam checks for public forms (no third-party
// CAPTCHA): a hidden honeypot field bots tend to fill, and a minimum time
// between the form rendering and being submitted. Combine with rate limiting.

export const HONEYPOT_FIELD = "website";
export const STARTED_AT_FIELD = "startedAt";
export const MIN_FILL_MS = 3000;

export function isLikelySpam(input: { honeypot: unknown; startedAt: unknown; now?: number }): boolean {
  const now = input.now ?? Date.now();
  if (typeof input.honeypot === "string" && input.honeypot.trim() !== "") return true;
  const started = Number(input.startedAt);
  if (!Number.isFinite(started) || started <= 0) return true;
  const elapsed = now - started;
  // Too fast to be human, or a timestamp from the future / far past (replayed).
  return elapsed < MIN_FILL_MS || elapsed > 24 * 60 * 60 * 1000;
}
