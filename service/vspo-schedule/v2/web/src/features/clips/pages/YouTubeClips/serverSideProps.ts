import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { GetServerSidePropsContext } from "next";
import { DEFAULT_LOCALE } from "@/lib/Const";
import { getInitializedI18nInstance } from "@/lib/utils";
import { fetchSingleClipService } from "../../api/clipService";
import type { YouTubeClipsProps } from "./container";

// Get date for N days ago in ISO format
const getDaysAgoISO = (days: number): string => {
  const date = getCurrentUTCDate();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

type YouTubeClipOptions = {
  type?: "clip" | "short";
  order?: "asc" | "desc";
  orderKey?: "publishedAt" | "viewCount";
};

// Server-side logic for data fetching
// NOTE: Not included in barrel exports because it contains node:fs internally
export const getYouTubeClipsServerSideProps = (options: YouTubeClipOptions) => {
  return async (context: GetServerSidePropsContext) => {
    const locale = context.locale || DEFAULT_LOCALE;

    // Get sort option from query params (default to "new")
    const order =
      (Array.isArray(context.query.order)
        ? context.query.order[0]
        : context.query.order) || "desc";
    const orderKey =
      (Array.isArray(context.query.orderKey)
        ? context.query.orderKey[0]
        : context.query.orderKey) || "publishedAt";

    // Get page number from query params (default to 0)
    const page = Number.parseInt(
      Array.isArray(context.query.page)
        ? context.query.page[0]
        : context.query.page || "0",
      10,
    );

    // Get period filter from query parameters
    const period =
      (Array.isArray(context.query.period)
        ? context.query.period[0]
        : context.query.period) || "week";

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

    const ITEMS_PER_PAGE = 24;

    // Get clip type from options (default to "clip")
    const clipType = options.type || "clip";

    const clipService = await fetchSingleClipService({
      platform: "youtube",
      page,
      limit: ITEMS_PER_PAGE,
      clipType,
      order: order as "asc" | "desc",
      orderKey: orderKey as "publishedAt" | "viewCount",
      afterPublishedAtDate: afterDate,
      locale,
      req: context.req,
    });

    const clips = clipService.clips;
    const pagination = clipService.pagination;
    const translations = clipService.translations;

    const { t } = getInitializedI18nInstance(translations, "clips");

    // Meta content
    const title =
      clipType === "short" ? t("youtubeShorts.title") : t("youtubeClips.title");
    const description =
      clipType === "short"
        ? t("youtubeShorts.description")
        : t("youtubeClips.description");

    // Get the last update timestamp
    const lastUpdateTimestamp = getCurrentUTCDate().getTime();

    return {
      props: {
        clips,
        lastUpdateTimestamp,
        meta: {
          title,
          description,
        },
        pagination,
        order: order || "desc",
        orderKey: orderKey || "publishedAt",
        currentPeriod: period,
        ...translations,
      } as YouTubeClipsProps,
    };
  };
};
