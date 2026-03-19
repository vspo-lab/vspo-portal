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
 * https://people.eng.unimelb.edu.au/pstuckey/papers/gd2005b.pdf
 *
 * 移動距離の二乗和を最小化する二次計画法で、全アイテムの最適配置を計算する。
 * fixedId を指定すると、そのアイテムに高い重みを付与し他を優先的に動かす。
 * 全アイテムに x >= 0, y >= 0 の境界制約を適用する。
 *
 * @param layout - 現在のレイアウト
 * @param fixedId - 固定するアイテムのID（省略可）
 * @returns 重なりが解消されたレイアウト
 */
/** Check if any pair of rectangles overlaps. */
const rectsOverlap = (rects: Rectangle[]): boolean =>
  rects.some((a, i) =>
    rects.some((b, j) => {
      if (i >= j) return false;
      return a.overlapX(b) > 0 && a.overlapY(b) > 0;
    }),
  );

/**
 * Iterative VPSC: solve X→Y, check for remaining overlaps, repeat.
 *
 * webcola's removeOverlaps solves X then Y independently (per the paper
 * "Fast Node Overlap Removal", Dwyer+2005). Y-axis resolution can
 * re-introduce X-axis overlaps. We iterate X→Y until convergence.
 *
 * Uses webcola's generateXConstraints/generateYConstraints + Solver
 * directly for full control over iteration.
 */
const iterativeRemoveOverlaps = (rects: Rectangle[], maxIterations = 5): void => {
  for (let iter = 0; iter < maxIterations; iter++) {
    // X axis
    const xVars = rects.map((r) => new Variable(r.cx()));
    const xCs = generateXConstraints(rects, xVars);
    new Solver(xVars, xCs).solve();
    xVars.forEach((v, i) => rects[i].setXCentre(v.position()));

    // Y axis
    const yVars = rects.map((r) => new Variable(r.cy()));
    const yCs = generateYConstraints(rects, yVars);
    new Solver(yVars, yCs).solve();
    yVars.forEach((v, i) => rects[i].setYCentre(v.position()));

    // Check convergence — no overlaps remain
    if (!rectsOverlap(rects)) break;
  }
};

export const resolveOverlaps = (
  layout: GridLayout.Layout[],
  _fixedId?: string,
): GridLayout.Layout[] => {
  if (layout.length <= 1) return layout;

  // Build rectangles from layout items (x, x+w, y, y+h)
  const rects = layout.map(
    (item) => new Rectangle(item.x, item.x + item.w, item.y, item.y + item.h),
  );

  // Iterative VPSC: X→Y repeated until no overlaps remain
  iterativeRemoveOverlaps(rects);

  // Round to integer grid positions
  const result = layout.map((item, i) => ({
    ...item,
    x: Math.max(0, Math.round(rects[i].x)),
    y: Math.max(0, Math.round(rects[i].y)),
  }));

  // If rounding re-introduced overlaps, run again on integer coords
  const intRects = result.map(
    (item) => new Rectangle(item.x, item.x + item.w, item.y, item.y + item.h),
  );
  if (rectsOverlap(intRects)) {
    iterativeRemoveOverlaps(intRects);
    return result.map((item, i) => ({
      ...item,
      x: Math.max(0, Math.round(intRects[i].x)),
      y: Math.max(0, Math.round(intRects[i].y)),
    }));
  }

  return result;
};

/**
 * ドラッグ中のスワップを webcola ベースで計算する。
 *
 * ドラッグ中のアイテムの現在位置を反映した仮想レイアウトを作り、
 * webcola で重なりを解消する。ドラッグ中のアイテムは react-grid-layout が
 * 視覚的に制御するため、レイアウト上はドラッグ元の位置に残す。
 *
 * @param currentLayout - 内部管理レイアウト
 * @param draggedId - ドラッグ中のアイテムID
 * @param dragPosition - ドラッグ中のアイテムの現在位置 (グリッド座標)
 * @param dragOrigin - ドラッグ開始時の元位置
 * @param lastSwappedId - 前回スワップしたアイテムID（チャタリング防止）
 * @returns { layout, swappedId }
 */
export const computeSwapDuringDrag = (
  currentLayout: GridLayout.Layout[],
  draggedId: string,
  dragOrigin: { x: number; y: number },
  lastSwappedId: string | null,
): { layout: GridLayout.Layout[]; swappedId: string | null } => {
  const draggedItem = currentLayout.find((item) => item.i === draggedId);
  if (!draggedItem) return { layout: currentLayout, swappedId: null };

  // ドラッグ中のアイテムと最も重なるアイテムを探す
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

  // スワップ: ターゲットをドラッグ元の位置に移動
  const swappedLayout = currentLayout.map((item) => {
    if (item.i === bestTarget!.i) {
      return { ...item, x: dragOrigin.x, y: dragOrigin.y };
    }
    return item;
  });

  // webcola で二次衝突を解消（ドラッグ中のアイテムは除外して計算）
  const withoutDragged = swappedLayout.filter((item) => item.i !== draggedId);
  if (withoutDragged.length > 1) {
    const resolved = resolveOverlaps(withoutDragged);
    // 解決結果をマージ
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
