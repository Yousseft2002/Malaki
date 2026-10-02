import type { BoxSelection } from "@/lib/domain/box";
import { EightPointStar } from "@/components/ui/star";

// Distinct tones for up to six piece types; cycles after that.
const TONES = ["bg-gold text-emerald-deep", "bg-emerald text-ivory", "bg-[#8b5e34] text-ivory", "bg-emerald-soft text-sand", "bg-[#b9873a] text-emerald-deep", "bg-ink text-sand"];

/** Visual grid of the box: one slot per piece, filled in the order chosen. */
export function BoxPreview({
  capacity,
  selection,
  pieces,
}: {
  capacity: number;
  selection: BoxSelection;
  pieces: Map<string, { name: string }>;
}) {
  const ids = [...pieces.keys()];
  const slots: { id: string; name: string; tone: string }[] = [];
  for (const [itemId, qty] of Object.entries(selection)) {
    const name = pieces.get(itemId)?.name ?? "Piece";
    const tone = TONES[Math.max(ids.indexOf(itemId), 0) % TONES.length]!;
    for (let i = 0; i < qty && slots.length < capacity; i++) slots.push({ id: itemId, name, tone });
  }
  const columns = capacity <= 6 ? 3 : capacity <= 12 ? 4 : 6;

  return (
    <div
      aria-hidden="true"
      className="grid gap-1.5 border border-gold-ink bg-emerald-deep p-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: capacity }, (_, i) => {
        const slot = slots[i];
        return slot ? (
          <div key={i} className={`flex aspect-square items-center justify-center rounded-full text-[0.65rem] font-medium ${slot.tone}`} title={slot.name}>
            {slot.name.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <div key={i} className="flex aspect-square items-center justify-center rounded-full border border-dashed border-gold/40 text-gold/30">
            <EightPointStar className="h-3 w-3" />
          </div>
        );
      })}
    </div>
  );
}
