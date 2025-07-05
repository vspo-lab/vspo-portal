import type { IncomingMessage } from "node:http";
import type { Channel, Clip, Pagination } from "@/features/shared/domain";
import { serverSideTranslations } from "@/lib/i18n/server";
import { getSessionId } from "@/lib/utils";
import type { SSRConfig } from "next-i18next";
import { fetchVspoMembers } from "../../shared/api/channel";
import { fetchClips } from "../../shared/api/clip";

type ClipService = {
  popularYoutubeClips: Clip[];
  popularShortsClips: Clip[];
  popularTwitchClips: Clip[];
  vspoMembers: Channel[];
  translations: SSRConfig;
};

type FetchClipServiceParams = {
  beforePublishedAtDate?: string;
  afterPublishedAtDate?: string;
  locale: string;
  req: IncomingMessage;
};

const fetchClipService = async (
  params: FetchClipServiceParams,
): Promise<ClipService> => {
  const { beforePublishedAtDate, afterPublishedAtDate, locale, req } = params;

  const ITEMS_PER_CATEGORY = 10;
  const sessionId = getSessionId(req);

  const results = await Promise.allSettled([
    fetchClips({
      platform: "youtube",
      page: 0,
      limit: ITEMS_PER_CATEGORY,
      clipType: "clip",
      order: "desc",
      orderKey: "viewCount",
      beforePublishedAtDate,
      afterPublishedAtDate,
      sessionId,
    }),
    fetchClips({
      platform: "youtube",
      page: 0,
      limit: ITEMS_PER_CATEGORY,
      clipType: "short",
      order: "desc",
      orderKey: "viewCount",
      beforePublishedAtDate,
      afterPublishedAtDate,
      sessionId,
    }),
    fetchClips({
      platform: "twitch",
      page: 0,
      limit: ITEMS_PER_CATEGORY,
      clipType: "clip",
      order: "desc",
      orderKey: "viewCount",
      beforePublishedAtDate,
      afterPublishedAtDate,
      sessionId,
    }),
    fetchVspoMembers({
      sessionId,
    }),
    serverSideTranslations(locale, ["common", "clips"]),
  ]);

  const popularYoutubeClips =
    results[0].status === "fulfilled" && !results[0].value.err
      ? results[0].value.val?.clips || []
      : [];

  const popularShortsClips =
    results[1].status === "fulfilled" && !results[1].value.err
      ? results[1].value.val?.clips || []
      : [];

  const popularTwitchClips =
    results[2].status === "fulfilled" && !results[2].value.err
      ? results[2].value.val?.clips || []
      : [];

  const vspoMembers =
    results[3].status === "fulfilled" && !results[3].value.err
      ? results[3].value.val?.members || []
      : [];

  const translations =
    results[4].status === "fulfilled"
      ? results[4].value
      : await serverSideTranslations(locale, ["common", "clips"]);

  return {
    popularYoutubeClips,
    popularShortsClips,
    popularTwitchClips,
    vspoMembers,
    translations,
  };
};

type SingleClipService = {
  clips: Clip[];
  pagination: Pagination;
  translations: SSRConfig;
};

type FetchSingleClipServiceParams = {
  page: number;
  limit: number;
  platform: "youtube" | "twitch";
  clipType: "clip" | "short";
  order: "asc" | "desc";
  orderKey: "viewCount" | "publishedAt";
  afterPublishedAtDate?: string;
  locale: string;
  req: IncomingMessage;
};

const fetchSingleClipService = async (
  params: FetchSingleClipServiceParams,
): Promise<SingleClipService> => {
  const {
    page,
    limit,
    platform,
    clipType,
    order,
    orderKey,
    afterPublishedAtDate,
    locale,
    req,
  } = params;

  const sessionId = getSessionId(req);

  const results = await Promise.allSettled([
    fetchClips({
      page,
      limit,
      platform,
      clipType,
      order,
      orderKey,
      afterPublishedAtDate,
      sessionId,
    }),
    serverSideTranslations(locale, ["common", "clips"]),
  ]);

  const clipResult =
    results[0].status === "fulfilled" && !results[0].value.err
      ? results[0].value.val
      : {
          clips: [],
          pagination: {
            currentPage: 0,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
          },
        };

  const translations =
    results[1].status === "fulfilled"
      ? results[1].value
      : await serverSideTranslations(locale, ["common", "clips"]);

  return {
    clips: clipResult.clips || [],
    pagination: clipResult.pagination || {
      currentPage: 0,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: limit,
    },
    translations,
  };
};

export {
  fetchClipService,
  fetchSingleClipService,
  type ClipService,
  type FetchClipServiceParams,
  type SingleClipService,
  type FetchSingleClipServiceParams,
};
