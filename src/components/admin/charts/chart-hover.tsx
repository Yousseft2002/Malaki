"use client";

import { type KeyboardEvent, type PointerEvent, useRef, useState } from "react";

export type HoverItem = { title: string; lines: string[] };

/**
 * The only client JavaScript in the charts: an invisible layer over a
 * server-rendered SVG that shows a tooltip for the day under the pointer (or
 * finger), and lets keyboard users read every day with the arrow keys. It is
 * exposed as a slider so screen readers announce each day as it changes.
 */
export function ChartHover({ items, label }: { items: HoverItem[]; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const n = items.length;
  if (n === 0) return null;

  function fromPointer(e: PointerEvent<HTMLDivElement>) {
    const r = ref.current!.getBoundingClientRect();
    setActive(Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n))));
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const current = active ?? n - 1;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? Math.min(current + 1, n - 1)
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? Math.max(current - 1, 0)
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
  }

  const shown = active ?? n - 1;
  const item = items[shown]!;
  const center = ((shown + 0.5) / n) * 100;
  const align = center < 18 ? "left-0" : center > 82 ? "right-0" : "-translate-x-1/2";

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={`${label}. Use the arrow keys to read each day.`}
      aria-valuemin={1}
      aria-valuemax={n}
      aria-valuenow={shown + 1}
      aria-valuetext={`${item.title}: ${item.lines.join(", ")}`}
      onPointerMove={fromPointer}
      onPointerDown={fromPointer}
      onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
      onFocus={() => setActive((a) => a ?? n - 1)}
      onBlur={() => setActive(null)}
      onKeyDown={onKey}
      className="absolute inset-0 cursor-crosshair touch-pan-y focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald"
    >
      {active !== null && (
        <>
          <span aria-hidden="true" className="absolute inset-y-0 bg-emerald/10" style={{ left: `${(active / n) * 100}%`, width: `${100 / n}%` }} />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute -top-2 z-10 -translate-y-full border border-emerald/30 bg-ivory px-3 py-2 text-xs whitespace-nowrap text-ink shadow-[0_8px_20px_-10px_var(--color-emerald-deep)] ${align}`}
            style={align === "-translate-x-1/2" ? { left: `${center}%` } : undefined}
          >
            <span className="block font-medium text-emerald">{item.title}</span>
            {item.lines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </span>
        </>
      )}
    </div>
  );
}
