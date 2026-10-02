export type DonutSlice = { key: string; name: string; value: number; color: string; detail: string; share: number };

const OUTER = 96;
const INNER = 60;

/** Ring segment between two angles in turns (0 = top), clockwise. */
function arc(start: number, end: number): string {
  const pt = (t: number, radius: number) => {
    const a = t * 2 * Math.PI - Math.PI / 2;
    return `${(Math.cos(a) * radius).toFixed(3)} ${(Math.sin(a) * radius).toFixed(3)}`;
  };
  const large = end - start > 0.5 ? 1 : 0;
  return `M${pt(start, OUTER)}A${OUTER} ${OUTER} 0 ${large} 1 ${pt(end, OUTER)}L${pt(end, INNER)}A${INNER} ${INNER} 0 ${large} 0 ${pt(start, INNER)}Z`;
}

/**
 * Revenue-share donut, server-rendered. 2px ivory gaps separate slices; the
 * total sits in the middle; the legend beside it names every slice with units,
 * revenue and % so identity never depends on colour alone.
 */
export function Donut({ slices, centerLabel, centerValue }: { slices: DonutSlice[]; centerLabel: string; centerValue: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  // Cumulative turns: each slice starts where the previous one ended.
  const ends = slices.map((_, i) => slices.slice(0, i + 1).reduce((sum, x) => sum + x.value, 0) / total);
  const parts = slices.map((s, i) => ({ ...s, start: i === 0 ? 0 : ends[i - 1]!, end: ends[i]! }));
  const summary = slices.map((s) => `${s.name} ${Math.round(s.share)}%`).join(", ");

  return (
    <div className="mt-4 grid items-center gap-8 sm:grid-cols-[minmax(0,14rem)_1fr]">
      <div className="relative mx-auto aspect-square w-full max-w-56">
        <svg viewBox="-100 -100 200 200" className="h-full w-full" role="img" aria-label={`Revenue share: ${summary}`}>
          {parts.map((p) => (
            <path key={p.key} d={arc(p.start, p.end)} style={{ fill: p.color }} className="stroke-ivory" strokeWidth="2" strokeLinejoin="round" />
          ))}
        </svg>
        <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[0.7rem] tracking-wide text-muted uppercase">{centerLabel}</span>
          <span className="font-display text-xl text-emerald">{centerValue}</span>
        </div>
      </div>
      <ul className="flex flex-col gap-3 text-sm">
        {slices.map((s) => (
          <li key={s.key} className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-3">
            <span aria-hidden="true" className="h-3 w-3 translate-y-0.5 ring-1 ring-ink/15" style={{ background: s.color }} />
            <span className="min-w-0">
              <span className="block font-medium break-words text-ink">{s.name}</span>
              <span className="block text-muted">{s.detail}</span>
            </span>
            <span className="font-medium text-emerald tabular-nums">{Math.round(s.share)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
