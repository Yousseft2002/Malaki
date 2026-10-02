import { EightPointStar } from "@/components/ui/star";

/**
 * Stand-in "piece" artwork until real photos exist: an embossed sweet in one
 * of six palette finishes, chosen by the piece's position in the list so each
 * kind of piece is recognisable in the box.
 */
const FINISHES = [
  { base: "var(--color-gold)", edge: "var(--color-gold-ink)", star: "text-gold-ink/70" },
  { base: "var(--color-sand)", edge: "var(--color-gold-ink)", star: "text-gold-ink/60" },
  { base: "var(--color-emerald-soft)", edge: "var(--color-gold)", star: "text-gold" },
  { base: "var(--color-ivory)", edge: "var(--color-emerald)", star: "text-emerald/60" },
  { base: "var(--color-emerald-deep)", edge: "var(--color-gold)", star: "text-gold/80" },
  { base: "var(--color-gold-light)", edge: "var(--color-emerald)", star: "text-emerald/50" },
];

export function finishFor(index: number) {
  return FINISHES[index % FINISHES.length]!;
}

export function PieceToken({ finish, className = "" }: { finish: number; className?: string }) {
  const f = finishFor(finish);
  return (
    <span
      aria-hidden="true"
      className={`relative flex aspect-square items-center justify-center rounded-full ${className}`}
      style={{
        background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, var(--color-ivory) 55%, ${f.base}) 0%, ${f.base} 45%, color-mix(in srgb, ${f.edge} 35%, ${f.base}) 100%)`,
        boxShadow: `inset 0 -3px 6px color-mix(in srgb, ${f.edge} 35%, transparent), 0 4px 8px -4px color-mix(in srgb, var(--color-emerald-deep) 70%, transparent)`,
      }}
    >
      <span className="absolute inset-[14%] rounded-full border border-dashed opacity-40" style={{ borderColor: f.edge }} />
      <EightPointStar className={`h-[38%] w-[38%] ${f.star}`} />
    </span>
  );
}
