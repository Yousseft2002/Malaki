"use client";

import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { money } from "@/components/ui/price";
import type { BuilderPiece } from "./box-builder";

export function PieceRow({
  piece,
  count,
  blocker,
  onAdd,
  onRemove,
}: {
  piece: BuilderPiece;
  count: number;
  blocker: string | null;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const soldOut = piece.stock <= 0;
  const btn =
    "inline-flex h-11 w-11 items-center justify-center border border-emerald text-lg text-emerald hover:bg-emerald hover:text-ivory disabled:border-line disabled:text-muted disabled:opacity-50 disabled:hover:bg-transparent";
  return (
    <div className="flex items-center gap-4 py-4">
      <ImagePlaceholder label={piece.imageLabel ?? piece.name} className="h-16 w-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg text-emerald">{piece.name}</h3>
        <p className="text-sm text-muted">
          {money(piece.priceCents)} each{soldOut && " · Sold out"}
        </p>
        {piece.description && <p className="text-sm text-muted">{piece.description}</p>}
        {piece.allergens && <p className="text-xs text-muted">Allergens: {piece.allergens}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`${piece.name} quantity`}>
        <button type="button" className={btn} onClick={onRemove} disabled={count === 0} aria-label={`Remove one ${piece.name}`}>
          −
        </button>
        <span className="w-8 text-center tabular-nums" aria-live="polite" aria-label={`${count} ${piece.name} in box`}>
          {count}
        </span>
        <button
          type="button"
          className={btn}
          onClick={onAdd}
          disabled={blocker !== null}
          aria-label={`Add one ${piece.name}`}
          title={blocker ?? undefined}
        >
          +
        </button>
      </div>
    </div>
  );
}
