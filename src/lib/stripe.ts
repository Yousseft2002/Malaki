import "server-only";
import Stripe from "stripe";
import { requireEnv } from "@/lib/env";

let client: Stripe | null = null;

/**
 * Stripe client. The API version is the one pinned by the installed SDK
 * (stripe-node 23.x); upgrade the SDK deliberately and re-test webhooks.
 */
export function getStripe(): Stripe {
  client ??= new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    appInfo: { name: "malaki-storefront" },
    maxNetworkRetries: 2,
  });
  return client;
}
