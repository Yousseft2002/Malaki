// Cart pricing. The browser never supplies prices: the server loads the
// catalogue and runs priceCart() to get the authoritative totals.

import {
  type BoxPiece,
  type BoxSelection,
  type BoxSize,
  normalizeSelection,
  priceBox,
  validateBox,
} from "./box";

export const MAX_LINE_QUANTITY = 20;
export const GIFT_NOTE_MAX = 200;

export interface CatalogVariant {
  id: string;
  productId: string;
  productName: string;
  variantName: string;
  kind: "STANDARD" | "CUSTOM_BOX";
  priceCents: number | null;
  stock: number;
  /** variant AND product active */
  isActive: boolean;
  isPerishable: boolean;
  boxCapacity: number | null;
  allowedItemIds: string[];
}

export interface Catalog {
  variants: Map<string, CatalogVariant>;
  boxItems: BoxPiece[];
}

export interface CartLine {
  variantId: string;
  quantity: number;
  giftWrap: boolean;
  giftNote?: string;
  /** CUSTOM_BOX lines only */
  box?: BoxSelection;
}

export interface PricedBoxPiece {
  boxItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface PricedLine {
  /** index of the input cart line */
  lineIndex: number;
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  giftWrap: boolean;
  giftNote?: string;
  boxContents?: PricedBoxPiece[];
  isPerishable: boolean;
}

export type CartErrorCode =
  | "EMPTY_CART"
  | "LINE_UNAVAILABLE"
  | "INVALID_QUANTITY"
  | "PRICE_MISSING"
  | "OUT_OF_STOCK"
  | "GIFT_NOTE_TOO_LONG"
  | "INVALID_BOX";

export interface CartError {
  lineIndex: number | null;
  code: CartErrorCode;
  message: string;
}

export interface PricedCart {
  ok: boolean;
  lines: PricedLine[];
  subtotalCents: number;
  giftWrapCents: number;
  /** production units (one per box / item) — counted against daily capacity */
  units: number;
  hasPerishables: boolean;
  errors: CartError[];
}

export interface PricingOptions {
  giftWrapPriceCents: number;
}

export function priceCart(lines: CartLine[], catalog: Catalog, options: PricingOptions): PricedCart {
  const errors: CartError[] = [];
  const priced: PricedLine[] = [];
  const variantUnits = new Map<string, number>();
  const reservedItemUnits: Record<string, number> = {};
  const piecesById = new Map(catalog.boxItems.map((p) => [p.id, p]));

  if (lines.length === 0) {
    errors.push({ lineIndex: null, code: "EMPTY_CART", message: "Your bag is empty." });
  }

  lines.forEach((line, i) => {
    const variant = catalog.variants.get(line.variantId);
    if (!variant || !variant.isActive) {
      errors.push({ lineIndex: i, code: "LINE_UNAVAILABLE", message: "An item in your bag is no longer available." });
      return;
    }
    const label = `${variant.productName} (${variant.variantName})`;

    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_LINE_QUANTITY) {
      errors.push({ lineIndex: i, code: "INVALID_QUANTITY", message: `Quantity for ${label} must be 1–${MAX_LINE_QUANTITY}.` });
      return;
    }
    if (line.giftNote && line.giftNote.length > GIFT_NOTE_MAX) {
      errors.push({ lineIndex: i, code: "GIFT_NOTE_TOO_LONG", message: `Gift notes are limited to ${GIFT_NOTE_MAX} characters.` });
    }

    const previousUnits = variantUnits.get(variant.id) ?? 0;
    variantUnits.set(variant.id, previousUnits + line.quantity);

    let unitPriceCents: number | null;
    let boxContents: PricedBoxPiece[] | undefined;

    if (variant.kind === "CUSTOM_BOX") {
      if (!line.box) {
        errors.push({ lineIndex: i, code: "INVALID_BOX", message: `Choose the contents of your ${variant.variantName}.` });
        return;
      }
      const selection = normalizeSelection(line.box);
      const size: BoxSize = {
        id: variant.id,
        name: variant.variantName,
        capacity: variant.boxCapacity ?? 0,
        priceCents: variant.priceCents,
        // Earlier lines of the same box size already used some boxes.
        stock: variant.stock - previousUnits,
        isActive: variant.isActive,
        allowedItemIds: variant.allowedItemIds,
      };
      const check = validateBox(size, catalog.boxItems, selection, {
        boxQuantity: line.quantity,
        reservedItemUnits,
      });
      for (const e of check.errors) {
        errors.push({
          lineIndex: i,
          code: e.code === "BOX_OUT_OF_STOCK" || e.code === "ITEM_OUT_OF_STOCK" ? "OUT_OF_STOCK" : "INVALID_BOX",
          message: e.message,
        });
      }
      if (!check.ok) return;
      for (const [itemId, qty] of Object.entries(selection)) {
        reservedItemUnits[itemId] = (reservedItemUnits[itemId] ?? 0) + qty * line.quantity;
      }
      unitPriceCents = priceBox(size, catalog.boxItems, selection).totalCents;
      boxContents = Object.entries(selection).map(([boxItemId, quantity]) => {
        const piece = piecesById.get(boxItemId)!;
        return { boxItemId, name: piece.name, quantity, unitPriceCents: piece.priceCents ?? 0 };
      });
    } else {
      if (line.box) {
        errors.push({ lineIndex: i, code: "INVALID_BOX", message: `${label} is not a build-your-own box.` });
        return;
      }
      unitPriceCents = variant.priceCents;
    }

    if (unitPriceCents === null) {
      errors.push({ lineIndex: i, code: "PRICE_MISSING", message: `${label} is not available to buy yet.` });
      return;
    }

    priced.push({
      lineIndex: i,
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.productName,
      variantName: variant.variantName,
      quantity: line.quantity,
      unitPriceCents,
      lineTotalCents: unitPriceCents * line.quantity,
      giftWrap: line.giftWrap,
      giftNote: line.giftNote?.trim() || undefined,
      boxContents,
      isPerishable: variant.isPerishable,
    });
  });

  // Standard products: total requested across all lines must fit stock.
  for (const [variantId, units] of variantUnits) {
    const variant = catalog.variants.get(variantId)!;
    if (variant.kind === "STANDARD" && units > variant.stock) {
      errors.push({
        lineIndex: null,
        code: "OUT_OF_STOCK",
        message:
          variant.stock > 0
            ? `Only ${variant.stock} × ${variant.productName} (${variant.variantName}) left in stock.`
            : `${variant.productName} (${variant.variantName}) is out of stock.`,
      });
    }
  }

  const subtotalCents = priced.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const wrappedUnits = priced.filter((l) => l.giftWrap).reduce((sum, l) => sum + l.quantity, 0);

  return {
    ok: errors.length === 0,
    lines: priced,
    subtotalCents,
    giftWrapCents: wrappedUnits * options.giftWrapPriceCents,
    units: priced.reduce((sum, l) => sum + l.quantity, 0),
    hasPerishables: priced.some((l) => l.isPerishable),
    errors,
  };
}
