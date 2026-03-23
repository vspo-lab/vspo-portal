"use client";

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
  // Use the presenter component
  return (
    <Presenter
      clips={props.clips}
      pagination={props.pagination}
      orderKey={props.orderKey}
      currentPeriod={props.currentPeriod}
    />
  );
};
