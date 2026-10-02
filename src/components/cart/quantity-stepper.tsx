"use client";

import { AnimatedCounter } from "@/components/motion/animated-counter";
import { MAX_LINE_QUANTITY } from "@/lib/domain/pricing";

/** − n + stepper with a physical press feel; the number rolls in the direction of change. */
export function QuantityStepper({
  value,
  onChange,
  label,
  min = 1,
  max = MAX_LINE_QUANTITY,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
}) {
  const btn =
    "inline-flex h-11 w-11 items-center justify-center text-lg text-emerald transition-[transform,background-color] duration-150 hover:bg-sand active:scale-90 active:bg-sand disabled:cursor-not-allowed disabled:text-muted/40 disabled:hover:bg-transparent disabled:active:scale-100";
  return (
    <div role="group" aria-label={label} className="inline-flex items-center border border-line bg-ivory">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <span aria-hidden="true">−</span>
      </button>
      <output aria-live="polite" className="flex w-10 justify-center text-center tabular-nums">
        <AnimatedCounter value={value} />
      </output>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
