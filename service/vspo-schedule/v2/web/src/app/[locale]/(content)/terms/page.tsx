import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TermsPagePresenter } from "@/features/legal-documents/pages/TermsPage/presenter";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";

export async function generateStaticParams() {
  return [
    { locale: "en" },
    { locale: "ja" },
    { locale: "cn" },
    { locale: "tw" },
    { locale: "ko" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${t("title")}`,
    description: t("description"),
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

  return (
    <ContentLayout title={t("title")} path="/terms" maxPageWidth="lg" padTop>
      <TermsPagePresenter />
    </ContentLayout>
  );
}
