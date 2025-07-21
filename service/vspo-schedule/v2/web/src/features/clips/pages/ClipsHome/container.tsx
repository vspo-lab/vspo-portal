import { useEffect, useState } from "react";
import { ContentLayout } from "@/features/shared/components/Layout";
import type { Channel, Clip } from "@/features/shared/domain";
import type { NextPageWithLayout } from "@/pages/_app";
import { Presenter } from "./presenter";

export type ClipsHomeProps = {
  popularYoutubeClips: Clip[];
  popularShortsClips: Clip[];
  popularTwitchClips: Clip[];
  vspoMembers: Channel[];
  lastUpdateTimestamp: number;
  currentPeriod: string;
  meta: {
    title: string;
    description: string;
  };
};

// Container component (page logic)
export const ClipsHome: NextPageWithLayout<ClipsHomeProps> = (props) => {
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

// Layout configuration
ClipsHome.getLayout = (page, pageProps) => {
  return (
    <ContentLayout
      title={pageProps.meta.title}
      description={pageProps.meta.description}
      lastUpdateTimestamp={pageProps.lastUpdateTimestamp}
      path="/clips"
    >
      {page}
    </ContentLayout>
  );
};
