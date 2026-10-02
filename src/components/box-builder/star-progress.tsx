import { EightPointStar, EightPointStarOutline } from "@/components/ui/star";

/** A row of 8-point star slots that fill in gold as pieces are added. Visual only. */
export function StarProgress({ filled, capacity, className = "" }: { filled: number; capacity: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`flex flex-wrap justify-center gap-1 ${className}`}>
      {Array.from({ length: capacity }, (_, i) => (
        <span key={i} className="relative h-4 w-4">
          <EightPointStarOutline className="absolute inset-0 h-4 w-4 text-gold-ink/45" />
          <span
            className={`absolute inset-0 transition-[transform,opacity] duration-500 ease-[var(--ease-bounce)] ${i < filled ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"}`}
          >
            <EightPointStar className="h-4 w-4 text-gold" />
          </span>
        </span>
      ))}
    </div>
  );
}
