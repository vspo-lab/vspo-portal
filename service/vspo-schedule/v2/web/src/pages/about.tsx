import AboutPageComponent from "@/features/about/pages/AboutPage";
import {
  type AboutPageProps,
  getServerSideProps as aboutGetServerSideProps,
} from "@/features/about/pages/AboutPage/serverSideProps";
import { ContentLayout } from "@/features/shared/components/Layout";
import type { NextPageWithLayout } from "./_app";

export const getServerSideProps = aboutGetServerSideProps;

const AboutPage: NextPageWithLayout<AboutPageProps> = ({ sections }) => {
  return <AboutPageComponent sections={sections} />;
};

AboutPage.getLayout = (page, pageProps) => {
  return (
    <ContentLayout
      title={pageProps.meta.title}
      description={pageProps.meta.description}
      path="/about"
      maxPageWidth="md"
      padTop
    >
      {page}
    </ContentLayout>
  );
};

export default AboutPage;
