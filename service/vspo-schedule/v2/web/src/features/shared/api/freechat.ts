import { getCloudflareEnvironmentContext } from "@/lib/cloudflare/context";
import { type ListFreechats200FreechatsItem, VSPOApi } from "@vspo-lab/api";
import { AppError, type BaseError, type Result, wrap } from "@vspo-lab/error";
import { type Freechat, freechatSchema } from "../domain/freechat";

export type FetchFreechatsParams = {
  lang?: string;
  sessionId?: string;
};

export type FreechatFetchResult = Result<
  {
    freechats: Freechat[];
  },
  BaseError
>;

const mapToFreechat = (
  apiFreechat: ListFreechats200FreechatsItem,
): Freechat => {
  return freechatSchema.parse({
    id: apiFreechat.id,
    type: "freechat",
    title: apiFreechat.title,
    description: apiFreechat.description,
    platform: apiFreechat.platform,
    thumbnailUrl: apiFreechat.thumbnailURL,
    viewCount: apiFreechat.viewCount,
    status: "live", // Assuming freechats are typically live
    scheduledStartTime: apiFreechat.publishedAt,
    scheduledEndTime: null,
    channelId: apiFreechat.rawChannelID,
    channelTitle: apiFreechat.creatorName || "",
    channelThumbnailUrl: apiFreechat.creatorThumbnailURL || "",
    link: apiFreechat.link || "",
    videoPlayerLink: apiFreechat.videoPlayerLink || "",
    chatPlayerLink: apiFreechat.chatPlayerLink || "",
    tags: apiFreechat.tags || [],
  });
};

const mapWorkerResponseToFreechat = (
  apiFreechat: ListFreechats200FreechatsItem,
): Freechat => {
  return freechatSchema.parse({
    id: apiFreechat.id,
    type: "freechat",
    title: apiFreechat.title,
    description: apiFreechat.description,
    platform: apiFreechat.platform,
    thumbnailUrl: apiFreechat.thumbnailURL,
    viewCount: apiFreechat.viewCount,
    status: "live", // Assuming freechats are typically live
    scheduledStartTime: apiFreechat.publishedAt,
    scheduledEndTime: null,
    channelId: apiFreechat.rawChannelID,
    channelTitle: apiFreechat.creatorName || "",
    channelThumbnailUrl: apiFreechat.creatorThumbnailURL || "",
    link: apiFreechat.link || "",
    videoPlayerLink: apiFreechat.videoPlayerLink || "",
    chatPlayerLink: apiFreechat.chatPlayerLink || "",
    tags: apiFreechat.tags || [],
  });
};

/**
 * Fetches freechat streams using the VSPOApi
 */
export const fetchFreechats = async (
  params: FetchFreechatsParams = {},
): Promise<FreechatFetchResult> => {
  const getFreechatsData = async (): Promise<{ freechats: Freechat[] }> => {
    const { cfEnv } = await getCloudflareEnvironmentContext();

    let freechats: Freechat[] = [];

    if (cfEnv) {
      const { APP_WORKER } = cfEnv;

      const result = await APP_WORKER.newFreechatUsecase().list({
        limit: 100,
        page: 0,
        languageCode:
          params.lang === "ja" ? "default" : params.lang || "default",
        orderBy: "asc",
        orderKey: "creatorName",
      });

      if (result.err) {
        throw result.err;
      }

      if (result.val?.freechats) {
        freechats = result.val.freechats.map(mapWorkerResponseToFreechat);
      }
    } else {
      // Use regular VSPO API
      const api = new VSPOApi({
        baseUrl: process.env.API_URL_V2 || "",
        sessionId: params.sessionId,
      });

      const result = await api.freechats.list({
        limit: "100",
        page: "0",
        languageCode:
          params.lang === "ja" ? "default" : params.lang || "default",
        orderBy: "asc",
        orderKey: "creatorName",
      });

      if (!result.val) {
        throw result.err;
      }

      freechats = result.val.freechats.map(mapToFreechat);
    }

    return { freechats };
  };

  return wrap(
    getFreechatsData(),
    (error) =>
      new AppError({
        message: "Failed to fetch freechats",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: params,
      }),
  );
};
