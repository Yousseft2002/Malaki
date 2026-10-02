// Legal page TEMPLATES. These are structural outlines with placeholders, not
// legal advice. Have them reviewed by a qualified adviser for the countries
// you sell to before launch.

export type LegalSection = { heading: string; body: string[] };
export type LegalPage = { slug: string; title: string; description: string; sections: LegalSection[] };

export const LEGAL_PAGES: LegalPage[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "How MALAKI collects and uses personal data.",
    sections: [
      { heading: "Who we are", body: ["[LEGAL BUSINESS NAME], [REGISTERED ADDRESS], [COMPANY NUMBER]. Contact: [PRIVACY CONTACT EMAIL]."] },
      {
        heading: "What we collect",
        body: [
          "Order details you give us at checkout: your name, email, phone (optional), and the recipient's name, phone (optional) and delivery address.",
          "Enquiry form details and newsletter sign-ups.",
          "Payment card details are entered on Stripe's secure page and are not stored by us. [CONFIRM AND LINK STRIPE PRIVACY POLICY]",
          "[ANALYTICS — describe the privacy-friendly analytics tool you enable, or remove this line]",
        ],
      },
      { heading: "Why we use it (lawful basis)", body: ["[PURPOSES AND LAWFUL BASES — e.g. performing your order contract, legitimate interests, consent for marketing]"] },
      { heading: "Who we share it with", body: ["[PROCESSORS — payment provider, email provider, hosting provider, couriers]"] },
      { heading: "How long we keep it", body: ["[RETENTION PERIODS]"] },
      { heading: "Your rights", body: ["[DATA SUBJECT RIGHTS AND HOW TO EXERCISE THEM; SUPERVISORY AUTHORITY]"] },
      { heading: "Cookies and local storage", body: ["Your shopping bag is saved in your browser's local storage so it's still there when you return. [LIST ANY OTHER COOKIES]"] },
      { heading: "Changes", body: ["Last updated: [DATE]."] },
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    description: "The terms that apply when you buy from MALAKI.",
    sections: [
      { heading: "About these terms", body: ["[WHO THE SELLER IS AND WHEN THESE TERMS APPLY]"] },
      { heading: "Orders and contract", body: ["[WHEN A CONTRACT IS FORMED — e.g. when we email your order confirmation]"] },
      { heading: "Prices and payment", body: ["[CURRENCY, TAXES INCLUDED/EXCLUDED, PAYMENT METHODS]"] },
      { heading: "Delivery dates", body: ["[REQUESTED DELIVERY DATES ARE TARGETS/GUARANTEES? COURIER DELAYS?]"] },
      { heading: "Cancellations, returns and refunds", body: ["[PERISHABLE GOODS POLICY AND CONSUMER RIGHTS IN YOUR JURISDICTION]"] },
      { heading: "Allergens", body: ["See our Allergen Information page. [RESPONSIBILITY WORDING]"] },
      { heading: "Liability", body: ["[LIMITATION OF LIABILITY]"] },
      { heading: "Governing law", body: ["[GOVERNING LAW AND JURISDICTION]"] },
      { heading: "Contact", body: ["[CONTACT DETAILS]"] },
    ],
  },
  {
    slug: "shipping-returns",
    title: "Shipping & Returns",
    description: "Delivery areas, dispatch days, and our returns policy.",
    sections: [
      { heading: "Where we deliver", body: ["[DELIVERY REGIONS]"] },
      { heading: "Delivery costs", body: ["[DELIVERY PRICES AND FREE-DELIVERY THRESHOLDS — keep in line with the shipping settings in the admin]"] },
      { heading: "Dispatch days and delivery times", body: ["[SHIPPING TIMES — dispatch days for fresh products, typical transit times, order cut-off]"] },
      { heading: "Local pickup", body: ["[PICKUP ADDRESS, HOURS AND INSTRUCTIONS]"] },
      { heading: "Packaging", body: ["[HOW PERISHABLE GOODS ARE PACKED]"] },
      { heading: "Damaged or missing items", body: ["[WHAT TO DO AND BY WHEN]"] },
      { heading: "Returns", body: ["[RETURNS POLICY FOR FOOD PRODUCTS]"] },
    ],
  },
  {
    slug: "allergens",
    title: "Allergen Information",
    description: "Allergen information for MALAKI products.",
    sections: [
      { heading: "Allergens in our products", body: ["[ALLERGENS — list the allergens used in your kitchen and per product; must match each product page]"] },
      { heading: "Cross-contamination", body: ["[MAY-CONTAIN STATEMENT — describe shared equipment and premises]"] },
      { heading: "Questions", body: ["[CONTACT FOR ALLERGEN QUESTIONS BEFORE ORDERING]"] },
    ],
  },
];

export function getLegalPage(slug: string): LegalPage | undefined {
  return LEGAL_PAGES.find((p) => p.slug === slug);
}
