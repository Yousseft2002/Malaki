"use client";

import { LayoutGroup, MotionConfig, motion } from "motion/react";
import { useId, useMemo, useRef, useState } from "react";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { AddToBagButton } from "@/components/motion/add-to-bag-feedback";
import { spring } from "@/components/motion/tokens";
import { GiftBoxPreview, GiftNoteCard } from "@/components/product/gift-preview";
import { money } from "@/components/ui/price";
import { CloseButton, Sheet } from "@/components/ui/sheet";
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
import { MalakiBox, type Placement } from "./malaki-box";
import { PieceRow } from "./piece-row";
import { StarProgress } from "./star-progress";

export type BuilderPiece = BoxPiece & { description: string | null; imageLabel: string | null; allergens: string | null };

/**
 * Build-your-own-box. All rules (capacity, eligibility, stock, pricing,
 * validation) come from the pure functions in lib/domain/box — this component
 * only keeps UI state and animates in response to it.
 */
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
  // Visual only: the order pieces were placed, so each lands in its own slot.
  const [placements, setPlacements] = useState<Placement[]>([]);
  const nextKey = useRef(0);
  const [quantity, setQuantity] = useState(1);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [status, setStatus] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [peek, setPeek] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const size = sizes.find((s) => s.id === sizeId);
  const available = useMemo(() => (size ? eligiblePieces(size, pieces) : []), [size, pieces]);
  const finishIndex = useMemo(() => new Map(pieces.map((p, i) => [p.id, i])), [pieces]);

  if (!size) return <p className="text-center text-muted">Box sizes are coming soon.</p>;

  const filled = countPieces(selection);
  const check = validateBox(size, pieces, selection, { boxQuantity: quantity });
  const price = priceBox(size, pieces, selection);
  const complete = filled === size.capacity;
  const nameOf = (itemId: string) => pieces.find((p) => p.id === itemId)?.name ?? "piece";

  function chooseSize(next: BoxSize) {
    setSizeId(next.id);
    setShowErrors(false);
    setPeek(false);
    // Keep pieces that are still allowed, as long as they fit.
    const allowed = new Set(eligiblePieces(next, pieces).map((p) => p.id));
    const kept = Object.fromEntries(Object.entries(selection).filter(([itemId]) => allowed.has(itemId)));
    if (countPieces(kept) <= next.capacity) {
      setSelection(kept);
      setPlacements((prev) => prev.filter((p) => allowed.has(p.itemId)));
    } else {
      setSelection({});
      setPlacements([]);
    }
  }

  function change(itemId: string, delta: 1 | -1) {
    if (!size) return;
    setStatus("");
    const current = selection[itemId] ?? 0;
    const nextCount = Math.max(current + delta, 0);
    const nextFilled = filled - current + nextCount;
    setSelection(normalizeSelection({ ...selection, [itemId]: nextCount }));
    if (delta > 0) {
      setPlacements((prev) => [...prev, { key: `p${nextKey.current++}`, itemId }]);
    } else {
      setPlacements((prev) => {
        const i = prev.map((p) => p.itemId).lastIndexOf(itemId);
        return i < 0 ? prev : [...prev.slice(0, i), ...prev.slice(i + 1)];
      });
    }
    if (nextFilled === size.capacity) setPeek(false);
    const name = nameOf(itemId);
    setAnnouncement(
      nextFilled === size.capacity && delta > 0
        ? `Added ${name}. Your box is complete — ${size.capacity} of ${size.capacity} pieces.`
        : `${delta > 0 ? "Added" : "Removed"} ${name}. ${nextFilled} of ${size.capacity} pieces.`,
    );
  }

  function emptyBox() {
    setSelection({});
    setPlacements([]);
    setPeek(false);
    setAnnouncement("Your box is empty.");
  }

  function validate() {
    setShowErrors(true);
    return check.ok && price.totalCents !== null;
  }

  function addToBag() {
    if (!size || !check.ok || price.totalCents === null) return;
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
        // In the same order as the pieces are listed in the builder.
        summary: pieces.filter((p) => contents[p.id]).map((p) => `${contents[p.id]} × ${p.name}`),
      },
    });
    setSelection({});
    setPlacements([]);
    setQuantity(1);
    setGiftNote("");
    setGiftWrap(false);
    setShowErrors(false);
    setPeek(false);
    setSheetOpen(false);
    setStatus("Your box has been added to your bag.");
    cartDrawer.open();
  }

  const progressText = (
    <>
      <strong className="font-medium">{filled}</strong> of {size.capacity} pieces
      {check.remaining > 0 ? ` · ${check.remaining} to go` : complete ? " · complete" : ""}
    </>
  );

  /** The box + totals + add button; shown in the desktop aside and the mobile sheet. */
  const summary = (where: "aside" | "sheet") => (
    <>
      <MalakiBox
        capacity={size.capacity}
        placements={placements}
        finishOf={(itemId) => finishIndex.get(itemId) ?? 0}
        complete={complete}
        peek={peek}
        size={where === "aside" ? "lg" : "sm"}
      />
      <StarProgress filled={filled} capacity={size.capacity} className="mt-6" />
      <p className="mt-3 text-center">{progressText}</p>
      {complete && (
        <div className="mt-1 text-center">
          <button type="button" onClick={() => setPeek((p) => !p)} className="link-inline min-h-11 px-2 text-sm text-gold-ink" aria-pressed={peek}>
            {peek ? "Close the lid" : "Peek inside"}
          </button>
        </div>
      )}

      <dl className="mt-5 grid grid-cols-[1fr_auto] gap-y-1 border-t border-hairline pt-4 text-sm">
        <dt>Box</dt>
        <dd className="text-right">{money(price.boxCents)}</dd>
        <dt>Pieces</dt>
        <dd className="text-right">{money(price.piecesCents)}</dd>
        <dt className="mt-2 font-display text-lg text-emerald">Total per box</dt>
        <dd className="mt-2 overflow-hidden text-right font-display text-lg text-emerald">
          <span key={price.totalCents ?? "none"} className="num-roll-up inline-block">
            {money(price.totalCents)}
          </span>
        </dd>
      </dl>

      <div className="mt-5 flex items-center justify-between gap-4">
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

      <AddToBagButton
        onAdd={addToBag}
        validate={validate}
        disabled={price.totalCents === null}
        pulse={complete && check.ok}
        className="mt-6 w-full"
        addedLabel="Box added"
      >
        Add box to bag
      </AddToBagButton>
      {filled > 0 && (
        <button type="button" onClick={emptyBox} className="mt-2 min-h-11 w-full text-sm text-muted transition-colors hover:text-emerald">
          Empty the box
        </button>
      )}
    </>
  );

  return (
    <MotionConfig reducedMotion="user">
    <div className="grid gap-12 pb-28 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:pb-0">
      {/* Screen-reader announcements for every addition, removal and completion */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <div className="flex flex-col gap-14">
        {/* Step 1 — box size */}
        <fieldset>
          <legend className="mb-5 font-display text-2xl text-emerald">
            <span className="eyebrow mr-3 align-middle text-gold-ink">Step 1</span>Choose your box
          </legend>
          <LayoutGroup id={`${id}-sizes`}>
            <div className="grid grid-cols-3 gap-3">
              {sizes.map((s) => {
                const selected = s.id === sizeId;
                return (
                  <label
                    key={s.id}
                    className={`relative isolate flex min-h-32 cursor-pointer flex-col items-center justify-end gap-1 border p-3 text-center transition-[transform,border-color] duration-200 active:scale-[0.97] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald ${
                      selected ? "border-emerald" : "border-line hover:border-emerald"
                    }`}
                  >
                    {selected && <motion.span layoutId="size-highlight" transition={spring.soft} aria-hidden="true" className="absolute inset-0 -z-10 bg-emerald" />}
                    <input type="radio" name={`${id}-size`} className="sr-only" checked={selected} onChange={() => chooseSize(s)} />
                    {/* A little box with its slots, growing with capacity */}
                    <span
                      aria-hidden="true"
                      className={`mb-2 grid gap-0.5 border p-1 transition-transform duration-500 ease-[var(--ease-bounce)] ${selected ? "-translate-y-1 border-gold bg-emerald-deep" : "border-gold-ink/50 bg-sand"}`}
                      style={{ gridTemplateColumns: `repeat(${s.capacity <= 6 ? 3 : s.capacity <= 12 ? 4 : 6}, 0.4rem)` }}
                    >
                      {Array.from({ length: Math.min(s.capacity, 24) }, (_, k) => (
                        <span key={k} className={`h-[0.4rem] w-[0.4rem] rounded-full ${selected ? "bg-gold/70" : "bg-gold-ink/30"}`} />
                      ))}
                    </span>
                    <span className={`font-display text-lg leading-tight ${selected ? "text-ivory" : "text-emerald"}`}>{s.name}</span>
                    <span className={`text-xs sm:text-sm ${selected ? "text-sand" : "text-muted"}`}>
                      {s.capacity} pieces · {money(s.priceCents)}
                    </span>
                    {s.stock <= 0 && <span className={`text-xs ${selected ? "text-sand" : "text-error"}`}>Sold out</span>}
                  </label>
                );
              })}
            </div>
          </LayoutGroup>
        </fieldset>

        {/* Step 2 — pieces */}
        <section aria-labelledby={`${id}-fill`}>
          <h2 id={`${id}-fill`} className="mb-2 font-display text-2xl text-emerald">
            <span className="eyebrow mr-3 align-middle text-gold-ink">Step 2</span>Fill it with favorites
          </h2>
          <p className="mb-5 text-sm text-muted">Tap + to place a piece in your box.</p>
          {available.length === 0 ? (
            <p className="text-muted">No pieces are available for this box right now.</p>
          ) : (
            <ul className="grid gap-3">
              {available.map((piece) => (
                <li key={piece.id}>
                  <PieceRow
                    piece={piece}
                    finish={finishIndex.get(piece.id) ?? 0}
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

        {/* Step 3 — gifting */}
        <fieldset>
          <legend className="mb-5 font-display text-2xl text-emerald">
            <span className="eyebrow mr-3 align-middle text-gold-ink">Step 3</span>Make it a gift
          </legend>
          <div className="flex items-center gap-5">
            <GiftBoxPreview wrapped={giftWrap} />
            <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="block font-display text-lg text-emerald">Gift wrap</span>
                <span className="text-sm text-muted">{giftWrapPriceCents > 0 ? `+${money(giftWrapPriceCents)} each` : "[GIFT WRAP DESCRIPTION]"}</span>
              </span>
              <input type="checkbox" role="switch" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} className="peer sr-only" />
              <span
                aria-hidden="true"
                className="relative h-7 w-12 shrink-0 rounded-full bg-muted/60 transition-colors duration-300 peer-checked:bg-emerald peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-ivory after:shadow after:transition-transform after:duration-300 after:ease-[var(--ease-bounce)] peer-checked:after:translate-x-5"
              />
            </label>
          </div>
          <label htmlFor={`${id}-note`} className="mt-6 mb-1.5 block text-sm font-medium">
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
          <GiftNoteCard note={giftNote} />
        </fieldset>
      </div>

      {/* Desktop: the large sticky box */}
      <aside aria-labelledby={`${id}-summary`} className="hidden h-fit bg-sand p-6 lg:sticky lg:top-24 lg:block xl:p-8">
        <h2 id={`${id}-summary`} className="eyebrow mb-6 text-center text-emerald">
          Your {size.name}
        </h2>
        {summary("aside")}
        <p role="status" className="mt-2 min-h-6 text-center text-sm text-emerald">
          {status}
        </p>
      </aside>

      {/* Mobile: compact box pinned to the bottom of the screen; tap to open the full box */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/40 bg-emerald text-ivory shadow-[0_-12px_30px_-16px_var(--color-emerald-deep)] lg:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          className="flex min-h-16 w-full items-center gap-4 px-5 py-3 text-left transition-transform active:scale-[0.99]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm">
              {filled} of {size.capacity} pieces{complete ? " · complete" : ""}
            </span>
            <span className="mt-1 block overflow-hidden">
              <StarProgress filled={filled} capacity={size.capacity} className="!justify-start [&>span]:h-3 [&>span]:w-3 [&_svg]:h-3 [&_svg]:w-3" />
            </span>
          </span>
          <span className="text-right">
            <span className="block font-display text-lg">{money(price.totalCents)}</span>
            <span className={`eyebrow inline-block text-[0.65rem] text-gold ${complete ? "animate-[pulse-gold_1.6s_var(--ease-in-out)_3]" : ""}`}>
              {complete ? "Review & add" : "View box"} ▴
            </span>
          </span>
        </button>
        <p role="status" className="sr-only">
          {status}
        </p>
      </div>
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} side="bottom" label="Your box">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-2">
          <h2 className="font-display text-xl text-emerald">Your {size.name}</h2>
          <CloseButton onClick={() => setSheetOpen(false)} label="Close box" />
        </div>
        <div className="overflow-y-auto px-5 py-6">{summary("sheet")}</div>
      </Sheet>
    </div>
    </MotionConfig>
  );
}
