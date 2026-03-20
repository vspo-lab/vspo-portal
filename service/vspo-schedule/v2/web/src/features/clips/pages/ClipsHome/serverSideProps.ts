import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { GetServerSidePropsContext } from "next";
import { DEFAULT_LOCALE } from "@/lib/Const";
import { getInitializedI18nInstance } from "@/lib/utils";
import { fetchClipService } from "../../api/clipService";
import type { ClipsHomeProps } from "./container";

// Get date for N days ago in ISO format
const getDaysAgoISO = (days: number): string => {
  const date = getCurrentUTCDate();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const locale = context.locale || DEFAULT_LOCALE;

  // Get date range from query parameters or default to 1 week
  const period = (context.query.period as string) || "week";

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

  const clipService = await fetchClipService({
    afterPublishedAtDate: afterDate,
    locale,
    req: context.req,
  });

  const popularYoutubeClips = clipService.popularYoutubeClips;
  const popularShortsClips = clipService.popularShortsClips;
  const popularTwitchClips = clipService.popularTwitchClips;
  const vspoMembers = clipService.vspoMembers;
  const translations = clipService.translations;

  const { t } = getInitializedI18nInstance(translations, "clips");

  const title = t("home.meta.title", "ぶいすぽっ!クリップ集");
  const description = t(
    "home.meta.description",
    "ぶいすぽっ!メンバーのストリーム動画クリップ集。",
  );

  const lastUpdateTimestamp = getCurrentUTCDate().getTime();

  return {
    props: {
      popularYoutubeClips,
      popularShortsClips,
      popularTwitchClips,
      vspoMembers,
      lastUpdateTimestamp,
      meta: {
        title,
        description,
      },
      currentPeriod: period || "week",
      ...translations,
    } as ClipsHomeProps,
  };
};
