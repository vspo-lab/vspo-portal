import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { fetchSingleClipService } from "@/features/clips/api/clipService";
import { TwitchClips } from "@/features/clips/pages/TwitchClips/container";
import { paginateClips } from "@/features/clips/utils/clipUtils";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { generateAlternates } from "@/lib/metadata";

export const dynamic = "force-dynamic";

/**
 * Get the ISO date string for N days ago.
 * @precondition days >= 0
 * @postcondition Returns a valid ISO date string.
 * @idempotent Yes - pure computation based on current time.
 */
const getDaysAgoISO = (days: number): string => {
  const date = getCurrentUTCDate();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const ITEMS_PER_PAGE = 24;

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

  const currentPage = resolvedSearchParams.page
    ? Number.parseInt(resolvedSearchParams.page as string, 10)
    : 0;
  const order = (resolvedSearchParams.order as "asc" | "desc") || "desc";
  const orderKey =
    (resolvedSearchParams.orderKey as "publishedAt" | "viewCount") ||
    "viewCount";
  const period = (resolvedSearchParams.period as string) || "week";

  // Set date filters based on period
  let afterDate: string | undefined;
  switch (period) {
    case "day":
      afterDate = getDaysAgoISO(1);
      break;
    case "week":
      afterDate = getDaysAgoISO(7);
      break;
    case "month":
      afterDate = getDaysAgoISO(30);
      break;
    case "year":
      afterDate = getDaysAgoISO(365);
      break;
    default:
      afterDate = undefined;
      break;
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("x-session-id")?.value;

  const clipService = await fetchSingleClipService({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    platform: "twitch",
    clipType: "clip",
    order,
    orderKey,
    afterPublishedAtDate: afterDate,
    sessionId,
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
