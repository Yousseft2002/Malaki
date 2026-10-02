import { EightPointStar } from "./star";

/**
 * Labelled stand-in for photography that doesn't exist yet. Renders the label
 * visibly so it's obvious which shot is needed where. An empty label renders a
 * decorative (aria-hidden) tile, e.g. for gallery thumbnails.
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
  const decorative = label === "";
  const text = decorative ? "" : label.startsWith("[") ? label : `[IMAGE: ${label}]`;
  return (
    <div
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : text}
      aria-hidden={decorative ? true : undefined}
      className={`relative flex items-center justify-center overflow-hidden ${colors} ${className}`}
    >
      <div className="absolute inset-3 border border-current opacity-20" aria-hidden="true" />
      <div className="flex max-w-[80%] flex-col items-center gap-3 text-center" aria-hidden="true">
        <EightPointStar className={`h-6 w-6 ${tone === "emerald" ? "text-gold" : "text-gold-ink"} opacity-60`} />
        {text && <span className="text-xs leading-snug tracking-wide">{text}</span>}
      </div>
    </div>
  );
}
