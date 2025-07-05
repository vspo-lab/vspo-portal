import TermsPageComponent from "@/features/legal-documents/pages/TermsPage";
import {
  type TermsPageProps,
  getStaticProps as termsGetStaticProps,
} from "@/features/legal-documents/pages/TermsPage/serverSideProps";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import React from "react";
import type { NextPageWithLayout } from "./_app";

export const getStaticProps = termsGetStaticProps;

const Terms: NextPageWithLayout<TermsPageProps> = () => {
  return <TermsPageComponent />;
};

Terms.getLayout = (page, pageProps) => {
  return (
    <ContentLayout
      title={pageProps.meta.title}
      description={pageProps.meta.description}
      path="/terms"
      maxPageWidth="lg"
      padTop
    >
      {page}
    </ContentLayout>
  );
};

export default Terms;
