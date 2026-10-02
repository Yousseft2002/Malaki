"use client";

import { money } from "@/components/ui/price";
import type { BuilderPiece } from "./box-builder";
import { PieceToken } from "./piece-token";

/** One piece you can add: artwork, details and a tactile − count + control. */
export function PieceRow({
  piece,
  finish,
  count,
  blocker,
  onAdd,
  onRemove,
}: {
  piece: BuilderPiece;
  finish: number;
  count: number;
  blocker: string | null;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const soldOut = piece.stock <= 0;
  const btn =
    "inline-flex h-11 w-11 items-center justify-center border text-lg transition-[transform,background-color,color] duration-150 active:scale-90 disabled:cursor-not-allowed disabled:active:scale-100";
  const selected = count > 0;
  return (
    <div
      className={`group flex h-full items-center gap-4 border p-3 transition-[border-color,background-color,transform] duration-300 ${
        selected ? "border-gold bg-sand/70" : "border-hairline bg-ivory hover:border-gold/70"
      }`}
    >
      <div className="relative w-16 shrink-0">
        <PieceToken finish={finish} className={`w-full transition-transform duration-500 ease-[var(--ease-bounce)] ${selected ? "rotate-6" : "group-hover:-rotate-6"}`} />
        {selected && (
          <span
            key={count}
            aria-hidden="true"
            className="bump absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald px-1 text-xs font-semibold text-ivory ring-2 ring-ivory"
          >
            {count}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg leading-tight text-emerald">{piece.name}</h3>
        <p className="text-sm text-muted">
          {money(piece.priceCents)} each{soldOut && " · Sold out"}
        </p>
        {piece.description && <p className="text-sm text-muted">{piece.description}</p>}
        {piece.allergens && <p className="text-xs text-muted">Allergens: {piece.allergens}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1 min-[400px]:flex-row" role="group" aria-label={`${piece.name} quantity`}>
        <button
          type="button"
          className={`${btn} border-line text-emerald hover:bg-sand disabled:text-muted/40 disabled:hover:bg-transparent`}
          onClick={onRemove}
          disabled={count === 0}
          aria-label={`Remove one ${piece.name}`}
        >
          <span aria-hidden="true">−</span>
        </button>
        <button
          type="button"
          className={`${btn} border-emerald bg-emerald text-ivory hover:bg-emerald-deep disabled:border-line disabled:bg-transparent disabled:text-muted/40`}
          onClick={onAdd}
          disabled={blocker !== null}
          aria-label={`Add one ${piece.name}`}
          title={blocker ?? undefined}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}
