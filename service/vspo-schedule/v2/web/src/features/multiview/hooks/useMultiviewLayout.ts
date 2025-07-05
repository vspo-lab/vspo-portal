import { useCallback, useEffect, useMemo, useState } from "react";

export type LayoutType =
  | "1x1"
  | "2x2"
  | "3x3"
  | "2x1"
  | "1x2"
  | "picture-in-picture"
  | "auto";

export type MultiviewLayout = {
  type: LayoutType;
  rows: number;
  cols: number;
  aspectRatio: string;
  isPip?: boolean;
  pipPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

interface UseMultiviewLayoutParams {
  streamCount: number;
  isMobile?: boolean;
  initialLayout?: LayoutType;
}

interface UseMultiviewLayoutReturn {
  layout: MultiviewLayout;
  selectedLayoutType: LayoutType;
  gridTemplateColumns: string;
  gridTemplateRows: string;
  availableLayouts: LayoutType[];
  changeLayout: (layoutType: LayoutType) => void;
  isLayoutSupported: (layoutType: LayoutType, streamCount: number) => boolean;
}

const getLayoutConfig = (
  layoutType: LayoutType,
  streamCount: number,
): Omit<MultiviewLayout, "type"> => {
  switch (layoutType) {
    case "1x1":
      return { rows: 1, cols: 1, aspectRatio: "16 / 9" };
    case "2x1":
      return { rows: 1, cols: 2, aspectRatio: "16 / 9" };
    case "1x2":
      return { rows: 2, cols: 1, aspectRatio: "16 / 9" };
    case "2x2":
      return { rows: 2, cols: 2, aspectRatio: "16 / 9" };
    case "3x3":
      return { rows: 3, cols: 3, aspectRatio: "16 / 9" };
    case "picture-in-picture":
      return {
        rows: 1,
        cols: 1,
        aspectRatio: "16 / 9",
        isPip: true,
        pipPosition: "bottom-right",
      };
    default:
      // Auto layout based on stream count
      if (streamCount <= 1) return { rows: 1, cols: 1, aspectRatio: "16 / 9" };
      if (streamCount === 2) return { rows: 1, cols: 2, aspectRatio: "16 / 9" };
      if (streamCount <= 4) return { rows: 2, cols: 2, aspectRatio: "16 / 9" };
      return { rows: 3, cols: 3, aspectRatio: "16 / 9" };
  }
};

const isLayoutSupported = (
  layoutType: LayoutType,
  streamCount: number,
): boolean => {
  if (streamCount === 0) return false;

  switch (layoutType) {
    case "1x1":
      return streamCount >= 1;
    case "2x1":
    case "1x2":
      return streamCount >= 1; // Can show fewer streams than slots
    case "2x2":
      return streamCount >= 1;
    case "3x3":
      return streamCount >= 1;
    case "picture-in-picture":
      return streamCount >= 2; // Need at least 2 streams for PiP
    case "auto":
      return streamCount >= 1;
    default:
      return false;
  }
};

const getAvailableLayouts = (
  streamCount: number,
  isMobile: boolean,
): LayoutType[] => {
  const allLayouts: LayoutType[] = [
    "auto",
    "1x1",
    "2x1",
    "1x2",
    "2x2",
    "3x3",
    "picture-in-picture",
  ];

  if (isMobile) {
    // On mobile, limit to simpler layouts
    return allLayouts.filter(
      (layout) =>
        ["auto", "1x1", "1x2"].includes(layout) &&
        isLayoutSupported(layout, streamCount),
    );
  }

  return allLayouts.filter((layout) => isLayoutSupported(layout, streamCount));
};

export const useMultiviewLayout = ({
  streamCount,
  isMobile = false,
  initialLayout = "auto",
}: UseMultiviewLayoutParams): UseMultiviewLayoutReturn => {
  const [selectedLayoutType, setSelectedLayoutType] =
    useState<LayoutType>(initialLayout);

  // Update selected layout when initialLayout changes
  useEffect(() => {
    setSelectedLayoutType(initialLayout);
  }, [initialLayout]);

  const availableLayouts = useMemo(
    () => getAvailableLayouts(streamCount, isMobile),
    [streamCount, isMobile],
  );

  // Auto-adjust layout if current selection is not supported
  const effectiveLayoutType = useMemo(() => {
    if (
      isLayoutSupported(selectedLayoutType, streamCount) &&
      availableLayouts.includes(selectedLayoutType)
    ) {
      return selectedLayoutType;
    }
    return "auto";
  }, [selectedLayoutType, streamCount, availableLayouts]);

  const layout = useMemo((): MultiviewLayout => {
    if (isMobile && effectiveLayoutType !== "auto") {
      // Mobile: force single column for non-auto layouts
      return {
        type: effectiveLayoutType,
        rows: streamCount,
        cols: 1,
        aspectRatio: "16 / 9",
      };
    }

    const config = getLayoutConfig(effectiveLayoutType, streamCount);
    return {
      type: effectiveLayoutType,
      ...config,
    };
  }, [effectiveLayoutType, streamCount, isMobile]);

  const gridTemplateColumns = useMemo(() => {
    if (isMobile) return "1fr";
    if (layout.isPip) return "1fr";
    return `repeat(${layout.cols}, 1fr)`;
  }, [layout.cols, layout.isPip, isMobile]);

  const gridTemplateRows = useMemo(() => {
    if (isMobile) return `repeat(${streamCount}, 1fr)`;
    if (layout.isPip) return "1fr";
    return `repeat(${layout.rows}, 1fr)`;
  }, [layout.rows, layout.isPip, streamCount, isMobile]);

  const changeLayout = useCallback(
    (layoutType: LayoutType) => {
      if (isLayoutSupported(layoutType, streamCount)) {
        setSelectedLayoutType(layoutType);
      }
    },
    [streamCount],
  );

  return {
    layout,
    selectedLayoutType: effectiveLayoutType,
    gridTemplateColumns,
    gridTemplateRows,
    availableLayouts,
    changeLayout,
    isLayoutSupported: (layoutType: LayoutType, count: number) =>
      isLayoutSupported(layoutType, count),
  };
};
