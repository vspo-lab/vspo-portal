"use client";

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
  // Use the presenter component
  return (
    <Presenter
      clips={props.clips}
      pagination={props.pagination}
      order={props.order}
      currentPeriod={props.currentPeriod}
    />
  );
};
