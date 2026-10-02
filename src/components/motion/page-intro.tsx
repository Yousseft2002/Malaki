import type { CSSProperties, ReactNode } from "react";

/**
 * CSS-only entrance sequence that plays on first paint, before hydration, so
 * the page is usable immediately. Mark children with data-intro and an order:
 *   <PageIntro><p {...introStep(0)}>…</p><h1 {...introStep(1)}>…</h1></PageIntro>
 * data-intro="fade" fades only; data-intro="settle" settles a product into place.
 */
export function PageIntro({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`intro ${className}`}>{children}</div>;
}

export function introStep(order: number, kind: "rise" | "fade" | "settle" = "rise") {
  return { "data-intro": kind === "rise" ? "" : kind, style: { "--d": order } as CSSProperties };
}
