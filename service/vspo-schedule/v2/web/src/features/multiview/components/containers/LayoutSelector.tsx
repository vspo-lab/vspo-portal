"use client";

import React from "react";
import { LayoutType } from "../../hooks/useMultiviewLayout";
import { LayoutSelectorPresenter } from "../presenters/LayoutSelectorPresenter";

export type LayoutSelectorProps = {
  selectedLayout: LayoutType;
  availableLayouts: LayoutType[];
  streamCount: number;
  onLayoutChange: (layout: LayoutType) => void;
};

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  selectedLayout,
  availableLayouts,
  streamCount,
  onLayoutChange,
}) => {
  return (
    <LayoutSelectorPresenter
      selectedLayout={selectedLayout}
      availableLayouts={availableLayouts}
      streamCount={streamCount}
      onLayoutChange={onLayoutChange}
    />
  );
};
