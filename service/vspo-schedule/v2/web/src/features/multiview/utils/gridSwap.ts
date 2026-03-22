import type { LayoutItem } from "react-grid-layout";
import { Rectangle, removeOverlaps as colaRemoveOverlaps } from "webcola";

/** Number of grid columns for the desktop multiview layout. */
export const GRID_COLS = 120;

/**
 * Resolve all overlaps among items on an integer grid using VPSC (webcola).
 *
 * 1. `removeOverlaps` — 2D VPSC solver (X-pass then Y-pass) with minimum displacement
 * 2. Boundary clamp + integer rounding
 * 3. `ensureNoOverlaps` — guarantee zero overlaps via X-push / swap / Y-push fallback
 *
 * @precondition layout items have positive w and h
 * @postcondition No pairwise overlaps; x in [0, GRID_COLS-w], y >= 0
 * @param layout - Current layout (integer grid coordinates)
 * @returns Layout with no overlaps, positions adjusted minimally from originals
 */
export const resolveOverlaps = (
  layout: LayoutItem[],
): LayoutItem[] => {
  if (layout.length <= 1) {
    return layout.map((item) => ({
      ...item,
      x: Math.max(0, Math.min(GRID_COLS - item.w, item.x)),
      y: Math.max(0, item.y),
    }));
  }

  const items = layout.map((item) => ({ ...item }));

  // Phase 1: webcola 2D VPSC — resolves most overlaps with minimum displacement
  const rects = items.map(
    (item) =>
      new Rectangle(item.x, item.x + item.w, item.y, item.y + item.h),
  );
  colaRemoveOverlaps(rects);

  // Phase 2: Boundary clamp + integer rounding
  for (let i = 0; i < items.length; i++) {
    const r = rects[i];
    items[i] = {
      ...items[i],
      x: Math.max(0, Math.min(GRID_COLS - items[i].w, Math.round(r.x))),
      y: Math.max(0, Math.round(r.y)),
    };
  }

  // Phase 3: Guarantee zero overlaps (boundary clamp may re-introduce overlaps)
  ensureNoOverlaps(items);

  return items;
};

/**
 * Guarantee zero overlaps after VPSC.
 *
 * Handles both integer rounding artifacts AND cases where VPSC couldn't fully
 * resolve overlaps (e.g. items too large for the grid width). Tries strategies
 * in order: X-push → position swap → Y-push. Y-push always succeeds since the
 * grid scrolls vertically, guaranteeing termination.
 *
 * Mutates items' x/y in place.
 * @postcondition No pairwise overlaps remain
 */
const ensureNoOverlaps = (items: LayoutItem[]): void => {
  // Upper bound: each iteration resolves at least one pair, at most n*(n-1)/2 pairs
  const maxIter = (items.length * (items.length - 1)) / 2 + items.length;

  for (let iter = 0; iter < maxIter; iter++) {
    let worstI = -1;
    let worstJ = -1;
    let worstArea = 0;

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const area = getOverlapArea(items[i], items[j]);
        if (area > worstArea) {
          worstArea = area;
          worstI = i;
          worstJ = j;
        }
      }
    }

    if (worstI < 0) return;

    const a = items[worstI];
    const b = items[worstJ];
    const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

    // 1. Try X-push (shorter axis preferred)
    if (overlapX <= overlapY) {
      const aIsLeft = a.x + a.w / 2 <= b.x + b.w / 2;
      const [li, ri] = aIsLeft ? [worstI, worstJ] : [worstJ, worstI];
      const left = items[li];
      const right = items[ri];
      const pushRight = left.x + left.w;
      if (pushRight + right.w <= GRID_COLS) {
        items[ri] = { ...right, x: pushRight };
        continue;
      }
      const pushLeft = right.x - left.w;
      if (pushLeft >= 0) {
        items[li] = { ...left, x: pushLeft };
        continue;
      }
    }

    // 2. Try position swap (useful when one item fits where the other was)
    const swapAx = b.x;
    const swapBx = a.x;
    const swapAy = b.y;
    const swapBy = a.y;
    const fitsA = swapAx >= 0 && swapAx + a.w <= GRID_COLS && swapAy >= 0;
    const fitsB = swapBx >= 0 && swapBx + b.w <= GRID_COLS && swapBy >= 0;
    if (fitsA && fitsB) {
      const swapOx =
        Math.min(swapAx + a.w, swapBx + b.w) - Math.max(swapAx, swapBx);
      const swapOy =
        Math.min(swapAy + a.h, swapBy + b.h) - Math.max(swapAy, swapBy);
      if (swapOx <= 0 || swapOy <= 0) {
        items[worstI] = { ...a, x: swapAx, y: swapAy };
        items[worstJ] = { ...b, x: swapBx, y: swapBy };
        continue;
      }
    }

    // 3. Y-push (always resolves — grid has unlimited vertical space)
    if (a.y + a.h / 2 <= b.y + b.h / 2) {
      items[worstJ] = { ...b, y: a.y + a.h };
    } else {
      items[worstI] = { ...a, y: b.y + b.h };
    }
  }
};

/**
 * Compute swap during drag.
 *
 * Detects the item with the largest overlap with the dragged item and swaps their positions.
 * Secondary collisions are resolved via resolveOverlaps.
 */
export const computeSwapDuringDrag = (
  currentLayout: LayoutItem[],
  draggedId: string,
  dragOrigin: { x: number; y: number },
  lastSwappedId: string | null,
): { layout: LayoutItem[]; swappedId: string | null } => {
  const draggedItem = currentLayout.find((item) => item.i === draggedId);
  if (!draggedItem) return { layout: currentLayout, swappedId: null };

  let bestTarget: LayoutItem | null = null;
  let bestOverlap = 0;

  for (const item of currentLayout) {
    if (item.i === draggedId) continue;
    const overlap = getOverlapArea(draggedItem, item);
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestTarget = item;
    }
  }

  const draggedArea = draggedItem.w * draggedItem.h;
  if (!bestTarget || bestOverlap < draggedArea * 0.5) {
    return { layout: currentLayout, swappedId: null };
  }

  if (bestTarget.i === lastSwappedId) {
    return { layout: currentLayout, swappedId: lastSwappedId };
  }

  // Swap: move target to drag origin
  const swappedLayout = currentLayout.map((item) => {
    if (item.i === bestTarget!.i) {
      return { ...item, x: dragOrigin.x, y: dragOrigin.y };
    }
    return item;
  });

  // Resolve secondary collisions (exclude dragged item)
  const withoutDragged = swappedLayout.filter((item) => item.i !== draggedId);
  if (withoutDragged.length > 1) {
    const resolved = resolveOverlaps(withoutDragged);
    const resolvedMap = new Map(resolved.map((item) => [item.i, item]));
    return {
      layout: swappedLayout.map((item) =>
        item.i === draggedId ? item : resolvedMap.get(item.i) || item,
      ),
      swappedId: bestTarget.i,
    };
  }

  return { layout: swappedLayout, swappedId: bestTarget.i };
};

/**
 * Calculate the overlap area of two layout items.
 */
export const getOverlapArea = (
  a: LayoutItem,
  b: LayoutItem,
): number => {
  const xOverlap = Math.max(
    0,
    Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x),
  );
  const yOverlap = Math.max(
    0,
    Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y),
  );
  return xOverlap * yOverlap;
};
