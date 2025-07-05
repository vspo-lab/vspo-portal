import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import SiteNewsPageComponent from "@/features/site-news/pages/SiteNewsPage";
import {
  type SiteNewsPageProps,
  getServerSideProps as siteNewsGetServerSideProps,
} from "@/features/site-news/pages/SiteNewsPage/serverSideProps";
import type { NextPageWithLayout } from "../_app";

export const getServerSideProps = siteNewsGetServerSideProps;

const SiteNewsPage: NextPageWithLayout<SiteNewsPageProps> = ({
  siteNewsItems,
}) => {
  return <SiteNewsPageComponent siteNewsItems={siteNewsItems} />;
};

SiteNewsPage.getLayout = (page, pageProps) => {
  return (
    <ContentLayout
      title={pageProps.meta.title}
      description={pageProps.meta.description}
      path="/site-news"
      maxPageWidth="md"
    >
      {page}
    </ContentLayout>
  );
};

export default SiteNewsPage;
