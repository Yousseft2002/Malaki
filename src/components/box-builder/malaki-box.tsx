"use client";

import { AnimatePresence, motion } from "motion/react";
import { handPlacedRotation, spring } from "@/components/motion/tokens";
import { EightPointStar } from "@/components/ui/star";
import { PieceToken } from "./piece-token";

export type Placement = { key: string; itemId: string };

const BURST = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * The visual MALAKI box. Pieces drop into their slots one by one and settle
 * with a tiny hand-placed rotation; removed pieces lift out. Empty slots glow
 * softly (the next one most). When complete: a gold highlight sweeps across,
 * the lid closes, the ribbon ties itself and a small burst of gold stars
 * appears. Entirely visual (aria-hidden) — state is announced elsewhere.
 */
export function MalakiBox({
  capacity,
  placements,
  finishOf,
  complete,
  peek,
  size = "lg",
}: {
  capacity: number;
  placements: Placement[];
  finishOf: (itemId: string) => number;
  complete: boolean;
  /** Keep the lid open even when complete. */
  peek: boolean;
  size?: "lg" | "sm";
}) {
  const columns = capacity <= 6 ? 3 : capacity <= 12 ? 4 : 6;
  const closed = complete && !peek;

  return (
    <div aria-hidden="true" data-complete={complete} data-closed={closed} className="group/box relative mx-auto w-full" style={{ maxWidth: size === "lg" ? 420 : 280 }}>
      {/* Box body */}
      <div className="relative overflow-hidden bg-emerald-deep p-3 shadow-[0_30px_60px_-30px_var(--color-emerald-deep)] ring-1 ring-gold/60 sm:p-4">
        <div aria-hidden="true" className="pointer-events-none absolute inset-1.5 border border-gold/30" />
        <div className="relative grid gap-2 bg-emerald p-2.5 shadow-[inset_0_2px_10px_var(--color-emerald-deep)]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: capacity }, (_, i) => {
            const placed = placements[i];
            const isNext = i === placements.length && !complete;
            return (
              <div key={i} className="relative aspect-square">
                {/* Empty slot: a softly glowing gold ring inviting a piece */}
                <span
                  className={`absolute inset-[6%] rounded-full border border-dashed border-gold/40 ${isNext ? "animate-[slot-glow_1.8s_var(--ease-in-out)_infinite] border-gold bg-gold/10" : ""}`}
                />
                <AnimatePresence>
                  {placed && (
                    <motion.div
                      key={placed.key}
                      className="absolute inset-[4%]"
                      initial={{ opacity: 0, scale: 0.35, y: -28, rotate: handPlacedRotation(i) - 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0, rotate: handPlacedRotation(i) }}
                      exit={{ opacity: 0, scale: 0.5, y: -16, transition: { duration: 0.22 } }}
                      transition={spring.bouncy}
                    >
                      <PieceToken finish={finishOf(placed.itemId)} className="h-full w-full" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Gold highlight that sweeps the box on completion */}
        <span className="sweep-band pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-gold-light)_55%,transparent),transparent)] opacity-0 group-data-[complete=true]/box:animate-[sweep_900ms_var(--ease-in-out)_both] group-data-[complete=true]/box:opacity-100" />

        {/* Lid: drops into place when the box is complete */}
        <div className="pointer-events-none absolute inset-0 -translate-y-[110%] bg-emerald-deep opacity-0 transition-[transform,opacity] duration-700 ease-[var(--ease-bounce)] group-data-[closed=true]/box:translate-y-0 group-data-[closed=true]/box:opacity-100 group-data-[closed=true]/box:delay-300">
          <span className="absolute inset-2 border border-gold/60" />
          <span className="absolute inset-3.5 border border-gold/25" />
          {/* Faint star lattice embossed on the lid */}
          <span className="absolute inset-4 bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-gold)_30%,transparent)_1px,transparent_1.5px)] [background-size:14px_14px]" />
          {/* Maker's mark in the corner, clear of the ribbon */}
          <span className="absolute right-6 bottom-5 flex items-center gap-2">
            <EightPointStar className="h-3.5 w-3.5 text-gold" />
            <span className="wordmark text-xs text-gold">Malaki</span>
          </span>
        </div>

        {/* Ribbon ties itself: vertical band, horizontal band, then the bow */}
        <span className="pointer-events-none absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 scale-y-0 bg-gold shadow-[0_0_0_1px_var(--color-gold-ink)] transition-transform duration-500 ease-[var(--ease-out)] group-data-[closed=true]/box:scale-y-100 group-data-[closed=true]/box:delay-[900ms]" />
        <span className="pointer-events-none absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 scale-x-0 bg-gold shadow-[0_0_0_1px_var(--color-gold-ink)] transition-transform duration-500 ease-[var(--ease-out)] group-data-[closed=true]/box:scale-x-100 group-data-[closed=true]/box:delay-[1100ms]" />
        <span className="pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 scale-0 items-center gap-0.5 transition-transform duration-500 ease-[var(--ease-bounce)] group-data-[closed=true]/box:scale-100 group-data-[closed=true]/box:delay-[1350ms]">
          <span className="block h-9 w-12 origin-right -rotate-[18deg] rounded-[50%] border-[4px] border-gold bg-emerald-deep/40 shadow-[0_2px_4px_var(--color-emerald-deep)]" />
          <span className="relative z-10 -mx-2 block h-5 w-5 rotate-45 bg-gold ring-1 ring-gold-ink" />
          <span className="block h-9 w-12 origin-left rotate-[18deg] rounded-[50%] border-[4px] border-gold bg-emerald-deep/40 shadow-[0_2px_4px_var(--color-emerald-deep)]" />
        </span>
      </div>

      {/* Restrained burst of gold stars */}
      <div className="pointer-events-none absolute top-1/2 left-1/2">
        {BURST.map((a) => (
          <span
            key={a}
            className="burst-star absolute -top-2 -left-2 opacity-0 group-data-[complete=true]/box:animate-[burst_1s_var(--ease-out)_1.5s_both]"
            style={{ "--a": `${a}deg`, "--r": size === "lg" ? "170px" : "110px" } as React.CSSProperties}
          >
            <EightPointStar className="h-4 w-4 text-gold" />
          </span>
        ))}
      </div>
    </div>
  );
}
