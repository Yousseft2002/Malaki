"use client";

import { LayoutGroup, motion } from "motion/react";
import { useId, useState } from "react";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { AddToBagButton } from "@/components/motion/add-to-bag-feedback";
import { spring } from "@/components/motion/tokens";
import { money } from "@/components/ui/price";
import { cartDrawer } from "@/lib/cart/drawer";
import { cart } from "@/lib/cart/store";
import { GIFT_NOTE_MAX } from "@/lib/domain/pricing";
import { GiftBoxPreview, GiftNoteCard } from "./gift-preview";

export type PanelVariant = { id: string; name: string; priceCents: number | null; stock: number };

export function PurchasePanel({
  product,
  variants,
  giftWrapPriceCents,
}: {
  product: { slug: string; name: string; image: { url: string | null; alt: string } | null };
  variants: PanelVariant[];
  giftWrapPriceCents: number;
}) {
  const id = useId();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [status, setStatus] = useState("");

  const variant = variants.find((v) => v.id === variantId);
  if (!variant) return <p className="text-muted">This product is not available right now.</p>;

  const soldOut = variant.stock <= 0;
  const unpriced = variant.priceCents === null;
  const maxQty = Math.max(1, Math.min(variant.stock, 20));
  const remaining = GIFT_NOTE_MAX - giftNote.length;
  const lineTotal = variant.priceCents === null ? null : variant.priceCents * Math.min(quantity, maxQty);

  function addToBag() {
    if (!variant || soldOut || unpriced) return;
    cart.add({
      variantId: variant.id,
      productSlug: product.slug,
      productName: product.name,
      variantName: variant.name,
      imageUrl: product.image?.url ?? null,
      imageAlt: product.image?.alt ?? `[PHOTO: ${product.name}]`,
      unitPriceCents: variant.priceCents,
      quantity: Math.min(quantity, maxQty),
      giftWrap,
      giftNote: giftNote.trim() || undefined,
    });
    setStatus(`${product.name} added to your bag.`);
    cartDrawer.open();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Price: rolls softly when the size changes */}
      <div className="flex items-baseline justify-between gap-4">
        <p className="overflow-hidden font-display text-3xl text-emerald sm:text-4xl" aria-live="polite">
          <span key={variant.id} className="num-roll-up inline-block">
            {money(variant.priceCents)}
          </span>
        </p>
        <p className={`eyebrow ${soldOut ? "text-error" : "text-gold-ink"}`}>{soldOut ? "Sold out" : unpriced ? "Coming soon" : "Available"}</p>
      </div>

      {variants.length > 1 && (
        <fieldset>
          <legend className="eyebrow mb-3 text-emerald">Choose your box</legend>
          <LayoutGroup id={id}>
            <div className="grid grid-cols-2 gap-3">
              {variants.map((v, i) => {
                const selected = v.id === variantId;
                return (
                  <label
                    key={v.id}
                    className={`relative isolate flex min-h-24 cursor-pointer flex-col items-center justify-end gap-2 border px-3 pt-3 pb-3 text-center transition-[transform,border-color] duration-200 active:scale-[0.97] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald ${
                      selected ? "border-emerald" : "border-line hover:border-emerald"
                    }`}
                  >
                    {selected && (
                      <motion.span layoutId="variant-highlight" transition={spring.soft} className="absolute inset-0 -z-10 bg-emerald" aria-hidden="true" />
                    )}
                    <input
                      type="radio"
                      name={`${id}-variant`}
                      value={v.id}
                      checked={selected}
                      onChange={() => {
                        setVariantId(v.id);
                        setQuantity(1);
                        setStatus("");
                      }}
                      className="sr-only"
                    />
                    {/* A box that grows with the size */}
                    <span aria-hidden="true" className="flex items-end">
                      <span
                        className={`block border transition-transform duration-500 ease-[var(--ease-bounce)] ${selected ? "-translate-y-1 border-gold bg-emerald-deep" : "border-gold-ink/60 bg-sand"}`}
                        style={{ width: 22 + i * 12, height: 14 + i * 6 }}
                      />
                    </span>
                    <span className={`font-display text-lg leading-tight ${selected ? "text-ivory" : "text-emerald"}`}>{v.name}</span>
                    <span className={`text-sm ${selected ? "text-sand" : "text-muted"}`}>{v.stock <= 0 ? "Sold out" : money(v.priceCents)}</span>
                  </label>
                );
              })}
            </div>
          </LayoutGroup>
        </fieldset>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow text-emerald">Quantity</p>
        <QuantityStepper value={quantity} onChange={setQuantity} max={maxQty} label="Quantity" />
      </div>

      {/* Gifting */}
      <div className="border-y border-hairline py-6">
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

        <div className="mt-6">
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
            className="field-input resize-y"
            placeholder="Write a message to include with the gift"
          />
          <p id={`${id}-note-count`} className="mt-1 text-right text-sm text-muted" aria-live={remaining <= 20 ? "polite" : "off"}>
            {remaining} characters left
          </p>
          <GiftNoteCard note={giftNote} />
        </div>
      </div>

      <div>
        <AddToBagButton onAdd={addToBag} disabled={soldOut || unpriced} className="w-full" addedLabel="Added to your bag">
          {soldOut ? (
            "Sold out"
          ) : unpriced ? (
            "Coming soon"
          ) : (
            <span className="inline-flex items-center gap-3">
              Add to bag
              <span aria-hidden="true" className="h-4 w-px bg-ivory/40" />
              <span className="tracking-normal normal-case">{money(lineTotal)}</span>
            </span>
          )}
        </AddToBagButton>
        <p role="status" className="mt-3 min-h-6 text-center text-sm text-emerald">
          {status}
        </p>
      </div>
    </div>
  );
}
