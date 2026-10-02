"use client";

import { useId, useMemo, useState } from "react";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Price, money } from "@/components/ui/price";
import { cartDrawer } from "@/lib/cart/drawer";
import { cart } from "@/lib/cart/store";
import {
  type BoxPiece,
  type BoxSelection,
  type BoxSize,
  addPieceBlocker,
  countPieces,
  eligiblePieces,
  normalizeSelection,
  priceBox,
  validateBox,
} from "@/lib/domain/box";
import { GIFT_NOTE_MAX } from "@/lib/domain/pricing";
import { BoxPreview } from "./box-preview";
import { PieceRow } from "./piece-row";

export type BuilderPiece = BoxPiece & { description: string | null; imageLabel: string | null; allergens: string | null };

export function BoxBuilder({
  product,
  sizes,
  pieces,
  giftWrapPriceCents,
}: {
  product: { slug: string; name: string; image: { url: string | null; alt: string } | null };
  sizes: BoxSize[];
  pieces: BuilderPiece[];
  giftWrapPriceCents: number;
}) {
  const id = useId();
  const [sizeId, setSizeId] = useState(sizes[0]?.id ?? "");
  const [selection, setSelection] = useState<BoxSelection>({});
  const [quantity, setQuantity] = useState(1);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [status, setStatus] = useState("");

  const size = sizes.find((s) => s.id === sizeId);
  const available = useMemo(() => (size ? eligiblePieces(size, pieces) : []), [size, pieces]);
  const byId = useMemo(() => new Map(pieces.map((p) => [p.id, p])), [pieces]);

  if (!size) return <p className="text-center text-muted">Box sizes are coming soon.</p>;

  const filled = countPieces(selection);
  const check = validateBox(size, pieces, selection, { boxQuantity: quantity });
  const price = priceBox(size, pieces, selection);

  function chooseSize(next: BoxSize) {
    setSizeId(next.id);
    setShowErrors(false);
    // Keep pieces that are still allowed, as long as they fit.
    const kept = Object.fromEntries(Object.entries(selection).filter(([itemId]) => eligiblePieces(next, pieces).some((p) => p.id === itemId)));
    setSelection(countPieces(kept) <= next.capacity ? kept : {});
  }

  function change(itemId: string, delta: number) {
    setStatus("");
    setSelection((prev) => {
      const nextQty = Math.max((prev[itemId] ?? 0) + delta, 0);
      return normalizeSelection({ ...prev, [itemId]: nextQty });
    });
  }

  function addToBag() {
    if (!size) return;
    setShowErrors(true);
    if (!check.ok || price.totalCents === null) return;
    const contents = normalizeSelection(selection);
    cart.add({
      variantId: size.id,
      productSlug: product.slug,
      productName: product.name,
      variantName: size.name,
      imageUrl: product.image?.url ?? null,
      imageAlt: product.image?.alt ?? `[PHOTO: ${product.name}]`,
      unitPriceCents: price.totalCents,
      quantity,
      giftWrap,
      giftNote: giftNote.trim() || undefined,
      box: {
        selection: contents,
        summary: Object.entries(contents).map(([itemId, qty]) => `${qty} × ${byId.get(itemId)?.name ?? "piece"}`),
      },
    });
    setSelection({});
    setQuantity(1);
    setGiftNote("");
    setGiftWrap(false);
    setShowErrors(false);
    setStatus("Your box has been added to your bag.");
    cartDrawer.open();
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-12">
        {/* Step 1 */}
        <fieldset>
          <legend className="mb-5 font-display text-2xl text-emerald">
            <span className="eyebrow mr-3 align-middle text-gold-ink">Step 1</span>Choose your box
          </legend>
          <div className="grid gap-3 min-[420px]:grid-cols-3">
            {sizes.map((s) => (
              <label
                key={s.id}
                className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 border p-4 text-center has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald ${
                  s.id === sizeId ? "border-emerald bg-emerald text-ivory" : "border-[#857a63] bg-white/40 hover:border-emerald"
                }`}
              >
                <input type="radio" name={`${id}-size`} className="sr-only" checked={s.id === sizeId} onChange={() => chooseSize(s)} />
                <span className="font-display text-lg">{s.name}</span>
                <span className={`text-sm ${s.id === sizeId ? "text-sand" : "text-muted"}`}>
                  {s.capacity} pieces · {money(s.priceCents)}
                </span>
                {s.stock <= 0 && <span className="text-xs">Sold out</span>}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Step 2 */}
        <section aria-labelledby={`${id}-fill`}>
          <h2 id={`${id}-fill`} className="mb-5 font-display text-2xl text-emerald">
            <span className="eyebrow mr-3 align-middle text-gold-ink">Step 2</span>Fill it with favourites
          </h2>
          {available.length === 0 ? (
            <p className="text-muted">No pieces are available for this box right now.</p>
          ) : (
            <ul className="divide-y divide-sand border-y border-sand">
              {available.map((piece) => (
                <li key={piece.id}>
                  <PieceRow
                    piece={piece}
                    count={selection[piece.id] ?? 0}
                    blocker={addPieceBlocker(size, pieces, selection, piece.id)?.message ?? null}
                    onAdd={() => change(piece.id, 1)}
                    onRemove={() => change(piece.id, -1)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Step 3 */}
        <fieldset>
          <legend className="mb-5 font-display text-2xl text-emerald">
            <span className="eyebrow mr-3 align-middle text-gold-ink">Step 3</span>Make it a gift
          </legend>
          <label className="mb-4 flex min-h-11 cursor-pointer items-center gap-3">
            <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} className="h-5 w-5 accent-emerald" />
            <span>
              Gift wrap{giftWrapPriceCents > 0 && <span className="text-muted"> (+{money(giftWrapPriceCents)} each)</span>}
            </span>
          </label>
          <label htmlFor={`${id}-note`} className="mb-1.5 block text-sm font-medium">
            Gift note <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id={`${id}-note`}
            value={giftNote}
            onChange={(e) => setGiftNote(e.target.value.slice(0, GIFT_NOTE_MAX))}
            maxLength={GIFT_NOTE_MAX}
            rows={3}
            aria-describedby={`${id}-note-count`}
            className="field-input"
          />
          <p id={`${id}-note-count`} className="mt-1 text-right text-sm text-muted">
            {GIFT_NOTE_MAX - giftNote.length} characters left
          </p>
        </fieldset>
      </div>

      {/* Live preview & total */}
      <aside aria-labelledby={`${id}-summary`} className="h-fit bg-sand p-6 lg:sticky lg:top-28">
        <h2 id={`${id}-summary`} className="eyebrow mb-5 text-emerald">
          Your {size.name}
        </h2>
        <BoxPreview capacity={size.capacity} selection={selection} pieces={byId} />
        <p className="mt-4 text-center" aria-live="polite">
          <strong className="font-medium">{filled}</strong> of {size.capacity} pieces
          {check.remaining > 0 ? ` · ${check.remaining} to go` : filled === size.capacity ? " · complete" : ""}
        </p>

        <dl className="mt-6 grid grid-cols-[1fr_auto] gap-y-1 border-t border-[#d8ccb0] pt-4 text-sm">
          <dt>Box</dt>
          <dd className="text-right">{money(price.boxCents)}</dd>
          <dt>Pieces</dt>
          <dd className="text-right">{money(price.piecesCents)}</dd>
          <dt className="mt-2 font-display text-lg text-emerald">Total per box</dt>
          <dd className="mt-2 text-right font-display text-lg text-emerald" aria-live="polite">
            <Price cents={price.totalCents} />
          </dd>
        </dl>

        <div className="mt-6 flex items-center justify-between gap-4">
          <span className="text-sm">Number of boxes</span>
          <QuantityStepper value={quantity} onChange={setQuantity} label="Number of boxes" />
        </div>

        {showErrors && check.errors.length > 0 && (
          <ul role="alert" className="mt-4 space-y-1 text-sm text-error">
            {check.errors.map((e) => (
              <li key={e.code + (e.itemId ?? "")}>{e.message}</li>
            ))}
          </ul>
        )}
        {price.totalCents === null && filled > 0 && (
          <p className="mt-4 text-sm text-muted">Some prices haven&apos;t been set yet, so this box can&apos;t be ordered.</p>
        )}

        <Button onClick={addToBag} className="mt-6 w-full" disabled={price.totalCents === null}>
          Add box to bag
        </Button>
        {filled > 0 && (
          <Button variant="ghost" className="mt-2 w-full" onClick={() => setSelection({})}>
            Empty the box
          </Button>
        )}
        <p role="status" className="mt-2 text-center text-sm text-emerald">
          {status}
        </p>
      </aside>
    </div>
  );
}
