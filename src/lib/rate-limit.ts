// Fixed-window rate limiter. The default store is in-process memory, which is
// correct for a single server. When running several instances, implement
// RateLimitStore with Redis (or similar) and pass it to createRateLimiter.

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimitStore {
  /** Increment the counter for key and return [count, windowResetAt]. */
  hit(key: string, windowMs: number, now: number): [number, number];
}

export function createMemoryStore(maxKeys = 10_000): RateLimitStore {
  const windows = new Map<string, { count: number; resetAt: number }>();
  return {
    hit(key, windowMs, now) {
      let w = windows.get(key);
      if (!w || w.resetAt <= now) {
        if (windows.size >= maxKeys) {
          for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
          if (windows.size >= maxKeys) windows.delete(windows.keys().next().value!);
        }
        w = { count: 0, resetAt: now + windowMs };
        windows.set(key, w);
      }
      w.count += 1;
      return [w.count, w.resetAt];
    },
  };
}

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export function createRateLimiter(store: RateLimitStore = createMemoryStore()) {
  return function check(key: string, rule: RateLimitRule, now = Date.now()): RateLimitResult {
    const [count, resetAt] = store.hit(key, rule.windowMs, now);
    return {
      ok: count <= rule.limit,
      remaining: Math.max(rule.limit - count, 0),
      retryAfterSeconds: Math.max(Math.ceil((resetAt - now) / 1000), 0),
    };
  };
}

export const rateLimit = createRateLimiter();

export const LIMITS = {
  enquiry: { limit: 5, windowMs: 60 * 60 * 1000 },
  newsletter: { limit: 5, windowMs: 60 * 60 * 1000 },
  checkout: { limit: 20, windowMs: 10 * 60 * 1000 },
  adminLogin: { limit: 5, windowMs: 15 * 60 * 1000 },
  // Page-view beacons: generous (a shopper browses many pages), but caps floods.
  track: { limit: 120, windowMs: 10 * 60 * 1000 },
} satisfies Record<string, RateLimitRule>;

/** Best-effort client IP. Only trust X-Forwarded-For behind a proxy you control. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
