"use client";

import { useId, useState } from "react";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Price, money } from "@/components/ui/price";
import { cartDrawer } from "@/lib/cart/drawer";
import { cart } from "@/lib/cart/store";
import { GIFT_NOTE_MAX } from "@/lib/domain/pricing";

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
  const [added, setAdded] = useState(false);

  const variant = variants.find((v) => v.id === variantId);
  if (!variant) return <p className="text-muted">This product is not available right now.</p>;

  const soldOut = variant.stock <= 0;
  const unpriced = variant.priceCents === null;
  const maxQty = Math.max(1, Math.min(variant.stock, 20));
  const remaining = GIFT_NOTE_MAX - giftNote.length;

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
    setAdded(true);
    cartDrawer.open();
  }

  return (
    <div className="flex flex-col gap-7">
      <Price cents={variant.priceCents} className="font-display text-2xl text-emerald" />

      {variants.length > 1 && (
        <fieldset>
          <legend className="eyebrow mb-3 text-emerald">Box size</legend>
          <div className="flex flex-wrap gap-3">
            {variants.map((v) => (
              <label
                key={v.id}
                className={`flex min-h-11 cursor-pointer items-center gap-2 border px-4 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-emerald ${
                  v.id === variantId ? "border-emerald bg-emerald text-ivory" : "border-line text-ink hover:border-emerald"
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-variant`}
                  value={v.id}
                  checked={v.id === variantId}
                  onChange={() => {
                    setVariantId(v.id);
                    setQuantity(1);
                    setAdded(false);
                  }}
                  className="sr-only"
                />
                <span>{v.name}</span>
                {v.stock <= 0 && <span className="text-xs opacity-80">(sold out)</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div>
        <p className="eyebrow mb-3 text-emerald" id={`${id}-qty`}>
          Quantity
        </p>
        <QuantityStepper value={quantity} onChange={setQuantity} max={maxQty} label="Quantity" />
      </div>

      <div className="flex flex-col gap-4 border-y border-sand py-6">
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={giftWrap}
            onChange={(e) => setGiftWrap(e.target.checked)}
            className="h-5 w-5 accent-emerald"
          />
          <span>
            Gift wrap{giftWrapPriceCents > 0 && <span className="text-muted"> (+{money(giftWrapPriceCents)} each)</span>}
          </span>
        </label>
        <div>
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
        </div>
      </div>

      <div>
        <Button onClick={addToBag} disabled={soldOut || unpriced} className="w-full">
          {soldOut ? "Sold out" : unpriced ? "Coming soon" : "Add to bag"}
        </Button>
        <p role="status" className="mt-3 min-h-6 text-center text-sm text-emerald">
          {added ? `${product.name} added to your bag.` : ""}
        </p>
      </div>
    </div>
  );
}
