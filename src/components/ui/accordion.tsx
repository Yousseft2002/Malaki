/** Native <details> accordion: keyboard and screen-reader accessible without JS. */
export function AccordionItem({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-b border-sand" open={defaultOpen}>
      <summary className="flex min-h-14 items-center justify-between gap-4 py-4 text-left">
        <span className="eyebrow text-emerald">{title}</span>
        <span aria-hidden="true" className="text-xl leading-none text-gold-ink transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="pb-6 whitespace-pre-line text-muted">{children}</div>
    </details>
  );
}
