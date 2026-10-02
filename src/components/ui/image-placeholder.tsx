import { EightPointStar } from "./star";

/**
 * Labelled stand-in for photography that doesn't exist yet. Renders the label
 * visibly so it's obvious which shot is needed where.
 */
export function ImagePlaceholder({
  label,
  className = "",
  tone = "sand",
}: {
  label: string;
  className?: string;
  tone?: "sand" | "emerald";
}) {
  const colors = tone === "emerald" ? "bg-emerald-soft text-sand" : "bg-sand text-muted";
  const text = label.startsWith("[") ? label : `[IMAGE: ${label}]`;
  return (
    <div role="img" aria-label={text} className={`relative flex items-center justify-center overflow-hidden ${colors} ${className}`}>
      <div className="absolute inset-3 border border-current opacity-20" aria-hidden="true" />
      <div className="flex max-w-[80%] flex-col items-center gap-3 text-center">
        <EightPointStar className={`h-6 w-6 ${tone === "emerald" ? "text-gold" : "text-gold-ink"} opacity-60`} />
        <span className="text-xs leading-snug tracking-wide" aria-hidden="true">
          {text}
        </span>
      </div>
    </div>
  );
}
