/**
 * Native <details> accordion: keyboard and screen-reader accessible without
 * JS. Opening animates smoothly where the browser supports animating to
 * `height: auto` (::details-content + interpolate-size); the content always
 * fades/rises in. The + turns into a ×.
 */
export function AccordionItem({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="accordion group border-b border-hairline" open={defaultOpen}>
      <summary className="flex min-h-14 items-center justify-between gap-4 py-4 text-left transition-colors hover:text-gold-ink">
        <span className="eyebrow text-emerald">{title}</span>
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gold-ink/40 text-lg leading-none text-gold-ink transition-transform duration-500 ease-[var(--ease-bounce)] group-open:rotate-[135deg]"
        >
          +
        </span>
      </summary>
      <div className="accordion-body pb-6 whitespace-pre-line text-muted">{children}</div>
    </details>
  );
}
