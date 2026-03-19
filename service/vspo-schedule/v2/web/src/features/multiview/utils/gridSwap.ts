import GridLayout from "react-grid-layout";
import {
  Constraint,
  Rectangle,
  Variable,
  Solver,
  generateXConstraints,
  generateYConstraints,
  removeOverlaps,
} from "webcola";

/** Weight for fixed items — high enough to pin position in VPSC. */
const FIXED_WEIGHT = 10000;

/** Weight for the boundary anchor — must exceed FIXED_WEIGHT. */
const BOUNDARY_WEIGHT = FIXED_WEIGHT * 10;

/**
 * Solve one axis with weighted VPSC and boundary constraints (position >= 0).
 *
 * Uses webcola's Variable weight to pin the fixed item in place and
 * Constraint objects to enforce non-negative positions (grid boundary).
 */
const solveAxis = (
  rects: Rectangle[],
  fixedIndex: number,
  axis: "x" | "y",
): void => {
  const center = axis === "x" ? (r: Rectangle) => r.cx() : (r: Rectangle) => r.cy();
  const halfSize = axis === "x"
    ? (r: Rectangle) => (r.X - r.x) / 2
    : (r: Rectangle) => (r.Y - r.y) / 2;
  const setCenter = axis === "x"
    ? (r: Rectangle, v: number) => r.setXCentre(v)
    : (r: Rectangle, v: number) => r.setYCentre(v);
  const genConstraints = axis === "x" ? generateXConstraints : generateYConstraints;

  const vars = rects.map(
    (r, i) => new Variable(center(r), i === fixedIndex ? FIXED_WEIGHT : 1),
  );

  const constraints = genConstraints(rects, vars);

  // Boundary: center >= halfSize  ⟹  left/top edge >= 0
  const boundary = new Variable(0, BOUNDARY_WEIGHT);
  for (let i = 0; i < rects.length; i++) {
    constraints.push(new Constraint(boundary, vars[i], halfSize(rects[i])));
  }

  new Solver([...vars, boundary], constraints).solve();
  vars.forEach((v, i) => setCenter(rects[i], v.position()));
};

/**
 * webcola の VPSC アルゴリズムでレイアウトの重なりを解消する。
 *
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
export const resolveOverlaps = (
  layout: GridLayout.Layout[],
  fixedId?: string,
): GridLayout.Layout[] => {
  if (layout.length <= 1) return layout;

  const rects = layout.map(
    (item) => new Rectangle(item.x, item.x + item.w, item.y, item.y + item.h),
  );

  const fixedIndex = fixedId
    ? layout.findIndex((item) => item.i === fixedId)
    : -1;

  if (fixedIndex >= 0) {
    // Iterate X→Y→X→Y to let both axes converge
    for (let pass = 0; pass < 3; pass++) {
      solveAxis(rects, fixedIndex, "x");
      solveAxis(rects, fixedIndex, "y");
    }
  } else {
    removeOverlaps(rects);
  }

  // Round positions ensuring no overlap: use ceil for the position so items
  // never round inward (which could re-create overlaps).
  const result = layout.map((item, i) => ({
    ...item,
    x: Math.max(0, Math.ceil(rects[i].x)),
    y: Math.max(0, Math.ceil(rects[i].y)),
  }));

  // Verify: if any overlap remains after rounding, run a second pass
  const hasOverlap = result.some((a, i) =>
    result.some((b, j) => {
      if (i >= j) return false;
      const xOverlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const yOverlap = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      return xOverlap > 0 && yOverlap > 0;
    }),
  );

  if (hasOverlap) {
    // Second pass with the rounded layout
    const rects2 = result.map(
      (item) => new Rectangle(item.x, item.x + item.w, item.y, item.y + item.h),
    );
    if (fixedIndex >= 0) {
      for (let pass = 0; pass < 3; pass++) {
        solveAxis(rects2, fixedIndex, "x");
        solveAxis(rects2, fixedIndex, "y");
      }
    } else {
      removeOverlaps(rects2);
    }
    return result.map((item, i) => ({
      ...item,
      x: Math.max(0, Math.ceil(rects2[i].x)),
      y: Math.max(0, Math.ceil(rects2[i].y)),
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
