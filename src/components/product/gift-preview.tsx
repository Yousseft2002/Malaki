import { EightPointStar } from "@/components/ui/star";

/**
 * Little box illustration: when `wrapped`, gold ribbon bands slide across
 * and the bow pops on (transform/opacity only).
 */
export function GiftBoxPreview({ wrapped, className = "" }: { wrapped: boolean; className?: string }) {
  return (
    <div aria-hidden="true" className={`relative h-20 w-24 shrink-0 ${className}`}>
      {/* Box body + lid */}
      <div className="absolute inset-x-1 bottom-0 h-14 bg-emerald shadow-[0_10px_18px_-10px_var(--color-emerald-deep)]" />
      <div className="absolute inset-x-0 top-3 h-4 bg-emerald-deep" />
      <EightPointStar className="absolute top-[2.15rem] left-1/2 h-4 w-4 -translate-x-1/2 text-gold/70" />
      {/* Ribbon: vertical and horizontal bands grow from the centre */}
      <div
        className={`absolute top-3 bottom-0 left-1/2 w-2 -translate-x-1/2 origin-center bg-gold transition-transform duration-500 ease-[var(--ease-out)] ${
          wrapped ? "scale-y-100" : "scale-y-0"
        }`}
      />
      <div
        className={`absolute inset-x-1 top-[2.6rem] h-2 origin-center bg-gold transition-transform duration-500 ease-[var(--ease-out)] ${
          wrapped ? "scale-x-100 delay-150" : "scale-x-0"
        }`}
      />
      {/* Bow */}
      <div
        className={`absolute top-0 left-1/2 flex -translate-x-1/2 gap-0.5 transition-[transform,opacity] duration-500 ease-[var(--ease-bounce)] ${
          wrapped ? "scale-100 opacity-100 delay-300" : "scale-0 opacity-0"
        }`}
      >
        <span className="block h-3 w-4 -rotate-12 rounded-[50%] border-2 border-gold" />
        <span className="block h-3 w-4 rotate-12 rounded-[50%] border-2 border-gold" />
      </div>
    </div>
  );
}

/** A small folded card showing the gift note as it's typed. */
export function GiftNoteCard({ note }: { note: string }) {
  const empty = note.trim() === "";
  return (
    <figure aria-hidden="true" className="relative mt-4 rotate-[-1.5deg] bg-ivory p-5 shadow-[0_14px_30px_-18px_var(--color-emerald-deep)] ring-1 ring-gold/30">
      <EightPointStar className="absolute top-3 right-3 h-3 w-3 text-gold" />
      <p className="eyebrow mb-2 text-[0.65rem] text-gold-ink">Your card</p>
      <blockquote className={`min-h-12 font-display text-lg leading-snug break-words italic ${empty ? "text-muted/70" : "text-emerald"}`}>
        {empty ? "Your message will appear here…" : note}
      </blockquote>
      <p className="mt-3 text-right font-display text-sm text-gold-ink">— MALAKI</p>
    </figure>
  );
}
