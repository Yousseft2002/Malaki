import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | MALAKI Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-sand/50">{children}</div>;
}
