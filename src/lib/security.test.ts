import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./auth/password";
import { signSession, verifySession } from "./auth/session";
import { createMemoryStore, createRateLimiter } from "./rate-limit";
import { isLikelySpam } from "./spam";

const SECRET = "x".repeat(32);

describe("admin session", () => {
  it("round-trips a valid session", async () => {
    const token = await signSession({ sub: "owner@example.com", exp: 2_000 }, SECRET);
    expect(await verifySession(token, SECRET, 1_000)).toEqual({ sub: "owner@example.com", exp: 2_000 });
  });
  it("rejects expired, tampered or wrongly-signed tokens", async () => {
    const token = await signSession({ sub: "owner@example.com", exp: 2_000 }, SECRET);
    expect(await verifySession(token, SECRET, 2_000)).toBeNull();
    expect(await verifySession(token, "y".repeat(32), 1_000)).toBeNull();
    const [, sig] = token.split(".");
    const forged = `${btoa(JSON.stringify({ sub: "x", exp: 9e9 }))}.${sig}`;
    expect(await verifySession(forged, SECRET, 1_000)).toBeNull();
    expect(await verifySession(undefined, SECRET)).toBeNull();
    expect(await verifySession("garbage", SECRET)).toBeNull();
  });
});

describe("password hashing", () => {
  it("verifies the right password only", async () => {
    const hash = await hashPassword("correct horse");
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
    expect(await verifyPassword("anything", undefined)).toBe(false);
    expect(await verifyPassword("anything", "plaintext")).toBe(false);
  });
});

describe("rate limiter", () => {
  it("allows up to the limit per window, then resets", () => {
    const check = createRateLimiter(createMemoryStore());
    const rule = { limit: 2, windowMs: 1000 };
    expect(check("ip", rule, 0).ok).toBe(true);
    expect(check("ip", rule, 10).ok).toBe(true);
    const blocked = check("ip", rule, 20);
    expect(blocked).toMatchObject({ ok: false, remaining: 0, retryAfterSeconds: 1 });
    expect(check("other", rule, 20).ok).toBe(true);
    expect(check("ip", rule, 1000).ok).toBe(true);
  });
});

describe("spam checks", () => {
  const now = 1_000_000;
  it("passes a normal human submission", () => {
    expect(isLikelySpam({ honeypot: "", startedAt: now - 20_000, now })).toBe(false);
  });
  it("catches honeypot fills, instant submits and missing timestamps", () => {
    expect(isLikelySpam({ honeypot: "http://spam", startedAt: now - 20_000, now })).toBe(true);
    expect(isLikelySpam({ honeypot: "", startedAt: now - 500, now })).toBe(true);
    expect(isLikelySpam({ honeypot: "", startedAt: undefined, now })).toBe(true);
    expect(isLikelySpam({ honeypot: "", startedAt: now + 5_000, now })).toBe(true);
  });
});
