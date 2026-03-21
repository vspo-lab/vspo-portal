import GridLayout from "react-grid-layout";
import {
  Constraint,
  Rectangle,
  Solver,
  Variable,
  generateXConstraints,
  generateYConstraints,
} from "webcola";

/** Number of grid columns for the desktop multiview layout. */
export const GRID_COLS = 120;

/** Weight for VPSC boundary variables — high enough to pin boundaries in place. */
const BOUNDARY_WEIGHT = 1e8;

/**
 * Resolve all overlaps among items on an integer grid using VPSC (webcola).
 *
 * Uses webcola's VPSC solver with boundary constraints for the bulk of the work,
 * then applies a greedy fixup for edge cases that webcola's scan-line misses
 * (e.g., items with identical centers on the scan axis).
 *
 * @precondition layout items have positive w and h
 * @postcondition No pairwise overlaps; x in [0, GRID_COLS-w], y >= 0
 * @param layout - Current layout (integer grid coordinates)
 * @returns Layout with no overlaps, positions adjusted minimally from originals
 */
export const resolveOverlaps = (
  layout: GridLayout.Layout[],
): GridLayout.Layout[] => {
  if (layout.length <= 1) {
    return layout.map((item) => ({
      ...item,
      x: Math.max(0, Math.min(GRID_COLS - item.w, item.x)),
      y: Math.max(0, item.y),
    }));
  }

  const items = layout.map((item) => ({ ...item }));
  solveWithVpsc(items);
  greedyFixup(items);
  return items;
};

/**
 * VPSC-based overlap removal with boundary constraints.
 * Mutates items' x/y in place.
 */
const solveWithVpsc = (items: GridLayout.Layout[]): void => {
  const rects = items.map(
    (item) =>
      new Rectangle(item.x, item.x + item.w, item.y, item.y + item.h),
  );

  const xVars = rects.map((r) => new Variable(r.cx()));
  const xCs = generateXConstraints(rects, xVars);
  const leftBound = new Variable(0, BOUNDARY_WEIGHT);
  const rightBound = new Variable(GRID_COLS, BOUNDARY_WEIGHT);
  for (let i = 0; i < rects.length; i++) {
    const halfW = rects[i].width() / 2;
    xCs.push(new Constraint(leftBound, xVars[i], halfW));
    xCs.push(new Constraint(xVars[i], rightBound, halfW));
  }
  new Solver([...xVars, leftBound, rightBound], xCs).solve();
  xVars.forEach((v, i) => rects[i].setXCentre(v.position()));

  const yVars = rects.map((r) => new Variable(r.cy()));
  const yCs = generateYConstraints(rects, yVars);
  const topBound = new Variable(0, BOUNDARY_WEIGHT);
  for (let i = 0; i < rects.length; i++) {
    const halfH = rects[i].height() / 2;
    yCs.push(new Constraint(topBound, yVars[i], halfH));
  }
  new Solver([...yVars, topBound], yCs).solve();
  yVars.forEach((v, i) => rects[i].setYCentre(v.position()));

  for (let i = 0; i < items.length; i++) {
    const r = rects[i];
    items[i] = {
      ...items[i],
      x: Math.max(0, Math.min(GRID_COLS - items[i].w, Math.round(r.x))),
      y: Math.max(0, Math.round(r.y)),
    };
  }
};

/**
 * Greedy fixup for remaining overlaps after VPSC.
 *
 * Handles edge cases that webcola's scan-line algorithm misses (items with
 * identical centers, rounding artifacts). Pushes apart along the shorter
 * overlap axis, respecting grid boundaries.
 *
 * Mutates items' x/y in place.
 */
const greedyFixup = (items: GridLayout.Layout[]): void => {
  const maxIter = items.length * items.length * 2;

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

    if (worstI < 0) break;

    const a = items[worstI];
    const b = items[worstJ];
    const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

    if (overlapX <= overlapY && tryPushX(items, worstI, worstJ)) {
      continue;
    }
    pushY(items, worstI, worstJ);
  }
};

/**
 * Try to push two overlapping items apart along X.
 * Returns false if blocked by grid boundaries on both sides.
 */
const tryPushX = (
  items: GridLayout.Layout[],
  i: number,
  j: number,
): boolean => {
  const a = items[i];
  const b = items[j];
  const aIsLeft = a.x + a.w / 2 <= b.x + b.w / 2;
  const [leftIdx, rightIdx] = aIsLeft ? [i, j] : [j, i];
  const left = items[leftIdx];
  const right = items[rightIdx];

  const targetX = left.x + left.w;
  if (targetX + right.w <= GRID_COLS) {
    items[rightIdx] = { ...right, x: targetX };
    return true;
  }
  const targetLeftX = right.x - left.w;
  if (targetLeftX >= 0) {
    items[leftIdx] = { ...left, x: targetLeftX };
    return true;
  }
  return false;
};

/** Push two items apart along Y (always succeeds — grid scrolls vertically). */
const pushY = (items: GridLayout.Layout[], i: number, j: number): void => {
  const a = items[i];
  const b = items[j];
  if (a.y + a.h / 2 <= b.y + b.h / 2) {
    items[j] = { ...b, y: a.y + a.h };
  } else {
    items[i] = { ...a, y: b.y + b.h };
  }
};

/**
 * Compute swap during drag.
 *
 * Detects the item with the largest overlap with the dragged item and swaps their positions.
 * Secondary collisions are resolved via resolveOverlaps.
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
 * Calculate the overlap area of two layout items.
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
