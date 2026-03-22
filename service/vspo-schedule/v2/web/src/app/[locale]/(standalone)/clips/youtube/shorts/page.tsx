import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { fetchSingleClipService } from "@/features/clips/api/clipService";
import { YouTubeClips } from "@/features/clips/pages/YouTubeClips/container";
import {
  getPeriodStartDate,
  getSearchParam,
  ITEMS_PER_PAGE,
} from "@/features/clips/utils/params";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { generateAlternates } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "clips" });
  return {
    title: t("youtubeShorts.title"),
    description: t("youtubeShorts.description"),
    alternates: generateAlternates("/clips/youtube/shorts"),
  };
}

export default async function YouTubeShortsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  const order = getSearchParam(resolvedSearchParams, "order", "desc");
  const orderKey = getSearchParam(
    resolvedSearchParams,
    "orderKey",
    "publishedAt",
  );
  const page = Number.parseInt(
    getSearchParam(resolvedSearchParams, "page", "0"),
    10,
  );
  const period = getSearchParam(resolvedSearchParams, "period", "week");

  const afterDate = getPeriodStartDate(period);

  const clipService = await fetchSingleClipService({
    platform: "youtube",
    page,
    limit: ITEMS_PER_PAGE,
    clipType: "short",
    order: order as "asc" | "desc",
    orderKey: orderKey as "publishedAt" | "viewCount",
    afterPublishedAtDate: afterDate,
  });

  const lastUpdateTimestamp = getCurrentUTCDate().getTime();

  const t = await getTranslations({ locale, namespace: "clips" });
  const title = t("youtubeShorts.title");

  return (
    <ContentLayout
      title={title}
      path="/clips"
      lastUpdateTimestamp={lastUpdateTimestamp}
    >
      <YouTubeClips
        clips={clipService.clips}
        lastUpdateTimestamp={lastUpdateTimestamp}
        pagination={clipService.pagination}
        order={order || "desc"}
        orderKey={orderKey || "publishedAt"}
        currentPeriod={period}
      />
    </ContentLayout>
  );
}
