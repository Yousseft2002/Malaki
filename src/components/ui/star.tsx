import { InView } from "@/components/motion/reveal";

/** The MALAKI 8-point star (two overlapping squares). Decorative. */
export function EightPointStar({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <g fill="currentColor">
        <rect x="5" y="5" width="14" height="14" />
        <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
      </g>
      <circle cx="12" cy="12" r="2.6" fill="var(--star-center, transparent)" />
    </svg>
  );
}

/** Outline version of the star, for empty slots and line art. */
export function EightPointStarOutline({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="5.5" y="5.5" width="13" height="13" />
        <rect x="5.5" y="5.5" width="13" height="13" transform="rotate(45 12 12)" />
      </g>
    </svg>
  );
}

/**
 * Star between two thin gold hairlines. When scrolled into view the hairlines
 * grow outward from the centre and the star turns into place.
 */
export function StarDivider({
  className = "",
  tone = "gold",
  align = "center",
}: {
  className?: string;
  tone?: "gold" | "ink";
  align?: "center" | "start";
}) {
  const color = tone === "gold" ? "text-gold" : "text-gold-ink";
  return (
    <InView
      role="presentation"
      className={`star-divider flex items-center gap-4 ${align === "start" ? "justify-start" : "justify-center"} ${color} ${className}`}
    >
      <span className="divider-line h-px w-16 bg-current opacity-70 sm:w-24" />
      <span className="divider-star inline-flex">
        <EightPointStar className="h-3.5 w-3.5" />
      </span>
      <span className="divider-line h-px w-16 bg-current opacity-70 sm:w-24" />
    </InView>
  );
}
