import type { CSSProperties } from "react";
import { EightPointStar } from "./star";

const BURST = [0, 45, 90, 135, 180, 225, 270, 315];
const delay = (ms: number) => ({ animationDelay: `${ms}ms` }) as CSSProperties;

/**
 * Pure-CSS gift box illustrations (decorative, aria-hidden):
 *  - "celebrate": the lid closes, the ribbon ties itself and a restrained
 *    burst of gold stars appears — for the order confirmation.
 *  - "empty": an open, empty cookie box with a single crumb — for the 404.
 * Plays on first paint without JavaScript; still under reduced motion.
 */
export function GiftBoxScene({ variant, className = "" }: { variant: "celebrate" | "empty"; className?: string }) {
  if (variant === "empty") return <EmptyBox className={className} />;
  return (
    <div aria-hidden="true" className={`relative mx-auto w-56 sm:w-64 ${className}`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-emerald-deep shadow-[0_30px_50px_-28px_var(--color-emerald-deep)] ring-1 ring-gold/60">
        {/* Pieces inside, visible before the lid closes */}
        <div className="absolute inset-3 grid grid-cols-3 gap-2 bg-emerald p-2">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={`rounded-full ${i % 3 === 0 ? "bg-gold" : i % 3 === 1 ? "bg-sand" : "bg-emerald-soft ring-1 ring-gold/60"}`} />
          ))}
        </div>
        {/* Lid */}
        <div className="absolute inset-0 animate-[lid-drop_700ms_var(--ease-bounce)_both] bg-emerald-deep" style={delay(350)}>
          <span className="absolute inset-2 border border-gold/60" />
          <span className="absolute inset-4 bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-gold)_30%,transparent)_1px,transparent_1.5px)] [background-size:12px_12px]" />
        </div>
        {/* Ribbon */}
        <span className="absolute inset-y-0 left-1/2 w-2.5 -translate-x-1/2 origin-top animate-[grow-y_450ms_var(--ease-out)_both] bg-gold" style={delay(1000)} />
        <span className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 origin-left animate-[grow-x_450ms_var(--ease-out)_both] bg-gold" style={delay(1200)} />
      </div>
      {/* Bow */}
      <span className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center">
        <span className="flex animate-[pop-in_500ms_var(--ease-bounce)_both] items-center" style={delay(1450)}>
          <span className="block h-8 w-11 origin-right -rotate-[18deg] rounded-[50%] border-4 border-gold bg-emerald-deep/40" />
          <span className="relative z-10 -mx-2 block h-4 w-4 rotate-45 bg-gold ring-1 ring-gold-ink" />
          <span className="block h-8 w-11 origin-left rotate-[18deg] rounded-[50%] border-4 border-gold bg-emerald-deep/40" />
        </span>
      </span>
      {/* Restrained star burst */}
      <span className="absolute top-1/2 left-1/2">
        {BURST.map((a) => (
          <span
            key={a}
            className="burst-star absolute -top-2 -left-2 animate-[burst_1.1s_var(--ease-out)_both]"
            style={{ "--a": `${a}deg`, "--r": "150px", animationDelay: "1650ms" } as CSSProperties}
          >
            <EightPointStar className="h-4 w-4 text-gold" />
          </span>
        ))}
      </span>
    </div>
  );
}

function EmptyBox({ className }: { className: string }) {
  return (
    <div aria-hidden="true" className={`relative mx-auto w-56 sm:w-64 ${className}`}>
      {/* Lid, propped open behind the box */}
      <div className="absolute -top-10 left-4 right-4 h-12 origin-bottom -rotate-6 bg-emerald-deep ring-1 ring-gold/60">
        <span className="absolute inset-1.5 border border-gold/40" />
      </div>
      <div className="relative aspect-[4/3] bg-emerald-deep p-3 shadow-[0_30px_50px_-28px_var(--color-emerald-deep)] ring-1 ring-gold/60">
        <div className="grid h-full grid-cols-3 gap-2 bg-emerald p-2">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="rounded-full border border-dashed border-gold/40" />
          ))}
        </div>
        {/* One lonely crumb */}
        <span className="motif-float absolute right-[30%] bottom-[22%] h-2 w-2.5 rounded-full bg-gold" />
      </div>
    </div>
  );
}
