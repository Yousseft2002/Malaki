const STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-sand text-muted",
  PAID: "bg-gold text-emerald-deep",
  PACKED: "bg-emerald-soft text-ivory",
  SHIPPED: "bg-emerald text-ivory",
  CANCELLED: "bg-error/15 text-error",
  NEW: "bg-gold text-emerald-deep",
  IN_PROGRESS: "bg-emerald-soft text-ivory",
  CLOSED: "bg-sand text-muted",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium tracking-wide ${STYLES[status] ?? "bg-sand text-ink"}`}>
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}
