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
import React, { useState, useCallback, useRef, useEffect } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { MultiviewLayout } from "../../hooks/useMultiviewLayout";
import { VideoPlayer } from "../containers";

const GridContainer = styled(Paper)<{ isFullscreen?: boolean }>(
  ({ theme, isFullscreen }) => ({
    minHeight: isFullscreen ? "100vh" : "600px",
    padding: theme.spacing(isFullscreen ? 0 : 0.1),
    backgroundColor: "white",
    borderRadius: isFullscreen ? 0 : theme.shape.borderRadius * 2,
    boxShadow: isFullscreen ? "none" : theme.shadows[4],
    border: isFullscreen ? "none" : `1px solid ${theme.palette.divider}`,
    position: isFullscreen ? "fixed" : "relative",
    top: isFullscreen ? 0 : "auto",
    left: isFullscreen ? 0 : "auto",
    right: isFullscreen ? 0 : "auto",
    bottom: isFullscreen ? 0 : "auto",
    width: isFullscreen ? "100vw" : "100%",
    height: isFullscreen ? "100vh" : "auto",
    zIndex: isFullscreen ? 9999 : "auto",
    overflow: "hidden",
    [theme.breakpoints.down("md")]: {
      minHeight: isFullscreen ? "100vh" : "600px",
      padding: theme.spacing(isFullscreen ? 0 : 0.1),
    },
    [theme.getColorSchemeSelector("dark")]: {
      backgroundColor: theme.vars.palette.customColors.gray,
    },
  }),
);

// VideoGrid is no longer used with react-grid-layout

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
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(1),
  [theme.breakpoints.down("md")]: {
    height: "300px",
  },
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.darkGray,
    color: "white",
  },
}));

export type MultiviewGridPresenterProps = {
  selectedStreams: Livestream[];
  layout: MultiviewLayout;
  onRemoveStream: (streamId: string) => void;
  onStreamReorder?: (activeId: string, overId: string) => void;
  onLayoutChange?: (layout: GridLayout.Layout[]) => void;
  savedGridLayout?: Array<{ x: number; y: number; w: number; h: number }>;
};

export const MultiviewGridPresenter: React.FC<MultiviewGridPresenterProps> = ({
  selectedStreams,
  layout,
  onRemoveStream,
  onStreamReorder,
  onLayoutChange,
  savedGridLayout,
}) => {
  const { t } = useTranslation("multiview");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Account for padding when calculating width
        const computedStyle = window.getComputedStyle(containerRef.current);
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
        const actualWidth = isFullscreen
          ? window.innerWidth
          : containerRef.current.offsetWidth - paddingLeft - paddingRight;
        setContainerWidth(actualWidth);
      }
    };

    // Update immediately and after a small delay to ensure proper calculation
    updateWidth();
    const timeoutId = setTimeout(updateWidth, 100);

    window.addEventListener("resize", updateWidth);
    return () => {
      window.removeEventListener("resize", updateWidth);
      clearTimeout(timeoutId);
    };
  }, [isFullscreen]);

  const handleRemoveStream = (streamId: string) => {
    onRemoveStream(streamId);
  };

  // Generate layout items for react-grid-layout
  const generateLayoutItems = useCallback(() => {
    const cols = isMobile ? 1 : layout.cols || 2;
    const rows = layout.rows || Math.ceil(selectedStreams.length / cols);

    // Check if we have saved grid layout
    if (savedGridLayout && savedGridLayout.length === selectedStreams.length) {
      return savedGridLayout.map((item, index) => ({
        i: `stream-${index}`,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: isMobile ? 12 : 2,
        minH: 1,
        static: isMobile,
      }));
    }

    // For equal grid layout
    if (layout.type !== "picture-in-picture") {
      return selectedStreams.map((_, index) => {
        if (isMobile) {
          // Stack vertically on mobile
          return {
            i: `stream-${index}`,
            x: 0,
            y: index,
            w: 12,
            h: 1,
            minW: 12,
            minH: 1,
            static: true, // Prevent dragging on mobile
          };
        }

        const col = index % cols;
        const row = Math.floor(index / cols);

        return {
          i: `stream-${index}`,
          x: col * (12 / cols),
          y: row,
          w: 12 / cols,
          h: 1,
          minW: 3,
          minH: 1,
        };
      });
    }

    // For picture-in-picture layout
    if (layout.type === "picture-in-picture") {
      return selectedStreams.map((_, index) => {
        if (index === 0) {
          // Main video
          return {
            i: `stream-${index}`,
            x: 0,
            y: 0,
            w: 12,
            h: rows,
            minW: 8,
            minH: 2,
          };
        } else {
          // PiP videos
          return {
            i: `stream-${index}`,
            x: 9,
            y: (index - 1) * 0.5,
            w: 3,
            h: 0.5,
            minW: 2,
            minH: 0.5,
          };
        }
      });
    }

    // For custom layout (allow free drag and resize)
    return selectedStreams.map((_, index) => ({
      i: `stream-${index}`,
      x: (index % 3) * 4,
      y: Math.floor(index / 3),
      w: 4,
      h: 1,
      minW: 2,
      minH: 1,
    }));
  }, [layout, selectedStreams, isMobile, savedGridLayout]);

  const layoutItems = generateLayoutItems();

  const handleLayoutChange = (newLayout: GridLayout.Layout[]) => {
    // Always notify parent about layout changes
    if (onLayoutChange) {
      onLayoutChange(newLayout);
    }

    if (!onStreamReorder) return;

    // Create a map of current positions
    const currentPositions = new Map<string, number>();
    layoutItems.forEach((item, index) => {
      currentPositions.set(item.i, index);
    });

    // Create a map of new positions based on grid coordinates
    const newPositions = new Map<string, { x: number; y: number }>();
    newLayout.forEach((item) => {
      newPositions.set(item.i, { x: item.x, y: item.y });
    });

    // Sort items by their new positions (y first, then x)
    const sortedIds = Array.from(newPositions.entries())
      .sort((a, b) => {
        if (a[1].y !== b[1].y) return a[1].y - b[1].y;
        return a[1].x - b[1].x;
      })
      .map(([id]) => id);

    // Build the new order of streams
    const newStreamOrder: Livestream[] = [];
    sortedIds.forEach((id) => {
      const currentIndex = currentPositions.get(id);
      if (currentIndex !== undefined && selectedStreams[currentIndex]) {
        newStreamOrder.push(selectedStreams[currentIndex]);
      }
    });

    // Check if order changed
    const orderChanged = newStreamOrder.some(
      (stream, index) => stream.id !== selectedStreams[index].id,
    );

    if (orderChanged) {
      // Find which two items were swapped
      for (let i = 0; i < newStreamOrder.length; i++) {
        if (newStreamOrder[i].id !== selectedStreams[i].id) {
          // Find where this stream was originally
          const originalIndex = selectedStreams.findIndex(
            (s) => s.id === newStreamOrder[i].id,
          );
          if (originalIndex !== -1 && originalIndex !== i) {
            // Swap the two streams
            onStreamReorder(
              selectedStreams[i].id,
              selectedStreams[originalIndex].id,
            );
            break;
          }
        }
      }
    }
  };

  // No streams selected
  if (selectedStreams.length === 0) {
    return (
      <GridContainer
        elevation={1}
        ref={containerRef}
        isFullscreen={isFullscreen}
      >
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
      <GridContainer
        elevation={1}
        ref={containerRef}
        isFullscreen={isFullscreen}
      >
        <MainVideoContainer>
          <VideoPlayer
            key={mainStream.id}
            stream={mainStream}
            index={0}
            onRemove={() => handleRemoveStream(mainStream.id)}
          />
          <PipContainer pipPosition={layout.pipPosition || "bottom-right"}>
            <VideoPlayer
              key={pipStream.id}
              stream={pipStream}
              index={1}
              onRemove={() => handleRemoveStream(pipStream.id)}
            />
          </PipContainer>
        </MainVideoContainer>
      </GridContainer>
    );
  }

  // Regular grid layout with react-grid-layout
  return (
    <GridContainer elevation={1} ref={containerRef} isFullscreen={isFullscreen}>
      <GridLayout
        className="layout"
        layout={layoutItems}
        cols={12}
        rowHeight={
          isFullscreen
            ? Math.floor((window.innerHeight - 20) / (layout.rows || 2))
            : isMobile
              ? 180
              : Math.floor(((containerWidth - 8) / (layout.cols || 2)) * 0.5625) // 16:9 aspect ratio
        }
        width={containerWidth}
        isDraggable={!isMobile}
        isResizable={!isMobile}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        compactType={null}
        preventCollision={true}
        margin={isFullscreen ? [0, 0] : [2, 2]}
        containerPadding={[0, 0]}
        style={{ minHeight: isFullscreen ? "100vh" : "auto", width: "100%" }}
      >
        {selectedStreams.map((stream, index) => (
          <div
            key={`stream-${index}`}
            style={{
              display: "flex",
              height: "100%",
              width: "100%",
              overflow: "hidden",
            }}
          >
            <VideoPlayer
              stream={stream}
              index={selectedStreams.findIndex((s) => s.id === stream.id)}
              onRemove={() => handleRemoveStream(stream.id)}
            />
          </div>
        ))}
      </GridLayout>
    </GridContainer>
  );
};
