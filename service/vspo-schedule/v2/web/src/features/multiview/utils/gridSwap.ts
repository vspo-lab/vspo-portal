import GridLayout from "react-grid-layout";

/**
 * 整数グリッド座標上で全アイテムの重なりを解消する。
 *
 * VPSCのfloat→int変換による丸め誤差を排除するため、
 * グリッド座標（整数）のまま直接計算する。
 *
 * アルゴリズム:
 * 1. 全ペアの重なりをチェック
 * 2. 重なりがあれば、重なりが小さい軸方向に最小距離だけ押し出す
 * 3. 重なりがなくなるまで繰り返す（最大20パス）
 *
 * @param layout - 現在のレイアウト（整数グリッド座標）
 * @returns 重なりのないレイアウト
 */
export const resolveOverlaps = (
  layout: GridLayout.Layout[],
): GridLayout.Layout[] => {
  if (layout.length <= 1) return layout;

  // Work on mutable copies
  const items = layout.map((item) => ({ ...item }));

  for (let pass = 0; pass < 20; pass++) {
    let hasOverlap = false;

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];

        // Calculate overlap on each axis
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

        // No overlap if either axis has no intersection
        if (overlapX <= 0 || overlapY <= 0) continue;

        hasOverlap = true;

        // Push apart on the axis with smaller overlap (minimum movement)
        if (overlapX <= overlapY) {
          // Push horizontally
          const aCenterX = a.x + a.w / 2;
          const bCenterX = b.x + b.w / 2;
          if (aCenterX <= bCenterX) {
            // b is to the right → push b right
            items[j] = { ...items[j], x: a.x + a.w };
          } else {
            // a is to the right → push a right
            items[i] = { ...items[i], x: b.x + b.w };
          }
        } else {
          // Push vertically
          const aCenterY = a.y + a.h / 2;
          const bCenterY = b.y + b.h / 2;
          if (aCenterY <= bCenterY) {
            // b is below → push b down
            items[j] = { ...items[j], y: a.y + a.h };
          } else {
            // a is below → push a down
            items[i] = { ...items[i], y: b.y + b.h };
          }
        }
      }
    }

    if (!hasOverlap) break;
  }

  // Ensure all positions are non-negative
  return items.map((item) => ({
    ...item,
    x: Math.max(0, item.x),
    y: Math.max(0, item.y),
  }));
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
