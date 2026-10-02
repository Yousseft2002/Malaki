import Script from "next/script";

// Privacy-friendly analytics, off unless configured. Works with any provider
// that is loaded by a single <script> tag with a site identifier attribute,
// e.g. Plausible (data-domain) or Umami (data-website-id). Verify the exact
// snippet with your provider's docs before going live.
export function Analytics() {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_SRC;
  const attr = process.env.NEXT_PUBLIC_ANALYTICS_SITE_ATTRIBUTE; // e.g. "data-domain"
  const value = process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID;
  if (!src) return null;
  const attributes = attr && value ? { [attr]: value } : {};
  return <Script src={src} strategy="afterInteractive" defer {...attributes} />;
}
