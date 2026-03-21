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
 * Two-phase approach:
 * 1. VPSC (webcola) — scan-line constraint generation + supplemental O(n²) pass
 *    for pairs the scan-line misses, solved with boundary constraints
 * 2. Lightweight fixup — resolves residual overlaps from integer rounding
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
  roundingFixup(items);
  return items;
};

/**
 * VPSC-based overlap removal with boundary constraints.
 *
 * Uses webcola's scan-line constraint generation as the base, then supplements
 * with an O(n²) pass to add constraints for any overlapping pairs that the
 * scan-line missed (e.g. items with identical centers or where X overlap > Y overlap).
 *
 * Mutates items' x/y in place.
 */
const solveWithVpsc = (items: GridLayout.Layout[]): void => {
  const n = items.length;
  const rects = items.map(
    (item) =>
      new Rectangle(item.x, item.x + item.w, item.y, item.y + item.h),
  );

  // --- X-pass ---
  const xVars = rects.map((r) => new Variable(r.cx()));
  const xCs = generateXConstraints(rects, xVars);
  supplementConstraints(rects, xVars, xCs, "x");
  const leftBound = new Variable(0, BOUNDARY_WEIGHT);
  const rightBound = new Variable(GRID_COLS, BOUNDARY_WEIGHT);
  for (let i = 0; i < n; i++) {
    const halfW = rects[i].width() / 2;
    xCs.push(new Constraint(leftBound, xVars[i], halfW));
    xCs.push(new Constraint(xVars[i], rightBound, halfW));
  }
  new Solver([...xVars, leftBound, rightBound], xCs).solve();
  xVars.forEach((v, i) => rects[i].setXCentre(v.position()));

  // --- Y-pass (uses updated X positions) ---
  const yVars = rects.map((r) => new Variable(r.cy()));
  const yCs = generateYConstraints(rects, yVars);
  supplementConstraints(rects, yVars, yCs, "y");
  const topBound = new Variable(0, BOUNDARY_WEIGHT);
  for (let i = 0; i < n; i++) {
    const halfH = rects[i].height() / 2;
    yCs.push(new Constraint(topBound, yVars[i], halfH));
  }
  new Solver([...yVars, topBound], yCs).solve();
  yVars.forEach((v, i) => rects[i].setYCentre(v.position()));

  // --- Write back ---
  for (let i = 0; i < n; i++) {
    const r = rects[i];
    items[i] = {
      ...items[i],
      x: Math.max(0, Math.min(GRID_COLS - items[i].w, Math.round(r.x))),
      y: Math.max(0, Math.round(r.y)),
    };
  }
};

/**
 * Add separation constraints for overlapping pairs not already covered.
 *
 * webcola's scan-line can miss pairs where:
 * - Items share the same center on the scan axis
 * - X overlap > Y overlap (skipped by X-pass, but Y-pass scan-line may also miss)
 *
 * This performs an O(n²) check and adds constraints only for uncovered pairs.
 */
const supplementConstraints = (
  rects: Rectangle[],
  vars: Variable[],
  existing: Constraint[],
  axis: "x" | "y",
): void => {
  const n = rects.length;

  const varIndex = new Map<Variable, number>();
  for (let i = 0; i < vars.length; i++) varIndex.set(vars[i], i);

  const covered = new Set<string>();
  for (const c of existing) {
    const li = varIndex.get(c.left);
    const ri = varIndex.get(c.right);
    if (li !== undefined && ri !== undefined) {
      covered.add(`${Math.min(li, ri)},${Math.max(li, ri)}`);
    }
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (covered.has(`${i},${j}`)) continue;

      const a = rects[i];
      const b = rects[j];
      const ox = Math.min(a.X, b.X) - Math.max(a.x, b.x);
      const oy = Math.min(a.Y, b.Y) - Math.max(a.y, b.y);
      if (ox <= 0 || oy <= 0) continue;

      // For X-pass: only add if X separation is preferred (ox <= oy)
      // For Y-pass: add for any remaining overlap (X-pass already ran)
      if (axis === "x" && ox > oy) continue;

      const size =
        axis === "x"
          ? (a.width() + b.width()) / 2
          : (a.height() + b.height()) / 2;
      const aCenter = axis === "x" ? a.cx() : a.cy();
      const bCenter = axis === "x" ? b.cx() : b.cy();

      if (aCenter <= bCenter) {
        existing.push(new Constraint(vars[i], vars[j], size + 1e-6));
      } else {
        existing.push(new Constraint(vars[j], vars[i], size + 1e-6));
      }
    }
  }
};

/**
 * Lightweight fixup for integer rounding artifacts.
 *
 * After VPSC + rounding, at most 1-2 pairs may overlap by 1 unit.
 * Resolves by pushing/swapping, bounded to O(n²) iterations.
 *
 * Mutates items' x/y in place.
 */
const roundingFixup = (items: GridLayout.Layout[]): void => {
  const maxIter = items.length * 2;

  for (let iter = 0; iter < maxIter; iter++) {
    let found = false;

    for (let i = 0; i < items.length && !found; i++) {
      for (let j = i + 1; j < items.length && !found; j++) {
        if (getOverlapArea(items[i], items[j]) === 0) continue;
        found = true;

        const a = items[i];
        const b = items[j];
        const overlapX =
          Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY =
          Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

        if (overlapX <= overlapY) {
          // Push apart in X
          const aIsLeft = a.x + a.w / 2 <= b.x + b.w / 2;
          const [li, ri] = aIsLeft ? [i, j] : [j, i];
          const left = items[li];
          const right = items[ri];
          const targetX = left.x + left.w;
          if (targetX + right.w <= GRID_COLS) {
            items[ri] = { ...right, x: targetX };
          } else if (right.x - left.w >= 0) {
            items[li] = { ...left, x: right.x - left.w };
          } else {
            // X blocked — push Y
            if (a.y <= b.y) {
              items[j] = { ...b, y: a.y + a.h };
            } else {
              items[i] = { ...a, y: b.y + b.h };
            }
          }
        } else {
          // Push apart in Y
          if (a.y + a.h / 2 <= b.y + b.h / 2) {
            items[j] = { ...b, y: a.y + a.h };
          } else {
            items[i] = { ...a, y: b.y + b.h };
          }
        }
      }
    }

    if (!found) break;
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
