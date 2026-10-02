/**
 * KPI tile: the value and its change vs the previous period, with an arrow and
 * words (never colour alone). A null value shows `missing` ("-" or "Not connected").
 */
export function StatTile({
  label,
  value,
  change,
  missing = "-",
  periodLabel,
  note,
}: {
  label: string;
  value: string | null;
  /** Formatted change such as "+12%"; null = nothing to compare; undefined = don't show. */
  change?: string | null;
  missing?: string;
  periodLabel: string;
  note?: string;
}) {
  const up = change?.startsWith("+");
  const down = change?.startsWith("−");
  return (
    <div className="h-full border border-sand bg-ivory p-3 sm:p-4">
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className={`mt-1 font-display ${value === null ? "text-lg text-muted" : "text-xl break-words text-emerald sm:text-2xl"}`}>{value ?? missing}</p>
      {value !== null && change !== undefined && (
        <p className={`mt-1 text-xs ${up ? "text-emerald" : "text-muted"}`}>
          {change === null ? (
            `No data for the previous ${periodLabel}`
          ) : (
            <>
              <span aria-hidden="true">{up ? "▲ " : down ? "▼ " : "■ "}</span>
              {up ? "Up" : down ? "Down" : "Level"} {change.replace(/^[+−±]/, "")} vs previous {periodLabel}
            </>
          )}
        </p>
      )}
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}
