import type { ReactNode } from "react";
import type { CampaignStatus } from "@/lib/ads/meta";

/** Spend vs budget: gold fill on a sand track, with the amounts as text. */
export function ProgressBar({ value, max, text }: { value: number; max: number | null; text: string }) {
  const pct = max && max > 0 ? Math.min(100, (value / max) * 100) : null;
  return (
    <div>
      <p className="text-sm text-ink">{text}</p>
      {pct !== null && (
        <span aria-hidden="true" className="mt-1.5 block h-2 bg-sand">
          <span className="block h-full bg-gold" style={{ width: `${Math.max(pct, 1.5)}%` }} />
        </span>
      )}
    </div>
  );
}

const PILLS: Record<CampaignStatus, { label: string; className: string; icon: ReactNode }> = {
  active: { label: "Active", className: "bg-emerald text-ivory", icon: <circle cx="5" cy="5" r="3.5" fill="currentColor" /> },
  paused: { label: "Paused", className: "border border-muted text-muted", icon: <path d="M2.5 1.5v7M7.5 1.5v7" stroke="currentColor" strokeWidth="2" /> },
  ended: { label: "Ended", className: "bg-sand text-ink", icon: <rect x="1.5" y="1.5" width="7" height="7" fill="currentColor" /> },
};

/** Campaign status with an icon and a word, not colour alone. */
export function StatusPill({ status }: { status: CampaignStatus }) {
  const s = PILLS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${s.className}`}>
      <svg aria-hidden="true" viewBox="0 0 10 10" className="h-2.5 w-2.5">
        {s.icon}
      </svg>
      {s.label}
    </span>
  );
}

/** "View as table": the numbers behind a chart, for screen readers and anyone who prefers rows. */
export function DataTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-emerald underline underline-offset-4">View as table</summary>
      <div className="mt-2 max-h-80 overflow-auto border border-sand">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-sand">
            <tr>
              {columns.map((c, i) => (
                <th key={c} scope="col" className={`px-3 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row[0])} className="border-t border-sand">
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="px-3 py-1.5 font-normal">
                      {cell}
                    </th>
                  ) : (
                    <td key={i} className="px-3 py-1.5 text-right tabular-nums">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** A quiet placeholder while a section loads. */
export function SectionSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="mt-4 flex flex-col gap-3">
      <span className="block h-6 w-40 animate-pulse bg-sand" />
      <span className="block h-24 animate-pulse bg-sand/70" />
      <span className="block h-24 animate-pulse bg-sand/70" />
    </div>
  );
}
