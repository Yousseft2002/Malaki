import { ChartHover, type HoverItem } from "./chart-hover";
import { labelIndexes, longDate, niceMax, shortDate } from "./scale";

type Point = { date: string; value: number; lines: string[] };

/**
 * Daily chart, rendered on the server: slim emerald columns or a 2px line with
 * a soft area, light gridlines, a y-axis, a few date labels and the highest day
 * labelled. The SVG stretches to its box (non-scaling strokes); all text is
 * HTML so it stays readable on a phone. ChartHover adds tooltips + keyboard.
 */
export function TimeChart({
  points,
  kind = "columns",
  format,
  label,
  emptyText,
  size = "lg",
}: {
  points: Point[];
  kind?: "columns" | "area";
  /** Formats axis ticks and the peak label. */
  format: (value: number) => string;
  /** Accessible name, e.g. "Revenue per day". */
  label: string;
  emptyText: string;
  size?: "lg" | "sm";
}) {
  const n = points.length;
  const max = Math.max(0, ...points.map((p) => p.value));
  if (n === 0 || max === 0) {
    return <p className={`flex items-center justify-center border border-dashed border-muted/40 px-4 text-center text-sm text-muted ${size === "lg" ? "h-48" : "h-32"}`}>{emptyText}</p>;
  }

  const top = niceMax(max);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const peak = points.findIndex((p) => p.value === max);
  const y = (v: number) => 100 - (v / top) * 100;
  const height = size === "lg" ? "h-48" : "h-32";
  const items: HoverItem[] = points.map((p) => ({ title: longDate(p.date), lines: p.lines }));
  const peakCenter = ((peak + 0.5) / n) * 100;
  const peakAlign = peakCenter < 15 ? "left-0" : peakCenter > 85 ? "right-0" : "-translate-x-1/2";

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${i + 0.5} ${y(p.value)}`).join("");
  const areaPath = `${linePath}L${n - 0.5} 100L0.5 100Z`;

  return (
    <figure className="mt-4">
      <div className="flex gap-2">
        {/* y-axis */}
        <div aria-hidden="true" className={`relative w-14 shrink-0 text-right text-[0.7rem] text-muted ${height}`}>
          {(size === "lg" ? ticks : [0, 0.5, 1]).map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${t * 100}%` }}>
              {format(top * t)}
            </span>
          ))}
        </div>

        <div className={`relative flex-1 border-b border-muted/50 ${height}`}>
          <svg aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${n} 100`} preserveAspectRatio="none">
            {ticks.slice(1).map((t) => (
              <line key={t} x1="0" x2={n} y1={y(top * t)} y2={y(top * t)} className="stroke-muted/20" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            ))}
            {kind === "columns" ? (
              points.map((p, i) =>
                p.value > 0 ? <rect key={p.date} x={i + 0.18} width="0.64" y={y(p.value)} height={100 - y(p.value)} className="fill-emerald" /> : null,
              )
            ) : (
              <>
                <path d={areaPath} className="fill-emerald/10" />
                <path d={linePath} fill="none" className="stroke-emerald" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </>
            )}
          </svg>
          {/* Highest day, labelled directly */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute mb-1 text-[0.7rem] font-medium whitespace-nowrap text-emerald ${peakAlign}`}
            style={{ bottom: `${100 - y(max)}%`, ...(peakAlign === "-translate-x-1/2" ? { left: `${peakCenter}%` } : {}) }}
          >
            Peak {format(max)}
          </span>
          <ChartHover items={items} label={label} />
        </div>
      </div>

      {/* x-axis: a few dates, not all of them */}
      <div aria-hidden="true" className="relative mt-1 ml-16 h-5 text-[0.7rem] text-muted">
        {labelIndexes(n, size === "lg" ? 5 : 3).map((i, k, all) => (
          <span
            key={i}
            className={`absolute top-0 whitespace-nowrap ${k === 0 ? "left-0" : k === all.length - 1 ? "right-0" : "-translate-x-1/2"}`}
            style={k === 0 || k === all.length - 1 ? undefined : { left: `${((i + 0.5) / n) * 100}%` }}
          >
            {shortDate(points[i]!.date)}
          </span>
        ))}
      </div>
    </figure>
  );
}
