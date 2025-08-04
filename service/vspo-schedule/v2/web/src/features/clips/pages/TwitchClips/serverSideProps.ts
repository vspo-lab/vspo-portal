import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { GetServerSideProps } from "next";
import { DEFAULT_LOCALE } from "@/lib/Const";
import { getInitializedI18nInstance } from "@/lib/utils";
import { fetchSingleClipService } from "../../api/clipService";
import { paginateClips } from "../../utils/clipUtils";
import type { TwitchClipsProps } from "./container";

// Get date for N days ago in ISO format
const getDaysAgoISO = (days: number): string => {
  const date = getCurrentUTCDate();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

// Server-side logic for data fetching
// NOTE: Not included in barrel exports because it contains node:fs internally
export const getTwitchClipsServerSideProps: GetServerSideProps<
  TwitchClipsProps
> = async ({ locale = DEFAULT_LOCALE as string, query, req }) => {
  // Get the current page from query params or default to 1
  const currentPage = query.page
    ? Number.parseInt(query.page as string, 10)
    : 0;

  // Provide default values to prevent undefined values
  const order = (query.order as "asc" | "desc") || "desc";
  const orderKey =
    (query.orderKey as "publishedAt" | "viewCount") || "viewCount";

  // Get period filter from query parameters
  const period = (query.period as string) || "week";

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

  // Items per page for server-side pagination
  const ITEMS_PER_PAGE = 24;

  const clipService = await fetchSingleClipService({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    platform: "twitch",
    clipType: "clip",
    order,
    orderKey,
    afterPublishedAtDate: afterDate,
    locale,
    req,
  });

  const clips = clipService.clips;
  const pagination = clipService.pagination;
  const translations = clipService.translations;

  const { t } = getInitializedI18nInstance(translations, "clips");

  const getTimestamp = (): number => {
    return getCurrentUTCDate().getTime();
  };

  // Apply pagination with the total count from the API
  const { clips: paginatedClips, pagination: finalPagination } = paginateClips(
    clips,
    currentPage,
    ITEMS_PER_PAGE,
    pagination.totalItems,
  );

  return {
    props: {
      ...translations,
      clips: paginatedClips,
      pagination: finalPagination,
      lastUpdateTimestamp: getTimestamp(),
      meta: {
        title: t("twitchClips.title"),
        description: t("twitchClips.description"),
      },
      order: order,
      orderKey: orderKey,
      currentPeriod: period,
    },
  };
};
