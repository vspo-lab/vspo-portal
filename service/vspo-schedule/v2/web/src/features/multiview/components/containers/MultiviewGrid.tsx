import type { Livestream } from "@/features/shared/domain";
import { useMediaQuery, useTheme } from "@mui/material";
import type React from "react";
import { useCallback } from "react";
import type GridLayout from "react-grid-layout";
import {
  type LayoutType,
  useMultiviewLayout,
} from "../../hooks/useMultiviewLayout";
import { MultiviewGridPresenter } from "../presenters";

export type MultiviewGridProps = {
  selectedStreams: Livestream[];
  selectedLayout?: LayoutType;
  onRemoveStream: (streamId: string) => void;
  onStreamReorder?: (activeId: string, overId: string) => void;
  onLayoutChange?: (layout: GridLayout.Layout[]) => void;
  savedGridLayout?: Array<{ x: number; y: number; w: number; h: number }>;
};

export const MultiviewGrid: React.FC<MultiviewGridProps> = ({
  selectedStreams,
  selectedLayout,
  onRemoveStream,
  onStreamReorder,
  onLayoutChange,
  savedGridLayout,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Use the layout hook for layout configuration
  const { layout } = useMultiviewLayout({
    streamCount: selectedStreams.length,
    isMobile,
    initialLayout: selectedLayout,
  });

  const handleRemoveStream = useCallback(
    (streamId: string) => {
      onRemoveStream(streamId);
    },
    [onRemoveStream],
  );

  const handleStreamReorder = useCallback(
    (activeId: string, overId: string) => {
      onStreamReorder?.(activeId, overId);
    },
    [onStreamReorder],
  );

  return (
    <MultiviewGridPresenter
      selectedStreams={selectedStreams}
      layout={layout}
      onRemoveStream={handleRemoveStream}
      onStreamReorder={handleStreamReorder}
      onLayoutChange={onLayoutChange}
      savedGridLayout={savedGridLayout}
    />
  );
};
