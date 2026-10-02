import { EightPointStar } from "@/components/ui/star";

/**
 * Low-opacity gold Moroccan geometry — like foil on luxury packaging catching
 * the light. Decorative only (aria-hidden), transform/opacity animations only,
 * switched off under reduced motion.
 */
export function FloatingMotif({ className = "", density = "full" }: { className?: string; density?: "full" | "light" }) {
  const stars = density === "full" ? STARS : STARS.slice(0, 4);
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <svg className="absolute inset-0 h-full w-full text-gold" preserveAspectRatio="xMidYMid slice" viewBox="0 0 600 600">
        <defs>
          <pattern id="malaki-zellige" width="120" height="120" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.18">
              <rect x="35" y="35" width="50" height="50" />
              <rect x="35" y="35" width="50" height="50" transform="rotate(45 60 60)" />
              <path d="M0 60h25M95 60h25M60 0v25M60 95v25" />
            </g>
          </pattern>
        </defs>
        <rect width="600" height="600" fill="url(#malaki-zellige)" />
        <circle cx="300" cy="300" r="230" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
        <circle cx="300" cy="300" r="270" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.15" strokeDasharray="2 6" />
      </svg>
      {stars.map((s, i) => (
        <span key={i} className="motif-float absolute" style={{ left: s.x, top: s.y, animationDelay: `${i * -1.7}s` }}>
          <EightPointStar className={`motif-glint text-gold ${s.size}`} />
        </span>
      ))}
    </div>
  );
}

const STARS = [
  { x: "12%", y: "18%", size: "h-3 w-3" },
  { x: "82%", y: "12%", size: "h-4 w-4" },
  { x: "88%", y: "70%", size: "h-2.5 w-2.5" },
  { x: "18%", y: "78%", size: "h-3.5 w-3.5" },
  { x: "50%", y: "6%", size: "h-2 w-2" },
  { x: "60%", y: "90%", size: "h-3 w-3" },
];
