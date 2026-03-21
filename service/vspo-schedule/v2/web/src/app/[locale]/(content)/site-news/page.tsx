import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { SiteNewsPageContainer } from "@/features/site-news/pages/SiteNewsPage/container";
import { getAllSiteNewsItems } from "@/lib/markdown";

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
  const t = await getTranslations({ locale, namespace: "site-news" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${t("title")}`,
    description: t("description"),
  };
}

export default async function SiteNewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const siteNewsItems = await getAllSiteNewsItems(locale);

  return (
    <ContentLayout title="Site News" path="/site-news" maxPageWidth="md" padTop>
      <SiteNewsPageContainer siteNewsItems={siteNewsItems} />
    </ContentLayout>
  );
}
