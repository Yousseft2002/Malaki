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

/** Star between two thin gold hairlines. */
export function StarDivider({ className = "", tone = "gold" }: { className?: string; tone?: "gold" | "ink" }) {
  const color = tone === "gold" ? "text-gold" : "text-gold-ink";
  return (
    <div className={`flex items-center justify-center gap-4 ${color} ${className}`} role="presentation">
      <span className="h-px w-16 bg-current opacity-70 sm:w-24" />
      <EightPointStar className="h-3.5 w-3.5" />
      <span className="h-px w-16 bg-current opacity-70 sm:w-24" />
    </div>
  );
}
