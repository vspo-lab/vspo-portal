import GridLayout from "react-grid-layout";

/**
 * Resolve all item overlaps on integer grid coordinates.
 *
 * Algorithm:
 * 1. Find the pair with the largest overlap area
 * 2. Push apart by the minimum distance along the axis with less overlap
 * 3. **Restart the search from the beginning** (pushing apart may create new overlaps)
 * 4. Repeat until no overlaps remain (max n*(n-1)/2 * 10 iterations)
 *
 * Each push resolves exactly one pair's overlap, so it converges in finite steps.
 *
 * @param layout - Current layout (integer grid coordinates)
 * @returns Layout without overlaps
 */
export const resolveOverlaps = (
  layout: GridLayout.Layout[],
  maxCols?: number,
): GridLayout.Layout[] => {
  if (layout.length <= 1) return layout;

  const items = layout.map((item) => ({ ...item }));
  const maxIterations = items.length * items.length * 10;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Find the overlapping pair with the largest overlap area
    let worstI = -1;
    let worstJ = -1;
    let worstArea = 0;

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox <= 0 || oy <= 0) continue;
        const area = ox * oy;
        if (area > worstArea) {
          worstArea = area;
          worstI = i;
          worstJ = j;
        }
      }
    }

    // No overlaps found — done
    if (worstI < 0) break;

    const a = items[worstI];
    const b = items[worstJ];
    const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

    // Push apart on the axis with smaller overlap (minimum movement)
    if (overlapX <= overlapY) {
      const aCx = a.x + a.w / 2;
      const bCx = b.x + b.w / 2;
      if (aCx <= bCx) {
        items[worstJ] = { ...b, x: a.x + a.w };
      } else {
        items[worstI] = { ...a, x: b.x + b.w };
      }
    } else {
      const aCy = a.y + a.h / 2;
      const bCy = b.y + b.h / 2;
      if (aCy <= bCy) {
        items[worstJ] = { ...b, y: a.y + a.h };
      } else {
        items[worstI] = { ...a, y: b.y + b.h };
      }
    }
  }

  return items.map((item) => ({
    ...item,
    x: Math.max(0, maxCols ? Math.min(item.x, maxCols - item.w) : item.x),
    y: Math.max(0, item.y),
  }));
};

/**
 * Calculate swap during drag.
 *
 * Detect the item with the most overlap with the dragged item and swap positions.
 * Secondary collisions are resolved by resolveOverlaps.
 */
export const computeSwapDuringDrag = (
  currentLayout: GridLayout.Layout[],
  draggedId: string,
  dragOrigin: { x: number; y: number },
  lastSwappedId: string | null,
): { layout: GridLayout.Layout[]; swappedId: string | null } => {
  const draggedItem = currentLayout.find((item) => item.i === draggedId);
  if (!draggedItem) return { layout: currentLayout, swappedId: null };

  let bestTarget: GridLayout.Layout | null = null;
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
 * Calculate overlap area of two layout items.
 */
export const getOverlapArea = (
  a: GridLayout.Layout,
  b: GridLayout.Layout,
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
