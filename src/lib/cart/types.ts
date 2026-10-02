import { z } from "zod";
import { normalizeSelection } from "@/lib/domain/box";
import { GIFT_NOTE_MAX } from "@/lib/domain/pricing";

export const cartItemSchema = z.object({
  id: z.string(),
  variantId: z.string(),
  productSlug: z.string(),
  productName: z.string(),
  variantName: z.string(),
  imageUrl: z.string().nullable().optional(),
  imageAlt: z.string(),
  /** Display snapshot only. Never sent to or trusted by the server. */
  unitPriceCents: z.number().int().nullable(),
  quantity: z.number().int().min(1),
  giftWrap: z.boolean(),
  giftNote: z.string().max(GIFT_NOTE_MAX).optional(),
  box: z
    .object({
      selection: z.record(z.string(), z.number().int().min(0)),
      summary: z.array(z.string()),
    })
    .optional(),
});

export type CartItem = z.infer<typeof cartItemSchema>;

/** Two cart entries are merged when they are the same configured product. */
export function sameConfiguration(a: Omit<CartItem, "id">, b: Omit<CartItem, "id">): boolean {
  return (
    a.variantId === b.variantId &&
    a.giftWrap === b.giftWrap &&
    (a.giftNote ?? "") === (b.giftNote ?? "") &&
    JSON.stringify(a.box ? normalizeSelection(a.box.selection) : null) ===
      JSON.stringify(b.box ? normalizeSelection(b.box.selection) : null)
  );
}

/** The minimal line the server needs: no names, no prices. */
export function toCartLine(item: CartItem) {
  return {
    variantId: item.variantId,
    quantity: item.quantity,
    giftWrap: item.giftWrap,
    giftNote: item.giftNote,
    box: item.box?.selection,
  };
}
