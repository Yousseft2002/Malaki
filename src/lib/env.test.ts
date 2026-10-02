import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("env parsing", () => {
  it("treats empty strings from .env.example as unset", () => {
    const r = parseEnv({ DATABASE_URL: "postgres://x", ERROR_WEBHOOK_URL: "", SMTP_PORT: "", STRIPE_SECRET_KEY: "" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.ERROR_WEBHOOK_URL).toBeUndefined();
      expect(r.data.SMTP_PORT).toBeUndefined();
      expect(r.data.EMAIL_PROVIDER).toBe("console");
      expect(r.data.CHECKOUT_HOLD_MINUTES).toBe(60);
    }
  });
  it("rejects a hold window Stripe would refuse", () => {
    expect(parseEnv({ DATABASE_URL: "x", CHECKOUT_HOLD_MINUTES: "30" }).success).toBe(false);
  });
  it("requires DATABASE_URL", () => {
    expect(parseEnv({}).success).toBe(false);
  });
});
