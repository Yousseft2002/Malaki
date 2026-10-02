// Zod schemas shared by client forms (instant feedback) and server actions
// (authoritative validation).

import { z } from "zod";
import { GIFT_NOTE_MAX, MAX_LINE_QUANTITY } from "@/lib/domain/pricing";

const trimmed = (max: number) => z.string().trim().max(max);
const required = (label: string, max = 120) => trimmed(max).min(1, { error: `Please enter ${label}.` });
const optional = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : undefined));
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Please enter a valid email address." }).max(254));
const phone = trimmed(30)
  .regex(/^[+()\d\s.-]*$/, { error: "Please enter a valid phone number." })
  .optional()
  .transform((v) => (v ? v : undefined));

export const spamFields = {
  website: z.string().optional(), // honeypot
  startedAt: z.coerce.number().optional(),
};

// ─── Newsletter ─────────────────────────────────────────────────────────────

export const newsletterSchema = z.object({
  email,
  source: z.enum(["footer", "homepage"]).default("footer"),
  ...spamFields,
});

// ─── Enquiries ──────────────────────────────────────────────────────────────

export const ENQUIRY_TYPES = [
  { value: "WEDDING", label: "Wedding" },
  { value: "CORPORATE", label: "Corporate gifting" },
  { value: "EVENT", label: "Event or celebration" },
  { value: "OTHER", label: "Something else" },
] as const;

export const enquirySchema = z.object({
  type: z.enum(["WEDDING", "CORPORATE", "EVENT", "OTHER"], { error: "Please choose an enquiry type." }),
  name: required("your name"),
  email,
  phone,
  company: optional(120),
  eventDate: z.iso
    .date({ error: "Please enter a valid date." })
    .optional()
    .or(z.literal("").transform(() => undefined)),
  quantity: optional(80),
  budget: optional(80),
  message: required("a message", 3000).min(10, { error: "Please tell us a little more (at least 10 characters)." }),
  consent: z.literal("on", { error: "Please agree so we can reply to your enquiry." }),
  ...spamFields,
});

// ─── Cart & checkout ────────────────────────────────────────────────────────

export const cartLineSchema = z.object({
  variantId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
  giftWrap: z.boolean(),
  giftNote: z.string().trim().max(GIFT_NOTE_MAX).optional(),
  box: z.record(z.string().max(64), z.number().int().min(0).max(500)).optional(),
});

export const cartSchema = z.array(cartLineSchema).min(1, { error: "Your bag is empty." }).max(50);

export const addressSchema = z.object({
  addressLine1: required("the address", 200),
  addressLine2: optional(200),
  city: required("the town or city", 120),
  region: optional(120),
  postalCode: required("the postcode", 20),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, { error: "Please choose a country." }),
});

export const checkoutDetailsSchema = z
  .object({
    buyerName: required("your name"),
    buyerEmail: email,
    buyerPhone: phone,
    shippingRuleId: z.string().min(1, { error: "Please choose a delivery option." }),
    deliveryDate: z.iso.date({ error: "Please choose a date." }),
    recipientName: required("the recipient's name"),
    recipientPhone: phone,
    sameAsBuyer: z.boolean().default(false),
    address: addressSchema.optional(),
    giftWrapAll: z.boolean().default(false),
    giftNote: z
      .string()
      .trim()
      .max(GIFT_NOTE_MAX, { error: `Gift notes are limited to ${GIFT_NOTE_MAX} characters.` })
      .optional(),
    acceptTerms: z.literal(true, { error: "Please accept the terms to continue." }),
  })
  .strict();

export const checkoutRequestSchema = z.object({
  lines: cartSchema,
  details: checkoutDetailsSchema,
});

export type CheckoutDetails = z.infer<typeof checkoutDetailsSchema>;
export type CartLineInput = z.infer<typeof cartLineSchema>;

// ─── Shared result shape for server actions ────────────────────────────────

export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[] | undefined> };

export const IDLE: FormState = { status: "idle" };

export function fieldErrorsOf(error: z.ZodError): Record<string, string[] | undefined> {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}
