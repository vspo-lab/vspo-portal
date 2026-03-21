import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { SiteNewsDetailPageContainer } from "@/features/site-news/pages/SiteNewsDetailPage/container";
import { getSiteNewsItem } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const siteNewsItem = await getSiteNewsItem(locale, id);
  if (!siteNewsItem) return { title: "Not Found" };
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${siteNewsItem.title}`,
    description: siteNewsItem.content?.slice(0, 160),
  };
}

export default async function SiteNewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const siteNewsItem = await getSiteNewsItem(locale, id);
  if (!siteNewsItem) notFound();

  return (
    <ContentLayout
      title={siteNewsItem.title}
      path={`/site-news/${id}`}
      maxPageWidth="md"
      padTop
    >
      <SiteNewsDetailPageContainer siteNewsItem={siteNewsItem} />
    </ContentLayout>
  );
}
