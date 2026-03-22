"use client";

import { useEffect, useState } from "react";
import type { Clip, Pagination } from "@/features/shared/domain";
import { Presenter } from "./presenter";

type TwitchClipsProps = {
  clips: Clip[];
  lastUpdateTimestamp: number;
  pagination: Pagination;
  order: string;
  orderKey: string;
  currentPeriod: string;
};

// Container component (page logic)
export const TwitchClips: React.FC<TwitchClipsProps> = (props) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(true);

  useEffect(() => {
    setIsProcessing(false);
  }, []);

  // Use the presenter component
  return (
    <Presenter
      clips={props.clips}
      pagination={props.pagination}
      order={props.order}
      isProcessing={isProcessing}
      setIsProcessing={setIsProcessing}
      currentPeriod={props.currentPeriod}
    />
  );
};
