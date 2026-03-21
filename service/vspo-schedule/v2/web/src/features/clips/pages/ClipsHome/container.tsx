"use client";

import { useEffect, useState } from "react";
import type { Channel, Clip } from "@/features/shared/domain";
import { Presenter } from "./presenter";

type ClipsHomeProps = {
  popularYoutubeClips: Clip[];
  popularShortsClips: Clip[];
  popularTwitchClips: Clip[];
  vspoMembers: Channel[];
  lastUpdateTimestamp: number;
  currentPeriod: string;
};

// Container component (page logic)
export const ClipsHome: React.FC<ClipsHomeProps> = (props) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(true);

  useEffect(() => {
    setIsProcessing(false);
  }, []);

  // Use the presenter component
  return (
    <Presenter
      popularYoutubeClips={props.popularYoutubeClips}
      popularShortsClips={props.popularShortsClips}
      popularTwitchClips={props.popularTwitchClips}
      // vspoMembers={props.vspoMembers}
      isProcessing={isProcessing}
      currentPeriod={props.currentPeriod}
    />
  );
};
