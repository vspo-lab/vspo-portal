import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { fetchSingleClipService } from "@/features/clips/api/clipService";
import { YouTubeClips } from "@/features/clips/pages/YouTubeClips/container";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";

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
    title: t("youtubeShorts.title"),
    description: t("youtubeShorts.description"),
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

  const order =
    (Array.isArray(resolvedSearchParams.order)
      ? resolvedSearchParams.order[0]
      : resolvedSearchParams.order) || "desc";
  const orderKey =
    (Array.isArray(resolvedSearchParams.orderKey)
      ? resolvedSearchParams.orderKey[0]
      : resolvedSearchParams.orderKey) || "publishedAt";
  const page = Number.parseInt(
    Array.isArray(resolvedSearchParams.page)
      ? resolvedSearchParams.page[0]
      : resolvedSearchParams.page || "0",
    10,
  );
  const period =
    (Array.isArray(resolvedSearchParams.period)
      ? resolvedSearchParams.period[0]
      : resolvedSearchParams.period) || "week";

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
    platform: "youtube",
    page,
    limit: ITEMS_PER_PAGE,
    clipType: "short",
    order: order as "asc" | "desc",
    orderKey: orderKey as "publishedAt" | "viewCount",
    afterPublishedAtDate: afterDate,
    sessionId,
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
