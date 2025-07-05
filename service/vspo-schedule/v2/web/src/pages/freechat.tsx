import { FreechatPage } from "@/features/freechat";
import {
  type FreechatPageProps,
  getFreechatServerSideProps,
} from "@/features/freechat/pages/FreechatPage/serverSideProps";
import { ContentLayout } from "@/features/shared/components/Layout";
import type { NextPageWithLayout } from "./_app";

const FreechatPageWrapper: NextPageWithLayout<FreechatPageProps> = (
  pageProps,
) => {
  return <FreechatPage freechats={pageProps.freechats} />;
};

FreechatPageWrapper.getLayout = (page, pageProps) => (
  <ContentLayout
    title={pageProps.meta.title}
    description={pageProps.meta.description}
    lastUpdateTimestamp={pageProps.lastUpdateTimestamp}
    path="/freechat"
    maxPageWidth="lg"
    padTop
  >
    {page}
  </ContentLayout>
);

export const getServerSideProps = getFreechatServerSideProps;

export default FreechatPageWrapper;
