"use client";

import { Livestream } from "@/features/shared/domain";
import {
  Box,
  Paper,
  Typography,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslations } from "next-intl";
import React, { useState, useRef, useEffect, useMemo } from "react";
import GridLayout, { type Layout, type LayoutItem, getCompactor } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { MultiviewLayout } from "../../hooks/useMultiviewLayout";
import {
  GRID_COLS,
  resolveOverlaps,
} from "../../utils/gridSwap";
import { scaledBorderRadius } from "../../utils/theme";
import { ChatCell, VideoPlayer } from "../containers";

/** Prefix used for chat cell grid item keys to distinguish from video cells. */
const CHAT_KEY_PREFIX = "chat-";

/**
 * allowOverlap=true: RGL does NOT move other items during drag.
 * compact() is not called by RGL (skipped when allowOverlap=true).
 * resolveOverlaps is called manually in handleDragStop/handleResizeStop.
 */
const freePositionCompactor = getCompactor(null, true);


/** Static style for grid item wrappers — hoisted to avoid per-render allocation. */
const GRID_ITEM_STYLE: React.CSSProperties = {
  display: "flex",
  height: "100%",
  width: "100%",
};

const GridContainer = styled(Paper)(({ theme }) => ({
  minHeight: "auto",
  padding: 0,
  backgroundColor: "#e0e0e0",
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: "#1a1a1a",
  },
  borderRadius: 0,
  boxShadow: "none",
  border: "none",
  position: "sticky",
  // Align below the fixed AppBar — use toolbar mixin height
  top: (theme.mixins.toolbar.minHeight as number) ?? 56,
  zIndex: 1,
  width: "100%",
  height: "auto",
  overflowY: "auto",
  overflowX: "hidden",
  "&.is-dragging iframe": {
    pointerEvents: "none",
  },
  "&.is-dragging .react-grid-item": {
    willChange: "transform",
  },
  // Resize handles — rely on RGL v2's rotation-based CSS model,
  // only override opacity transition and handle color
  "& .react-grid-item > .react-resizable-handle": {
    zIndex: 2,
    transition: "opacity 0.15s",
    "&::after": {
      borderRightColor: "rgba(128,128,128,0.6)",
      borderBottomColor: "rgba(128,128,128,0.6)",
    },
  },
}));

const PipContainer = styled(Box)<{
  pipPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}>(({ theme, pipPosition }) => {
  const getPositionStyles = (pos: string) => {
    switch (pos) {
      case "top-left":
        return { top: theme.spacing(2), left: theme.spacing(2) };
      case "top-right":
        return { top: theme.spacing(2), right: theme.spacing(2) };
      case "bottom-left":
        return { bottom: theme.spacing(2), left: theme.spacing(2) };
      case "bottom-right":
      default:
        return { bottom: theme.spacing(2), right: theme.spacing(2) };
    }
  };

  return {
    position: "absolute",
    zIndex: 10,
    width: "30%",
    maxWidth: "300px",
    minWidth: "200px",
    aspectRatio: "16 / 9",
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
    boxShadow: theme.shadows[8],
    border: `2px solid ${theme.palette.divider}`,
    transition: theme.transitions.create(["transform", "opacity"], {
      duration: theme.transitions.duration.short,
    }),
    "&:hover": {
      transform: "scale(1.05)",
    },
    "@media (prefers-reduced-motion: reduce)": {
      transition: "none",
      "&:hover": {
        transform: "none",
      },
    },
    ...getPositionStyles(pipPosition),
    [theme.breakpoints.down("md")]: {
      width: "40%",
      minWidth: "150px",
      ...getPositionStyles(pipPosition),
    },
  };
});

const MainVideoContainer = styled(Box)({
  width: "100%",
  height: "100%",
});

const EmptyState = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "400px",
  color: theme.palette.text.secondary,
  backgroundColor: "white",
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.gray,
    color: "rgba(255, 255, 255, 0.7)",
  },
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(1),
  [theme.breakpoints.down("md")]: {
    height: "300px",
  },
}));

export type MultiviewGridPresenterProps = {
  selectedStreams: Livestream[];
  /** Set of stream IDs that have a chat cell open in the grid. */
  chatStreamIds: ReadonlySet<string>;
  layout: MultiviewLayout;
  onRemoveStream: (streamId: string) => void;
  /** Remove a chat cell for the given stream ID. */
  onRemoveChat: (streamId: string) => void;
  /** Called whenever the internal grid layout changes, exposing current positions for saving */
  onGridPositionsChange?: (
    positions: Array<{ i: string; x: number; y: number; w: number; h: number }>,
  ) => void;
  /** When provided, the grid applies these positions externally (e.g. from a saved custom layout). */
  externalGridPositions?: ReadonlyArray<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
};

/** Stable wrapper: prevents onRemove closure from changing on every parent render */
const MemoizedPlayer = React.memo(
  ({
    stream,
    index,
    onRemoveStream,
  }: {
    stream: Livestream;
    index: number;
    onRemoveStream: (id: string) => void;
  }) => {
    const handleRemove = React.useCallback(
      () => onRemoveStream(stream.id),
      [onRemoveStream, stream.id],
    );
    return <VideoPlayer stream={stream} index={index} onRemove={handleRemove} />;
  },
);

/** Stable wrapper for chat cells */
const MemoizedChat = React.memo(
  ({
    stream,
    index,
    onRemoveChat,
  }: {
    stream: Livestream;
    index: number;
    onRemoveChat: (id: string) => void;
  }) => {
    const handleRemove = React.useCallback(
      () => onRemoveChat(stream.id),
      [onRemoveChat, stream.id],
    );
    return <ChatCell stream={stream} index={index} onRemove={handleRemove} />;
  },
);

/**
 * Generate a fresh grid layout for the given item IDs.
 * All positions are in grid units: x/w in columns (0-12), y/h in rows.
 * rowHeight is set dynamically so 1 grid row unit = 1 visual row.
 */
/**
 * Merge RGL's layout with our internal layout.
 * For drag: use RGL positions + our sizes (RGL may reset w/h with allowOverlap).
 * For resize: use RGL positions + RGL sizes (user explicitly changed them).
 */
const mergeLayout = (
  rglLayout: LayoutItem[],
  internal: LayoutItem[],
  isResize: boolean,
): LayoutItem[] => {
  const internalMap = new Map(internal.map((item) => [item.i, item]));
  return rglLayout.map((rglItem) => {
    const ours = internalMap.get(rglItem.i);
    if (!ours) return rglItem;
    return {
      ...ours,
      x: rglItem.x,
      y: rglItem.y,
      w: isResize ? rglItem.w : ours.w,
      h: isResize ? rglItem.h : ours.h,
    };
  });
};

const buildGridLayout = (
  itemIds: string[],
  cols: number,
  cellsPerRow: number,
  isMobile: boolean,
): LayoutItem[] => {
  return itemIds.map((id, index) => {
    if (isMobile) {
      return {
        i: id, x: 0, y: index, w: GRID_COLS, h: 1,
        minW: GRID_COLS, minH: 1, static: true,
      };
    }

    const col = index % cols;
    const row = Math.floor(index / cols);

    return {
      i: id,
      x: col * (GRID_COLS / cols),
      y: row * cellsPerRow,
      w: GRID_COLS / cols,
      h: cellsPerRow,
      minW: 2,
      minH: 2,
    };
  });
};

export const MultiviewGridPresenter: React.FC<MultiviewGridPresenterProps> = ({
  selectedStreams,
  chatStreamIds,
  layout,
  onRemoveStream,
  onRemoveChat,
  onGridPositionsChange,
  externalGridPositions,
}) => {
  const t = useTranslations("multiview");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [availableHeight, setAvailableHeight] = useState(600);
  // Drag state
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  // Internal layout state — only reset when layout button is pressed
  const [internalLayout, setInternalLayout] = useState<LayoutItem[]>([]);
  // Track layout type to detect layout button presses
  const prevLayoutTypeRef = useRef(layout.type);

  // Update container width and available height on resize / layout change (RAF-throttled)
  useEffect(() => {
    let rafId = 0;

    const updateDimensions = () => {
      if (containerRef.current) {
        const computedStyle = window.getComputedStyle(containerRef.current);
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
        const actualWidth =
          containerRef.current.offsetWidth - paddingLeft - paddingRight;
        setContainerWidth(actualWidth);

        const rect = containerRef.current.getBoundingClientRect();
        // Fill from grid top to viewport bottom — no extra margin
        // Use visualViewport for accurate height on mobile (handles address bar)
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        setAvailableHeight(Math.max(300, viewportHeight - rect.top));
      }
    };

    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateDimensions);
    };

    updateDimensions();
    const timeoutId = setTimeout(updateDimensions, 100);
    // Re-measure after a longer delay for layout shifts (e.g. immersive mode)
    const timeoutId2 = setTimeout(updateDimensions, 500);

    window.addEventListener("resize", handleResize);

    // Watch for immersive mode toggle (data-immersive attribute on <html>)
    const observer = new MutationObserver(handleResize);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-immersive"],
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      observer.disconnect();
    };
  }, []);

  // Row height for fine vertical resize control.
  // Use a small fixed value (10px) so vertical snapping is precise.
  const rowHeight = useMemo(() => {
    if (isMobile) return 180;
    return 10;
  }, [isMobile]);

  // How many grid-h-units fill one visual row (to fill viewport height exactly)
  const cellsPerRow = useMemo(() => {
    if (isMobile) return 1;
    const cols = layout.cols || 2;
    const rows = layout.rows || Math.ceil(selectedStreams.length / cols);
    // Use floor to avoid overflow, then distribute remaining pixels
    return Math.max(1, Math.floor(availableHeight / rows / rowHeight));
  }, [availableHeight, layout.cols, layout.rows, selectedStreams.length, rowHeight, isMobile]);

  // Build a combined list of all grid item IDs: video cells + chat cells
  const allItemIds = useMemo(() => {
    const videoIds = selectedStreams.map((s) => s.id);
    const chatIds = selectedStreams
      .filter((s) => chatStreamIds.has(s.id))
      .map((s) => `${CHAT_KEY_PREFIX}${s.id}`);
    return [...videoIds, ...chatIds];
  }, [selectedStreams, chatStreamIds]);

  // Build a lookup map from grid item key -> stream
  const streamByItemKey = useMemo(() => {
    const map = new Map<string, Livestream>();
    for (const stream of selectedStreams) {
      map.set(stream.id, stream);
      if (chatStreamIds.has(stream.id)) {
        map.set(`${CHAT_KEY_PREFIX}${stream.id}`, stream);
      }
    }
    return map;
  }, [selectedStreams, chatStreamIds]);

  // Stable key for detecting item list changes (primitive string — safe for deps)
  const streamIdKey = useMemo(
    () => allItemIds.join(","),
    [allItemIds],
  );

  // Track previous values to detect changes
  const prevItemHRef = useRef(rowHeight);
  const prevAvailableHeightRef = useRef(availableHeight);

  // Rebuild or scale layout based on what changed
  useEffect(() => {
    const cols = isMobile ? 1 : layout.cols || 2;
    const layoutTypeChanged = prevLayoutTypeRef.current !== layout.type;
    const prevH = prevItemHRef.current;
    const prevAH = prevAvailableHeightRef.current;
    prevLayoutTypeRef.current = layout.type;
    prevItemHRef.current = rowHeight;
    prevAvailableHeightRef.current = availableHeight;

    // Full rebuild: layout button pressed or initial render
    if (layoutTypeChanged || internalLayout.length === 0) {
      setInternalLayout(
        buildGridLayout(allItemIds, cols, cellsPerRow, isMobile),
      );
      return;
    }

    // rowHeight change (container width change) — positions in grid units stay the same,
    // visual size adjusts automatically since rowHeight is in pixels
    if (prevH !== rowHeight) {
      // cellsPerRow may also have changed — rebuild to fill viewport
      setInternalLayout(
        buildGridLayout(allItemIds, cols, cellsPerRow, isMobile),
      );
      return;
    }

    // Incremental update: keep existing positions, add/remove items (video + chat cells)
    const currentIds = new Set(internalLayout.map((item) => item.i));
    const newItemIds = new Set(allItemIds);

    const kept = internalLayout.filter((item) => newItemIds.has(item.i));
    const addedIds = allItemIds.filter((id) => !currentIds.has(id));

    if (addedIds.length === 0 && kept.length === internalLayout.length) {
      return;
    }

    const newItems = addedIds.map((id, i) => {
      const totalIndex = kept.length + i;
      const col = totalIndex % cols;
      const row = Math.floor(totalIndex / cols);
      return {
        i: id,
        x: col * (GRID_COLS / cols),
        y: row * cellsPerRow,
        w: GRID_COLS / cols,
        h: cellsPerRow,
        minW: isMobile ? GRID_COLS : 2,
        minH: isMobile ? 1 : 2,
        static: isMobile,
      };
    });

    setInternalLayout(resolveOverlaps([...kept, ...newItems]));
  }, [streamIdKey, layout.type, layout.cols, rowHeight, cellsPerRow, isMobile, allItemIds, availableHeight]);

  // Apply externally provided grid positions (e.g. from a saved custom layout)
  const prevExternalRef = useRef(externalGridPositions);
  useEffect(() => {
    if (
      externalGridPositions &&
      externalGridPositions !== prevExternalRef.current &&
      externalGridPositions.length > 0
    ) {
      setInternalLayout(
        resolveOverlaps(
          externalGridPositions.map((pos) => ({
            ...pos,
            minW: 2,
            minH: 2,
          })),
        ),
      );
    }
    prevExternalRef.current = externalGridPositions;
  }, [externalGridPositions]);

  // Notify parent of grid position changes for custom layout saving
  useEffect(() => {
    if (onGridPositionsChange && internalLayout.length > 0) {
      onGridPositionsChange(
        internalLayout.map((item) => ({
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        })),
      );
    }
  }, [internalLayout, onGridPositionsChange]);

  const handleDragStart = () => {
    isDraggingRef.current = true;
    containerRef.current?.classList.add("is-dragging");
  };

  const handleDrag = () => {};

  const handleDragStop = (
    rglLayout: Layout,
    _oldItem: LayoutItem | null,
    _newItem: LayoutItem | null,
  ) => {
    containerRef.current?.classList.remove("is-dragging");
    isDraggingRef.current = false;
    // webcola VPSC resolves overlaps after drop
    setInternalLayout(resolveOverlaps(mergeLayout([...rglLayout], internalLayout, false)));
  };

  const handleResizeStart = () => {
    isResizingRef.current = true;
  };

  const handleResizeStop = (
    rglLayout: Layout,
    _oldItem: LayoutItem | null,
    _newItem: LayoutItem | null,
  ) => {
    isResizingRef.current = false;
    // webcola VPSC resolves overlaps caused by resize
    setInternalLayout(resolveOverlaps(mergeLayout([...rglLayout], internalLayout, true)));
  };

  // RGL's onLayoutChange is not used as the source of truth — our internalLayout
  // is managed via buildGridLayout, handleDragStop, and handleResizeStop.
  // Accepting it would overwrite our layout with RGL's defaults (w=1,h=1).
  const handleGridLayoutChange = () => {};

  // No streams selected
  if (selectedStreams.length === 0) {
    return (
      <GridContainer elevation={1} ref={containerRef}>
        <EmptyState>
          <Typography variant="h5" gutterBottom>
            {t("grid.empty.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("grid.empty.description")}
          </Typography>
        </EmptyState>
      </GridContainer>
    );
  }

  // Picture-in-picture layout (special case)
  if (layout.type === "picture-in-picture" && selectedStreams.length >= 2) {
    const mainStream = selectedStreams[0];
    const pipStream = selectedStreams[1];

    return (
      <GridContainer elevation={1} ref={containerRef}>
        <MainVideoContainer>
          <MemoizedPlayer
            key={mainStream.id}
            stream={mainStream}
            index={0}
            onRemoveStream={onRemoveStream}
          />
          <PipContainer pipPosition={layout.pipPosition || "bottom-right"}>
            <MemoizedPlayer
              key={pipStream.id}
              stream={pipStream}
              index={1}
              onRemoveStream={onRemoveStream}
            />
          </PipContainer>
        </MainVideoContainer>
      </GridContainer>
    );
  }

  // Regular grid layout with react-grid-layout
  return (
    <GridContainer
      elevation={1}
      ref={containerRef}
      style={{
        maxHeight: availableHeight,
        // Visual guide lines: 12 column divisions + row divisions matching layout
        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent calc(100% / 12 - 1px), rgba(128,128,128,0.12) calc(100% / 12 - 1px), rgba(128,128,128,0.12) calc(100% / 12)), repeating-linear-gradient(0deg, transparent, transparent ${cellsPerRow * rowHeight - 1}px, rgba(128,128,128,0.12) ${cellsPerRow * rowHeight - 1}px, rgba(128,128,128,0.12) ${cellsPerRow * rowHeight}px)`,
        backgroundAttachment: "local",
      }}
    >
      <GridLayout
        className="layout"
        layout={internalLayout}
        gridConfig={{
          cols: GRID_COLS,
          rowHeight,
          margin: [0, 0] as const,
          containerPadding: [0, 0] as const,
        }}
        width={containerWidth}
        dragConfig={{
          enabled: !isMobile,
          bounded: true,
          handle: ".drag-handle",
          cancel: ".no-drag",
        }}
        resizeConfig={{
          enabled: !isMobile,
          handles: ["s", "w", "e", "n", "sw", "nw", "se", "ne"],
        }}
        compactor={freePositionCompactor}
        onLayoutChange={handleGridLayoutChange}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        style={{ minHeight: availableHeight, width: "100%" }}
      >
        {allItemIds.map((itemId, index) => {
          const isChat = itemId.startsWith(CHAT_KEY_PREFIX);
          const stream = streamByItemKey.get(itemId);
          if (!stream) return null;

          return (
            <div
              key={itemId}
              style={GRID_ITEM_STYLE}
            >
              {isChat ? (
                <MemoizedChat
                  stream={stream}
                  index={index}
                  onRemoveChat={onRemoveChat}
                />
              ) : (
                <MemoizedPlayer
                  stream={stream}
                  index={index}
                  onRemoveStream={onRemoveStream}
                />
              )}
            </div>
          );
        })}
      </GridLayout>
    </GridContainer>
  );
};
