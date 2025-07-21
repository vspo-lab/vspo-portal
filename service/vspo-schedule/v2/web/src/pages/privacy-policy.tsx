import PrivacyPolicyPageComponent from "@/features/legal-documents/pages/PrivacyPolicyPage";
import {
  type PrivacyPolicyPageProps,
  getStaticProps as privacyGetStaticProps,
} from "@/features/legal-documents/pages/PrivacyPolicyPage/serverSideProps";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import type { NextPageWithLayout } from "./_app";

export const getStaticProps = privacyGetStaticProps;

const PrivacyPolicy: NextPageWithLayout<PrivacyPolicyPageProps> = () => {
  return <PrivacyPolicyPageComponent />;
};

PrivacyPolicy.getLayout = (page, pageProps) => {
  return (
    <ContentLayout
      title={pageProps.meta.title}
      description={pageProps.meta.description}
      path="/privacy-policy"
      maxPageWidth="lg"
      padTop
    >
      {page}
    </ContentLayout>
  );
};

export default PrivacyPolicy;
