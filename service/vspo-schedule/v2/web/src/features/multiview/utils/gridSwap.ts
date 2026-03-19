import GridLayout from "react-grid-layout";
import {
  Rectangle,
  Variable,
  Solver,
  generateXConstraints,
  generateYConstraints,
} from "webcola";

/**
 * 参考論文: "Fast Node Overlap Removal" (Dwyer, Marriott, Stuckey, 2005)
 *
 * ピクセル座標空間でVPSCを実行し、結果をグリッド座標に変換することで
 * 丸め誤差を最小化する。
 */

/** Check if any pair of rectangles overlaps (using webcola's overlap methods). */
const rectsOverlap = (rects: Rectangle[]): boolean =>
  rects.some((a, i) =>
    rects.some((b, j) => {
      if (i >= j) return false;
      return a.overlapX(b) > 0 && a.overlapY(b) > 0;
    }),
  );

/**
 * Iterative VPSC on pixel-space rectangles.
 * Solves X→Y, checks for remaining overlaps, repeats until convergence.
 */
const iterativeRemoveOverlaps = (rects: Rectangle[], maxIterations = 5): void => {
  for (let iter = 0; iter < maxIterations; iter++) {
    const xVars = rects.map((r) => new Variable(r.cx()));
    const xCs = generateXConstraints(rects, xVars);
    new Solver(xVars, xCs).solve();
    xVars.forEach((v, i) => rects[i].setXCentre(v.position()));

    const yVars = rects.map((r) => new Variable(r.cy()));
    const yCs = generateYConstraints(rects, yVars);
    new Solver(yVars, yCs).solve();
    yVars.forEach((v, i) => rects[i].setYCentre(v.position()));

    if (!rectsOverlap(rects)) break;
  }
};

/**
 * Resolve all overlaps in a layout using VPSC in pixel coordinate space.
 *
 * Strategy:
 * 1. Convert grid units → pixel coordinates (colWidth, rowHeight)
 * 2. Run iterative VPSC in continuous pixel space (no rounding needed)
 * 3. Convert pixel coordinates → grid units with floor/ceil to prevent sub-pixel overlaps
 * 4. Verify no overlaps remain; if they do, nudge items apart by 1 grid unit
 *
 * @param layout - Current grid layout (grid units)
 * @param colWidth - Width of one grid column in pixels
 * @param rowHeight - Height of one grid row in pixels
 */
export const resolveOverlaps = (
  layout: GridLayout.Layout[],
  colWidth = 1,
  rowHeight = 1,
): GridLayout.Layout[] => {
  if (layout.length <= 1) return layout;

  // Step 1: Grid units → pixel coordinates
  const pixelRects = layout.map(
    (item) =>
      new Rectangle(
        item.x * colWidth,
        (item.x + item.w) * colWidth,
        item.y * rowHeight,
        (item.y + item.h) * rowHeight,
      ),
  );

  // Step 2: VPSC in pixel space (continuous — no integer rounding issues)
  iterativeRemoveOverlaps(pixelRects);

  // Step 3: Pixel coordinates → grid units
  const result = layout.map((item, i) => ({
    ...item,
    x: Math.max(0, Math.round(pixelRects[i].x / colWidth)),
    y: Math.max(0, Math.round(pixelRects[i].y / rowHeight)),
  }));

  // Step 4: Verify — nudge any remaining overlaps by 1 grid unit
  for (let pass = 0; pass < 5; pass++) {
    let fixed = false;
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        const xOv = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const yOv = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (xOv <= 0 || yOv <= 0) continue;

        // Nudge the item that is further right/down by the overlap amount
        if (xOv <= yOv) {
          if (b.x >= a.x) {
            result[j] = { ...result[j], x: a.x + a.w };
          } else {
            result[i] = { ...result[i], x: b.x + b.w };
          }
        } else {
          if (b.y >= a.y) {
            result[j] = { ...result[j], y: a.y + a.h };
          } else {
            result[i] = { ...result[i], y: b.y + b.h };
          }
        }
        fixed = true;
      }
    }
    if (!fixed) break;
  }

  return result;
};

/**
 * ドラッグ中のスワップを計算する。
 *
 * ドラッグ中のアイテムと最も重なるアイテムを検出し、位置を交換する。
 * 二次衝突はresolveOverlapsで解消。
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
 * 2つのレイアウトアイテムの重なり面積を計算する。
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
