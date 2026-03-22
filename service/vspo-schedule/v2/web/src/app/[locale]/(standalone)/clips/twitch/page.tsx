import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { fetchSingleClipService } from "@/features/clips/api/clipService";
import { TwitchClips } from "@/features/clips/pages/TwitchClips/container";
import { paginateClips } from "@/features/clips/utils/clipUtils";
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
    title: t("twitchClips.title"),
    description: t("twitchClips.description"),
    alternates: generateAlternates("/clips/twitch"),
  };
}

export default async function TwitchClipsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  const currentPage = Number.parseInt(
    getSearchParam(resolvedSearchParams, "page", "0"),
    10,
  );
  const order = getSearchParam(resolvedSearchParams, "order", "desc") as
    | "asc"
    | "desc";
  const orderKey = getSearchParam(
    resolvedSearchParams,
    "orderKey",
    "viewCount",
  ) as "publishedAt" | "viewCount";
  const period = getSearchParam(resolvedSearchParams, "period", "week");

  const afterDate = getPeriodStartDate(period);

  const clipService = await fetchSingleClipService({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    platform: "twitch",
    clipType: "clip",
    order,
    orderKey,
    afterPublishedAtDate: afterDate,
  });

  // Apply pagination with the total count from the API
  const { clips: paginatedClips, pagination: finalPagination } = paginateClips(
    clipService.clips,
    currentPage,
    ITEMS_PER_PAGE,
    clipService.pagination.totalItems,
  );

  const lastUpdateTimestamp = getCurrentUTCDate().getTime();

  const t = await getTranslations({ locale, namespace: "clips" });
  const title = t("twitchClips.title");

  return (
    <ContentLayout
      title={title}
      path="/twitch-clips"
      lastUpdateTimestamp={lastUpdateTimestamp}
    >
      <TwitchClips
        clips={paginatedClips}
        pagination={finalPagination}
        lastUpdateTimestamp={lastUpdateTimestamp}
        order={order}
        orderKey={orderKey}
        currentPeriod={period}
      />
    </ContentLayout>
  );
}
