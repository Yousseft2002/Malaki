import type { Metadata, Viewport } from "next";
import { Jost, Playfair_Display } from "next/font/google";
import { Analytics } from "@/components/layout/analytics";
import Script from "next/script";
import { JS_GATE_SCRIPT } from "@/components/motion/js-gate";
import { MotionProvider } from "@/components/motion/motion-provider";
import { SITE_URL } from "@/lib/store-config";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "MALAKI — Moroccan confectionery & gift boxes", template: "%s | MALAKI" },
  description: "[META DESCRIPTION — one sentence describing MALAKI for search results]",
  openGraph: { siteName: "MALAKI", type: "website", locale: "en_US" },
};

export const viewport: Viewport = {
  themeColor: "#0B3A2E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${jost.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh">
        <Script id="malaki-js-gate" strategy="beforeInteractive">
          {JS_GATE_SCRIPT}
        </Script>
        <MotionProvider>{children}</MotionProvider>
        <Analytics />
      </body>
    </html>
  );
}
