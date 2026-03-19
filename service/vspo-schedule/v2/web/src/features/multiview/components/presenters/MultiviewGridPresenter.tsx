import { Livestream } from "@/features/shared/domain";
import {
  Box,
  Paper,
  Typography,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import React, { useState, useRef, useEffect, useMemo } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { MultiviewLayout } from "../../hooks/useMultiviewLayout";
// gridSwap utilities kept for potential future use but not needed
// with preventCollision={true} on GridLayout
import { scaledBorderRadius } from "../../utils/theme";
import { ChatCell, VideoPlayer } from "../containers";

/** Prefix used for chat cell grid item keys to distinguish from video cells. */
const CHAT_KEY_PREFIX = "chat-";

/** Static style for grid item wrappers — hoisted to avoid per-render allocation. */
const GRID_ITEM_STYLE: React.CSSProperties = {
  display: "flex",
  height: "100%",
  width: "100%",
};

// Grid cell size for 12 columns — used for background grid lines
const GRID_COLS = 120;

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
  // Resize handles on all edges — hidden by default, visible on grid item hover
  "& .react-grid-item .react-resizable-handle": {
    position: "absolute",
    background: "transparent",
    zIndex: 2,
    opacity: 0,
    transition: "opacity 0.15s",
    "&::after": {
      content: '""',
      position: "absolute",
      backgroundColor: "rgba(128,128,128,0.3)",
      borderRadius: 2,
    },
    "&:hover::after": {
      backgroundColor: "rgba(128,128,128,0.6)",
    },
  },
  "& .react-grid-item:hover .react-resizable-handle": {
    opacity: 1,
  },
  // Corner handles
  "& .react-resizable-handle-se": {
    width: 16, height: 16, right: 0, bottom: 0, cursor: "se-resize",
    "&::after": { width: 8, height: 8, right: 2, bottom: 2 },
  },
  "& .react-resizable-handle-sw": {
    width: 16, height: 16, left: 0, bottom: 0, cursor: "sw-resize",
    "&::after": { width: 8, height: 8, left: 2, bottom: 2 },
  },
  "& .react-resizable-handle-ne": {
    width: 16, height: 16, right: 0, top: 0, cursor: "ne-resize",
    "&::after": { width: 8, height: 8, right: 2, top: 2 },
  },
  "& .react-resizable-handle-nw": {
    width: 16, height: 16, left: 0, top: 0, cursor: "nw-resize",
    "&::after": { width: 8, height: 8, left: 2, top: 2 },
  },
  // Edge handles
  "& .react-resizable-handle-n": {
    width: "100%", height: 8, top: 0, left: 0, cursor: "n-resize",
    "&::after": { width: 40, height: 3, top: 2, left: "calc(50% - 20px)" },
  },
  "& .react-resizable-handle-s": {
    width: "100%", height: 8, bottom: 0, left: 0, cursor: "s-resize",
    "&::after": { width: 40, height: 3, bottom: 2, left: "calc(50% - 20px)" },
  },
  "& .react-resizable-handle-e": {
    width: 8, height: "100%", right: 0, top: 0, cursor: "e-resize",
    "&::after": { width: 3, height: 40, right: 2, top: "calc(50% - 20px)" },
  },
  "& .react-resizable-handle-w": {
    width: 8, height: "100%", left: 0, top: 0, cursor: "w-resize",
    "&::after": { width: 3, height: 40, left: 2, top: "calc(50% - 20px)" },
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
const buildGridLayout = (
  itemIds: string[],
  cols: number,
  cellsPerRow: number,
  isMobile: boolean,
): GridLayout.Layout[] => {
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
  const { t } = useTranslation("multiview");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [availableHeight, setAvailableHeight] = useState(600);
  // Drag state
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  // Internal layout state — only reset when layout button is pressed
  const [internalLayout, setInternalLayout] = useState<GridLayout.Layout[]>([]);
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

    setInternalLayout([...kept, ...newItems]);
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
        externalGridPositions.map((pos) => ({
          ...pos,
          minW: 2,
          minH: 2,
        })),
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

  // Library handles collision prevention during drag — no custom swap needed
  const handleDrag = () => {};

  const handleDragStop = (
    newLayout: GridLayout.Layout[],
    _oldItem: GridLayout.Layout,
    _newItem: GridLayout.Layout,
  ) => {
    containerRef.current?.classList.remove("is-dragging");

    // Library handles collision prevention — just accept the new layout
    setInternalLayout(newLayout);

    requestAnimationFrame(() => {
      isDraggingRef.current = false;
    });
  };

  const handleResizeStart = () => {
    isResizingRef.current = true;
  };

  const handleResizeStop = (
    newLayout: GridLayout.Layout[],
    _oldItem: GridLayout.Layout,
    newItem: GridLayout.Layout,
  ) => {
    // Library handles collision prevention — just accept the new layout
    setInternalLayout(newLayout);
    // Delay clearing so onLayoutChange after resize is ignored
    requestAnimationFrame(() => {
      isResizingRef.current = false;
    });
  };

  const handleGridLayoutChange = (_newLayout: GridLayout.Layout[]) => {
    // Layout is fully managed by our custom logic (buildGridLayout, handleDragStop, handleResizeStop).
    // Ignoring react-grid-layout's onLayoutChange prevents it from overwriting our layout
    // with its internal calculations (which can produce broken w=1/h=1 items).
  };

  // No streams selected
  if (selectedStreams.length === 0) {
    return (
      <GridContainer elevation={1} ref={containerRef}>
        <EmptyState>
          <Typography variant="h5" gutterBottom>
            {t("grid.empty.title", "配信を選択してください")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(
              "grid.empty.description",
              "右側のパネルから配信を選択するか、URLを入力して追加してください",
            )}
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
        cols={GRID_COLS}
        rowHeight={rowHeight}
        width={containerWidth}
        isDraggable={!isMobile}
        isResizable={!isMobile}
        resizeHandles={["s", "w", "e", "n", "sw", "nw", "se", "ne"]}
        onLayoutChange={handleGridLayoutChange}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        draggableHandle=".drag-handle"
        draggableCancel=".no-drag"
        compactType={null}
        preventCollision={true}
        allowOverlap={false}
        isBounded={true}
        margin={[0, 0]}
        containerPadding={[0, 0]}
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
