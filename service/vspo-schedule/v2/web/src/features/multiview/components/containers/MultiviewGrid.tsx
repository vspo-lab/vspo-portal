"use client";

import { Livestream } from "@/features/shared/domain";
import { useMediaQuery, useTheme } from "@mui/material";
import dynamic from "next/dynamic";
import React from "react";
import { LayoutType, useMultiviewLayout } from "../../hooks/useMultiviewLayout";

const MultiviewGridPresenter = dynamic(
  () =>
    import("../presenters/MultiviewGridPresenter").then((m) => ({
      default: m.MultiviewGridPresenter,
    })),
  { ssr: false },
);

const EMPTY_SET = new Set<string>();

export type MultiviewGridProps = {
  selectedStreams: Livestream[];
  selectedLayout?: LayoutType;
  onRemoveStream: (streamId: string) => void;
  onGridPositionsChange?: (
    positions: Array<{ i: string; x: number; y: number; w: number; h: number }>,
  ) => void;
  chatStreamIds?: ReadonlySet<string>;
  onRemoveChat?: (streamId: string) => void;
  externalGridPositions?: ReadonlyArray<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
};

export const MultiviewGrid: React.FC<MultiviewGridProps> = ({
  selectedStreams,
  selectedLayout,
  onRemoveStream,
  onGridPositionsChange,
  chatStreamIds = EMPTY_SET,
  onRemoveChat = () => {},
  externalGridPositions,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { layout } = useMultiviewLayout({
    streamCount: selectedStreams.length,
    isMobile,
    initialLayout: selectedLayout,
  });

  return (
    <MultiviewGridPresenter
      selectedStreams={selectedStreams}
      chatStreamIds={chatStreamIds}
      layout={layout}
      onRemoveStream={onRemoveStream}
      onRemoveChat={onRemoveChat}
      onGridPositionsChange={onGridPositionsChange}
      externalGridPositions={externalGridPositions}
    />
  );
};
