import "server-only";
import type { Channel, Clip, Pagination } from "@/features/shared/domain";
import { fetchVspoMembers } from "../../shared/api/channel";
import { fetchClips } from "../../shared/api/clip";

type ClipService = {
  popularYoutubeClips: Clip[];
  popularShortsClips: Clip[];
  popularTwitchClips: Clip[];
  vspoMembers: Channel[];
};

type FetchClipServiceParams = {
  beforePublishedAtDate?: string;
  afterPublishedAtDate?: string;
  sessionId?: string;
};

/**
 * Fetches popular clips across all platforms for the clips home page.
 * @precondition None
 * @postcondition Returns clips grouped by platform type, with empty arrays for failed fetches.
 * @idempotent Yes - read-only data fetching.
 */
const fetchClipService = async (
  params: FetchClipServiceParams,
): Promise<ClipService> => {
  const { beforePublishedAtDate, afterPublishedAtDate, sessionId } = params;

  const ITEMS_PER_CATEGORY = 10;

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

  return {
    popularYoutubeClips,
    popularShortsClips,
    popularTwitchClips,
    vspoMembers,
  };
};

type SingleClipService = {
  clips: Clip[];
  pagination: Pagination;
};

type FetchSingleClipServiceParams = {
  page: number;
  limit: number;
  platform: "youtube" | "twitch";
  clipType: "clip" | "short";
  order: "asc" | "desc";
  orderKey: "viewCount" | "publishedAt";
  afterPublishedAtDate?: string;
  sessionId?: string;
};

/**
 * Fetches clips for a single platform with pagination support.
 * @precondition page >= 0, limit > 0
 * @postcondition Returns clips array and pagination metadata, with defaults for failed fetches.
 * @idempotent Yes - read-only data fetching.
 */
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
    sessionId,
  } = params;

  const result = await fetchClips({
    page,
    limit,
    platform,
    clipType,
    order,
    orderKey,
    afterPublishedAtDate,
    sessionId,
  });

  const clipResult =
    !result.err && result.val
      ? result.val
      : {
          clips: [],
          pagination: {
            currentPage: 0,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
          },
        };

  return {
    clips: clipResult.clips || [],
    pagination: clipResult.pagination || {
      currentPage: 0,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: limit,
    },
  };
};

export { fetchClipService, fetchSingleClipService };
