"use client";

import { MAX_LINE_QUANTITY } from "@/lib/domain/pricing";

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
    "inline-flex h-11 w-11 items-center justify-center text-lg text-emerald hover:bg-sand disabled:opacity-40 disabled:hover:bg-transparent";
  return (
    <div role="group" aria-label={label} className="inline-flex items-center border border-[#857a63]">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        −
      </button>
      <output aria-live="polite" className="w-10 text-center tabular-nums">
        {value}
      </output>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}
