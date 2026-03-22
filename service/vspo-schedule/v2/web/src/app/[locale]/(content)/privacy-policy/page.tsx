import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PrivacyPolicyPagePresenter } from "@/features/legal-documents/pages/PrivacyPolicyPage/presenter";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { generateAlternates } from "@/lib/metadata";

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
  const t = await getTranslations({ locale, namespace: "privacy" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${t("title")}`,
    description: t("description"),
    alternates: generateAlternates("/privacy-policy"),
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return (
    <ContentLayout
      title={t("title")}
      path="/privacy-policy"
      maxPageWidth="lg"
      padTop
    >
      <PrivacyPolicyPagePresenter />
    </ContentLayout>
  );
}
