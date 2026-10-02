export type BarItem = { label: string; value: string; share: number };

/** A short ranked list with a thin bar under each row (share of the total). */
export function BarList({ items, label, emptyText }: { items: BarItem[]; label: string; emptyText: string }) {
  if (items.length === 0) return <p className="mt-3 text-sm text-muted">{emptyText}</p>;
  return (
    <ol aria-label={label} className="mt-3 flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.label} className="text-sm">
          <span className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-ink" title={item.label}>
              {item.label}
            </span>
            <span className="shrink-0 text-muted tabular-nums">{item.value}</span>
          </span>
          <span aria-hidden="true" className="mt-1 block h-1.5 bg-sand">
            <span className="block h-full bg-emerald" style={{ width: `${Math.max(2, Math.min(100, item.share))}%` }} />
          </span>
        </li>
      ))}
    </ol>
  );
}
