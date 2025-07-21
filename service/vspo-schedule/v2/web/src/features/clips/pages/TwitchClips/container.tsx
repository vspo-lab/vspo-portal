import { useEffect, useState } from "react";
import { ContentLayout } from "@/features/shared/components/Layout";
import type { Clip, Pagination } from "@/features/shared/domain";
import type { NextPageWithLayout } from "@/pages/_app";
import { Presenter } from "./presenter";

export type TwitchClipsProps = {
  clips: Clip[];
  lastUpdateTimestamp: number;
  meta: {
    title: string;
    description: string;
  };
  pagination: Pagination;
  order: string;
  orderKey: string;
  currentPeriod: string;
};

// Container component (page logic)
export const TwitchClips: NextPageWithLayout<TwitchClipsProps> = (props) => {
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

// Layout configuration
TwitchClips.getLayout = (page, pageProps) => {
  return (
    <ContentLayout
      title={pageProps.meta.title}
      description={pageProps.meta.description}
      lastUpdateTimestamp={pageProps.lastUpdateTimestamp}
      path="/twitch-clips"
    >
      {page}
    </ContentLayout>
  );
};
