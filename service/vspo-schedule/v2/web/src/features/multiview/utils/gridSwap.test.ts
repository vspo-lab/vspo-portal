import { describe, expect, it } from "vitest";
import type GridLayout from "react-grid-layout";
import {
  GRID_COLS,
  resolveOverlaps,
  computeSwapDuringDrag,
  getOverlapArea,
} from "./gridSwap";

/** Helper to create a minimal layout item. */
const makeItem = (
  overrides: Partial<GridLayout.Layout> & { i: string; x: number; y: number; w: number; h: number },
): GridLayout.Layout => overrides as GridLayout.Layout;

/** Check that no pair of items overlaps. */
const assertNoOverlaps = (items: GridLayout.Layout[]) => {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      expect(
        getOverlapArea(items[i], items[j]),
        `Items "${items[i].i}" and "${items[j].i}" overlap`,
      ).toBe(0);
    }
  }
};

/** Check all items are within grid boundaries. */
const assertWithinBounds = (items: GridLayout.Layout[]) => {
  for (const item of items) {
    expect(item.x, `"${item.i}" x=${item.x} < 0`).toBeGreaterThanOrEqual(0);
    expect(item.y, `"${item.i}" y=${item.y} < 0`).toBeGreaterThanOrEqual(0);
    expect(
      item.x + item.w,
      `"${item.i}" right edge ${item.x + item.w} > ${GRID_COLS}`,
    ).toBeLessThanOrEqual(GRID_COLS);
  }
};

describe("resolveOverlaps", () => {
  it("returns empty array for empty input", () => {
    expect(resolveOverlaps([])).toEqual([]);
  });

  it("returns single item unchanged", () => {
    const layout = [makeItem({ i: "a", x: 10, y: 5, w: 20, h: 10 })];
    const result = resolveOverlaps(layout);
    expect(result).toEqual(layout);
  });

  it("returns non-overlapping items unchanged", () => {
    const layout = [
      makeItem({ i: "a", x: 0, y: 0, w: 30, h: 10 }),
      makeItem({ i: "b", x: 30, y: 0, w: 30, h: 10 }),
      makeItem({ i: "c", x: 60, y: 0, w: 30, h: 10 }),
    ];
    const result = resolveOverlaps(layout);
    // Positions should not change
    for (let i = 0; i < layout.length; i++) {
      expect(result[i].x).toBe(layout[i].x);
      expect(result[i].y).toBe(layout[i].y);
    }
    assertNoOverlaps(result);
  });

  it("resolves two items overlapping horizontally", () => {
    const layout = [
      makeItem({ i: "a", x: 0, y: 0, w: 30, h: 10 }),
      makeItem({ i: "b", x: 20, y: 0, w: 30, h: 10 }),
    ];
    const result = resolveOverlaps(layout);
    assertNoOverlaps(result);
    assertWithinBounds(result);
  });

  it("resolves two items overlapping vertically", () => {
    const layout = [
      makeItem({ i: "a", x: 0, y: 0, w: 30, h: 10 }),
      makeItem({ i: "b", x: 0, y: 5, w: 30, h: 10 }),
    ];
    const result = resolveOverlaps(layout);
    assertNoOverlaps(result);
    assertWithinBounds(result);
  });

  it("resolves fully overlapping items (same position and size)", () => {
    const layout = [
      makeItem({ i: "a", x: 10, y: 10, w: 20, h: 10 }),
      makeItem({ i: "b", x: 10, y: 10, w: 20, h: 10 }),
    ];
    const result = resolveOverlaps(layout);
    assertNoOverlaps(result);
    assertWithinBounds(result);
  });

  it("resolves cascade scenario (A-B-C chain)", () => {
    // A, B, C overlap in a chain — pushing A-B apart should not cause B-C to overlap
    const layout = [
      makeItem({ i: "a", x: 0, y: 0, w: 30, h: 20 }),
      makeItem({ i: "b", x: 20, y: 0, w: 30, h: 20 }),
      makeItem({ i: "c", x: 40, y: 0, w: 30, h: 20 }),
    ];
    const result = resolveOverlaps(layout);
    assertNoOverlaps(result);
    assertWithinBounds(result);
  });

  it("minimizes displacement from original positions", () => {
    const layout = [
      makeItem({ i: "a", x: 0, y: 0, w: 20, h: 10 }),
      makeItem({ i: "b", x: 15, y: 0, w: 20, h: 10 }),
    ];
    const result = resolveOverlaps(layout);
    assertNoOverlaps(result);

    // Total displacement should be small (VPSC minimizes squared displacement)
    const totalDisplacement = result.reduce(
      (sum, item, i) =>
        sum + Math.abs(item.x - layout[i].x) + Math.abs(item.y - layout[i].y),
      0,
    );
    // The minimum to resolve 5-unit horizontal overlap is ~5 total shift
    expect(totalDisplacement).toBeLessThan(30);
  });

  it("respects left boundary (x >= 0)", () => {
    const layout = [
      makeItem({ i: "a", x: 0, y: 0, w: 30, h: 10 }),
      makeItem({ i: "b", x: 10, y: 0, w: 30, h: 10 }),
    ];
    const result = resolveOverlaps(layout);
    assertNoOverlaps(result);
    assertWithinBounds(result);
  });

  it("respects right boundary (x + w <= GRID_COLS)", () => {
    const layout = [
      makeItem({ i: "a", x: 90, y: 0, w: 30, h: 10 }),
      makeItem({ i: "b", x: 100, y: 0, w: 30, h: 10 }),
    ];
    const result = resolveOverlaps(layout);
    assertNoOverlaps(result);
    assertWithinBounds(result);
  });

  it("swaps positions when boundary blocks push (small item at edge, large inside)", () => {
    // Large item at right edge overlapping with small item — can't push right,
    // so swap puts the small item at the edge and large item in the open space
    const layout = [
      makeItem({ i: "small", x: 80, y: 0, w: 20, h: 20 }),
      makeItem({ i: "large", x: 70, y: 0, w: 50, h: 20 }),
    ];
    const result = resolveOverlaps(layout);
    assertNoOverlaps(result);
    assertWithinBounds(result);
  });

  it("resolves overlap when both items are at left boundary", () => {
    const layout = [
      makeItem({ i: "a", x: 0, y: 0, w: 40, h: 20 }),
      makeItem({ i: "b", x: 0, y: 0, w: 30, h: 20 }),
    ];
    const result = resolveOverlaps(layout);
    assertNoOverlaps(result);
    assertWithinBounds(result);
  });

  it("resolves overlap when items span nearly the full grid width", () => {
    const layout = [
      makeItem({ i: "a", x: 0, y: 0, w: 70, h: 20 }),
      makeItem({ i: "b", x: 50, y: 0, w: 70, h: 20 }),
    ];
    const result = resolveOverlaps(layout);
    assertNoOverlaps(result);
    // At least one item may be pushed to Y since total width > GRID_COLS
  });

  it("handles 12 items all stacked at (0,0)", () => {
    const layout = Array.from({ length: 12 }, (_, i) =>
      makeItem({ i: `item-${i}`, x: 0, y: 0, w: 10, h: 10 }),
    );
    const result = resolveOverlaps(layout);
    assertNoOverlaps(result);
    assertWithinBounds(result);
    expect(result).toHaveLength(12);
  });

  it("handles items with different sizes", () => {
    const layout = [
      makeItem({ i: "a", x: 0, y: 0, w: 60, h: 30 }),
      makeItem({ i: "b", x: 30, y: 10, w: 20, h: 10 }),
      makeItem({ i: "c", x: 50, y: 20, w: 40, h: 20 }),
    ];
    const result = resolveOverlaps(layout);
    assertNoOverlaps(result);
    assertWithinBounds(result);
  });

  it("preserves extra layout properties (minW, minH, static)", () => {
    const layout = [
      makeItem({ i: "a", x: 0, y: 0, w: 30, h: 10, minW: 5, minH: 3, static: true } as GridLayout.Layout),
      makeItem({ i: "b", x: 20, y: 0, w: 30, h: 10, minW: 2, minH: 2 } as GridLayout.Layout),
    ];
    const result = resolveOverlaps(layout);
    assertNoOverlaps(result);
    const a = result.find((item) => item.i === "a")!;
    const b = result.find((item) => item.i === "b")!;
    expect(a.minW).toBe(5);
    expect(a.minH).toBe(3);
    expect(a.static).toBe(true);
    expect(b.minW).toBe(2);
    expect(b.minH).toBe(2);
  });

  it("is idempotent (running twice produces same result)", () => {
    const layout = [
      makeItem({ i: "a", x: 0, y: 0, w: 40, h: 20 }),
      makeItem({ i: "b", x: 20, y: 10, w: 40, h: 20 }),
      makeItem({ i: "c", x: 60, y: 0, w: 40, h: 20 }),
    ];
    const first = resolveOverlaps(layout);
    const second = resolveOverlaps(first);
    expect(second).toEqual(first);
  });

  it("positions are always integers", () => {
    const layout = [
      makeItem({ i: "a", x: 0, y: 0, w: 25, h: 15 }),
      makeItem({ i: "b", x: 10, y: 5, w: 25, h: 15 }),
      makeItem({ i: "c", x: 20, y: 10, w: 25, h: 15 }),
    ];
    const result = resolveOverlaps(layout);
    for (const item of result) {
      expect(Number.isInteger(item.x), `x=${item.x} is not integer`).toBe(true);
      expect(Number.isInteger(item.y), `y=${item.y} is not integer`).toBe(true);
    }
  });

  it("completes in reasonable time for 12 items", () => {
    const layout = Array.from({ length: 12 }, (_, i) =>
      makeItem({
        i: `item-${i}`,
        x: (i % 4) * 25 + 5,
        y: Math.floor(i / 4) * 15 + 3,
        w: 30,
        h: 20,
      }),
    );
    const start = performance.now();
    const result = resolveOverlaps(layout);
    const elapsed = performance.now() - start;
    assertNoOverlaps(result);
    expect(elapsed).toBeLessThan(100); // generous for CI; typically <10ms locally
  });
});

describe("getOverlapArea", () => {
  it("returns 0 for non-overlapping items", () => {
    const a = makeItem({ i: "a", x: 0, y: 0, w: 10, h: 10 });
    const b = makeItem({ i: "b", x: 20, y: 0, w: 10, h: 10 });
    expect(getOverlapArea(a, b)).toBe(0);
  });

  it("returns 0 for touching items (no overlap)", () => {
    const a = makeItem({ i: "a", x: 0, y: 0, w: 10, h: 10 });
    const b = makeItem({ i: "b", x: 10, y: 0, w: 10, h: 10 });
    expect(getOverlapArea(a, b)).toBe(0);
  });

  it("calculates partial overlap correctly", () => {
    const a = makeItem({ i: "a", x: 0, y: 0, w: 20, h: 10 });
    const b = makeItem({ i: "b", x: 10, y: 5, w: 20, h: 10 });
    // Overlap: x=[10,20], y=[5,10] => 10 * 5 = 50
    expect(getOverlapArea(a, b)).toBe(50);
  });

  it("handles full containment", () => {
    const a = makeItem({ i: "a", x: 0, y: 0, w: 40, h: 40 });
    const b = makeItem({ i: "b", x: 10, y: 10, w: 10, h: 10 });
    expect(getOverlapArea(a, b)).toBe(100); // 10 * 10
  });
});

describe("computeSwapDuringDrag", () => {
  it("returns original layout if dragged item not found", () => {
    const layout = [makeItem({ i: "a", x: 0, y: 0, w: 30, h: 10 })];
    const result = computeSwapDuringDrag(layout, "nonexistent", { x: 0, y: 0 }, null);
    expect(result.layout).toBe(layout);
    expect(result.swappedId).toBeNull();
  });

  it("returns original layout if overlap < 50% of dragged area", () => {
    const layout = [
      makeItem({ i: "dragged", x: 0, y: 0, w: 20, h: 10 }),
      makeItem({ i: "target", x: 19, y: 0, w: 20, h: 10 }),
    ];
    // Overlap = 1 * 10 = 10, dragged area = 200, 10 < 100 (50%)
    const result = computeSwapDuringDrag(layout, "dragged", { x: 0, y: 0 }, null);
    expect(result.swappedId).toBeNull();
  });

  it("swaps target to drag origin when overlap >= 50%", () => {
    const layout = [
      makeItem({ i: "dragged", x: 5, y: 0, w: 20, h: 10 }),
      makeItem({ i: "target", x: 10, y: 0, w: 20, h: 10 }),
    ];
    // Overlap = 15 * 10 = 150, dragged area = 200, 150 >= 100
    const result = computeSwapDuringDrag(layout, "dragged", { x: 0, y: 0 }, null);
    expect(result.swappedId).toBe("target");
    const target = result.layout.find((item) => item.i === "target")!;
    expect(target.x).toBe(0);
    expect(target.y).toBe(0);
  });

  it("skips swap if target is same as lastSwappedId", () => {
    const layout = [
      makeItem({ i: "dragged", x: 5, y: 0, w: 20, h: 10 }),
      makeItem({ i: "target", x: 10, y: 0, w: 20, h: 10 }),
    ];
    const result = computeSwapDuringDrag(layout, "dragged", { x: 0, y: 0 }, "target");
    expect(result.swappedId).toBe("target");
    // Layout should be unchanged (no swap)
    expect(result.layout).toBe(layout);
  });

  it("resolves secondary collisions after swap", () => {
    const layout = [
      makeItem({ i: "dragged", x: 60, y: 0, w: 30, h: 20 }),
      makeItem({ i: "target", x: 70, y: 0, w: 30, h: 20 }),
      makeItem({ i: "bystander", x: 0, y: 0, w: 30, h: 20 }),
    ];
    const result = computeSwapDuringDrag(layout, "dragged", { x: 0, y: 0 }, null);
    expect(result.swappedId).toBe("target");

    // After swap, target moves to (0,0) which may collide with bystander
    // resolveOverlaps should fix that
    const nonDragged = result.layout.filter((item) => item.i !== "dragged");
    assertNoOverlaps(nonDragged);
  });
});
