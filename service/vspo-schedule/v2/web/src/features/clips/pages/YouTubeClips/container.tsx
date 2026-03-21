"use client";

import { useEffect, useState } from "react";
import type { Clip, Pagination } from "../../../shared/domain/clip";
import { Presenter } from "./presenter";

type YouTubeClipsProps = {
  clips: Clip[];
  lastUpdateTimestamp: number;
  pagination: Pagination;
  order: string;
  orderKey: string;
  currentPeriod: string;
};

// Container component (page logic)
export const YouTubeClips: React.FC<YouTubeClipsProps> = (props) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(true);

  useEffect(() => {
    setIsProcessing(false);
  }, []);

  // Use the presenter component
  return (
    <Presenter
      clips={props.clips}
      pagination={props.pagination}
      orderKey={props.orderKey}
      isProcessing={isProcessing}
      currentPeriod={props.currentPeriod}
    />
  );
};
