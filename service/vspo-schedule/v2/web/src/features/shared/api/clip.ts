import { type ListClips200ClipsItem, VSPOApi } from "@vspo-lab/api";
import { AppError, type BaseError, type Result, wrap } from "@vspo-lab/error";
import { getCloudflareEnvironmentContext } from "@/lib/cloudflare/context";
import {
  type Clip,
  clipSchema,
  type Pagination,
  paginationSchema,
} from "../domain/clip";
import type { Platform } from "../domain/video";

export type FetchClipsParams = {
  page: number;
  limit: number;
  // locale?: string;
  platform: "youtube" | "twitch";
  clipType: "clip" | "short";
  order: "asc" | "desc";
  orderKey: "viewCount" | "publishedAt";
  beforePublishedAtDate?: string;
  afterPublishedAtDate?: string;
  sessionId?: string;
};

export type ClipFetchResult = Result<
  {
    clips: Clip[];
    pagination: Pagination;
  },
  BaseError
>;

const mapToClip = (apiClip: ListClips200ClipsItem): Clip => {
  return clipSchema.parse({
    id: apiClip.rawId,
    type: "clip",
    title: apiClip.title,
    description: apiClip.description,
    thumbnailUrl: apiClip.thumbnailURL,
    platform: apiClip.platform as Platform,
    link: apiClip.link || "",
    viewCount: apiClip.viewCount,
    channelId: apiClip.rawChannelID,
    channelTitle: apiClip.creatorName || "",
    channelThumbnailUrl: apiClip.creatorThumbnailURL || "",
    videoPlayerLink: apiClip.videoPlayerLink || "",
    publishedAt: apiClip.publishedAt,
    tags: apiClip.tags || [],
  } satisfies Clip);
};

const mapWorkerResponseToClip = (apiClip: ListClips200ClipsItem): Clip => {
  return clipSchema.parse({
    id: apiClip.rawId,
    type: "clip",
    title: apiClip.title,
    description: apiClip.description,
    thumbnailUrl: apiClip.thumbnailURL,
    platform: apiClip.platform as Platform,
    link: apiClip.link || "",
    viewCount: apiClip.viewCount,
    channelId: apiClip.rawChannelID,
    channelTitle: apiClip.creatorName || "",
    channelThumbnailUrl: apiClip.creatorThumbnailURL || "",
    videoPlayerLink: apiClip.videoPlayerLink || "",
    publishedAt: apiClip.publishedAt,
    tags: apiClip.tags || [],
  } satisfies Clip);
};

/**
 * Fetch clips from the API
 */
export const fetchClips = async (
  params: FetchClipsParams,
): Promise<ClipFetchResult> => {
  const getClipsData = async (): Promise<{
    clips: Clip[];
    pagination: Pagination;
  }> => {
    const { cfEnv } = await getCloudflareEnvironmentContext();

    let clips: Clip[] = [];
    let pagination: Pagination;
    if (cfEnv) {
      const { APP_WORKER } = cfEnv;

      const result = await APP_WORKER.newClipUsecase().list({
        limit: params.limit,
        page: params.page,
        platform: params.platform,
        clipType: params.clipType,
        languageCode: "default",
        orderBy: params.order,
        orderKey: params.orderKey,
        beforePublishedAtDate: params.beforePublishedAtDate
          ? new Date(params.beforePublishedAtDate)
          : undefined,
        afterPublishedAtDate: params.afterPublishedAtDate
          ? new Date(params.afterPublishedAtDate)
          : undefined,
      });

      if (result.err) {
        throw result.err;
      }

      if (result.val?.clips) {
        clips = result.val.clips.map(mapWorkerResponseToClip);
      }

      pagination = paginationSchema.parse({
        currentPage: result.val?.pagination?.currentPage || params.page,
        totalPages: result.val?.pagination?.totalPage || 1,
        totalItems: result.val?.pagination?.totalCount || 0,
        itemsPerPage: params.limit,
      });
    } else {
      // Use regular VSPO API
      const { page, limit, platform, order, orderKey } = params;
      const client = new VSPOApi({
        baseUrl: process.env.API_URL_V2 || "",
        sessionId: params.sessionId,
      });

      const result = await client.clips.list({
        limit: limit.toString(),
        page: page.toString(),
        platform,
        clipType: params.clipType,
        languageCode: "default",
        orderBy: order,
        orderKey: orderKey,
        beforePublishedAtDate: params.beforePublishedAtDate,
        afterPublishedAtDate: params.afterPublishedAtDate,
      });

      if (!result.val) {
        throw result.err;
      }

      clips = result.val.clips.map(mapToClip);

      pagination = paginationSchema.parse({
        currentPage: result.val.pagination.currentPage,
        totalPages: result.val.pagination.totalPage,
        totalItems: result.val.pagination.totalCount,
        itemsPerPage: limit,
      });
    }

    return {
      clips,
      pagination,
    };
  };

  return wrap(
    getClipsData(),
    (error) =>
      new AppError({
        message: "Failed to fetch clips",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: params,
      }),
  );
};
