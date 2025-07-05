import { ScheduleStatus } from "@/features/schedule";
import {
  type ScheduleStatusPageProps,
  getLivestreamsServerSideProps,
} from "@/features/schedule/pages/ScheduleStatus/serverSideProps";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import type { NextPageWithLayout } from "../_app";

const SchedulePage: NextPageWithLayout<ScheduleStatusPageProps> = (
  pageProps,
) => {
  return (
    <ScheduleStatus
      livestreams={pageProps.livestreams}
      events={pageProps.events}
      timeZone={pageProps.timeZone}
      locale={pageProps.locale}
      liveStatus={pageProps.liveStatus}
    />
  );
};

SchedulePage.getLayout = (page, pageProps: ScheduleStatusPageProps) => {
  return (
    <ContentLayout
      title={pageProps.meta.title}
      description={pageProps.meta.description}
      lastUpdateTimestamp={pageProps.lastUpdateTimestamp}
      footerMessage={pageProps.footerMessage}
      headTitle={pageProps.meta.headTitle}
      path={`/${pageProps.locale}/schedule/${pageProps.liveStatus}`}
    >
      {page}
    </ContentLayout>
  );
};

export const getServerSideProps = getLivestreamsServerSideProps;

export default SchedulePage;
