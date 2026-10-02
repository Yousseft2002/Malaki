// Build-your-own-box rules. Pure functions: the box builder UI uses them for
// live feedback and the server re-runs them at checkout with fresh stock.

export interface BoxSize {
  id: string;
  name: string;
  capacity: number;
  priceCents: number | null;
  stock: number;
  isActive: boolean;
  /** Item ids allowed in this box. Empty = every active item. */
  allowedItemIds: string[];
}

export interface BoxPiece {
  id: string;
  name: string;
  priceCents: number | null;
  stock: number;
  maxPerBox: number | null;
  isActive: boolean;
}

/** itemId → number of pieces in ONE box */
export type BoxSelection = Record<string, number>;

export type BoxErrorCode =
  | "BOX_UNAVAILABLE"
  | "BOX_OUT_OF_STOCK"
  | "ITEM_NOT_FOUND"
  | "ITEM_UNAVAILABLE"
  | "ITEM_NOT_ELIGIBLE"
  | "INVALID_QUANTITY"
  | "ITEM_LIMIT_EXCEEDED"
  | "ITEM_OUT_OF_STOCK"
  | "OVER_CAPACITY"
  | "BOX_NOT_FULL";

export interface BoxError {
  code: BoxErrorCode;
  itemId?: string;
  message: string;
}

export interface BoxValidation {
  ok: boolean;
  filled: number;
  remaining: number;
  errors: BoxError[];
}

export interface BoxOptions {
  /** How many identical boxes are being bought (stock is checked for all of them). */
  boxQuantity?: number;
  /** Units of each item already reserved elsewhere in the cart. */
  reservedItemUnits?: Record<string, number>;
  /** Skip the "box must be full" rule (used while the customer is still filling). */
  allowPartial?: boolean;
}

export function isItemEligible(size: BoxSize, itemId: string): boolean {
  return size.allowedItemIds.length === 0 || size.allowedItemIds.includes(itemId);
}

export function eligiblePieces<T extends BoxPiece>(size: BoxSize, pieces: T[]): T[] {
  return pieces.filter((p) => p.isActive && isItemEligible(size, p.id));
}

export function countPieces(selection: BoxSelection): number {
  return Object.values(selection).reduce((sum, n) => sum + n, 0);
}

export function validateBox(
  size: BoxSize,
  pieces: BoxPiece[],
  selection: BoxSelection,
  options: BoxOptions = {},
): BoxValidation {
  const boxQuantity = options.boxQuantity ?? 1;
  const reserved = options.reservedItemUnits ?? {};
  const errors: BoxError[] = [];
  const byId = new Map(pieces.map((p) => [p.id, p]));

  if (!size.isActive || !Number.isInteger(size.capacity) || size.capacity <= 0) {
    errors.push({ code: "BOX_UNAVAILABLE", message: `${size.name} is not available.` });
  } else if (size.stock < boxQuantity) {
    errors.push({ code: "BOX_OUT_OF_STOCK", message: `Not enough ${size.name} boxes in stock.` });
  }

  let filled = 0;
  for (const [itemId, qty] of Object.entries(selection)) {
    if (!Number.isInteger(qty) || qty < 0) {
      errors.push({ code: "INVALID_QUANTITY", itemId, message: "Quantities must be whole numbers." });
      continue;
    }
    if (qty === 0) continue;
    filled += qty;

    const piece = byId.get(itemId);
    if (!piece) {
      errors.push({ code: "ITEM_NOT_FOUND", itemId, message: "An item in this box no longer exists." });
      continue;
    }
    if (!piece.isActive) {
      errors.push({ code: "ITEM_UNAVAILABLE", itemId, message: `${piece.name} is currently unavailable.` });
      continue;
    }
    if (!isItemEligible(size, itemId)) {
      errors.push({ code: "ITEM_NOT_ELIGIBLE", itemId, message: `${piece.name} can't go in the ${size.name}.` });
      continue;
    }
    if (piece.maxPerBox !== null && qty > piece.maxPerBox) {
      errors.push({
        code: "ITEM_LIMIT_EXCEEDED",
        itemId,
        message: `A box can hold at most ${piece.maxPerBox} × ${piece.name}.`,
      });
    }
    const needed = qty * boxQuantity + (reserved[itemId] ?? 0);
    if (needed > piece.stock) {
      errors.push({ code: "ITEM_OUT_OF_STOCK", itemId, message: `Not enough ${piece.name} in stock.` });
    }
  }

  const capacity = Math.max(size.capacity, 0);
  if (filled > capacity) {
    errors.push({ code: "OVER_CAPACITY", message: `This box holds ${capacity} pieces.` });
  } else if (!options.allowPartial && filled < capacity) {
    errors.push({
      code: "BOX_NOT_FULL",
      message: `Add ${capacity - filled} more piece${capacity - filled === 1 ? "" : "s"} to complete your box.`,
    });
  }

  return { ok: errors.length === 0, filled, remaining: Math.max(capacity - filled, 0), errors };
}

/** Can one more of `itemId` be added? Returns the blocking reason, or null if allowed. */
export function addPieceBlocker(
  size: BoxSize,
  pieces: BoxPiece[],
  selection: BoxSelection,
  itemId: string,
): BoxError | null {
  const next = { ...selection, [itemId]: (selection[itemId] ?? 0) + 1 };
  const result = validateBox(size, pieces, next, { allowPartial: true });
  return result.errors.find((e) => e.itemId === itemId || e.code === "OVER_CAPACITY") ?? null;
}

export interface BoxPrice {
  /** null when the box or any chosen piece has no price set yet */
  totalCents: number | null;
  boxCents: number | null;
  piecesCents: number | null;
}

/** Price of ONE box: the box size price plus each piece's price. */
export function priceBox(size: BoxSize, pieces: BoxPiece[], selection: BoxSelection): BoxPrice {
  const byId = new Map(pieces.map((p) => [p.id, p]));
  let piecesCents: number | null = 0;
  for (const [itemId, qty] of Object.entries(selection)) {
    if (qty <= 0) continue;
    const price = byId.get(itemId)?.priceCents;
    if (price === null || price === undefined) {
      piecesCents = null;
      break;
    }
    piecesCents += price * qty;
  }
  const boxCents = size.priceCents;
  const totalCents = boxCents === null || piecesCents === null ? null : boxCents + piecesCents;
  return { totalCents, boxCents, piecesCents };
}

/** Drop zero quantities and sort keys so equal boxes compare equal (used for cart line identity). */
export function normalizeSelection(selection: BoxSelection): BoxSelection {
  return Object.fromEntries(
    Object.entries(selection)
      .filter(([, qty]) => qty > 0)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}
