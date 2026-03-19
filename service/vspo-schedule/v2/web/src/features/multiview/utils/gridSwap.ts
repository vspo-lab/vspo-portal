import GridLayout from "react-grid-layout";
import { Rectangle, removeOverlaps } from "webcola";

/**
 * webcola の VPSC アルゴリズムでレイアウトの重なりを解消する。
 *
 * 参考論文: "Fast Node Overlap Removal" (Dwyer, Marriott, Stuckey, 2005)
 * https://people.eng.unimelb.edu.au/pstuckey/papers/gd2005b.pdf
 *
 * 移動距離の二乗和を最小化する二次計画法で、全アイテムの最適配置を計算する。
 * fixedId を指定すると、そのアイテムの位置を固定して他を動かす。
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

  // GridLayout → webcola Rectangle (left, right, top, bottom)
  const rects = layout.map(
    (item) => new Rectangle(item.x, item.x + item.w, item.y, item.y + item.h),
  );

  // Save fixed item position before VPSC modifies it in-place
  const fixedIndex = fixedId
    ? layout.findIndex((item) => item.i === fixedId)
    : -1;
  const savedX = fixedIndex >= 0 ? rects[fixedIndex].x : 0;
  const savedY = fixedIndex >= 0 ? rects[fixedIndex].y : 0;

  removeOverlaps(rects);

  // Restore fixed item to its original position so only other items move
  if (fixedIndex >= 0) {
    const r = rects[fixedIndex];
    const w = r.X - r.x;
    const h = r.Y - r.y;
    r.x = savedX;
    r.X = savedX + w;
    r.y = savedY;
    r.Y = savedY + h;
  }

  // webcola Rectangle → GridLayout.Layout
  // Only update x/y (position). Keep original w/h (size).
  // Clamp to grid bounds: x >= 0, y >= 0
  return layout.map((item, i) => ({
    ...item,
    x: Math.max(0, Math.round(rects[i].x)),
    y: Math.max(0, Math.round(rects[i].y)),
  }));
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
