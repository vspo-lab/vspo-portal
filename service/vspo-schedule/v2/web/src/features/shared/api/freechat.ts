import { type ListFreechats200FreechatsItem, VSPOApi } from "@vspo-lab/api";
import {
  AppError,
  type BaseError,
  Err,
  type Result,
  wrap,
} from "@vspo-lab/error";
import { getCloudflareEnvironmentContext } from "@/lib/cloudflare/context";
import { type Freechat, freechatSchema } from "../domain/freechat";

type FetchFreechatsParams = {
  lang?: string;
  sessionId?: string;
};

type FreechatFetchResult = Result<
  {
    freechats: Freechat[];
  },
  BaseError
>;

/**
 * Maps an API freechat item to the domain Freechat model.
 * Validates through freechatSchema which includes platformSchema validation.
 */
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

/**
 * Fetches freechat streams.
 * Precondition: optional lang and sessionId params.
 * Postcondition: returns Ok with freechats array, or Err on failure.
 */
export const fetchFreechats = async (
  params: FetchFreechatsParams = {},
): Promise<FreechatFetchResult> => {
  const { cfEnv } = await getCloudflareEnvironmentContext();

  if (cfEnv) {
    const { APP_WORKER } = cfEnv;

    const result = await APP_WORKER.newFreechatUsecase().list({
      limit: 100,
      page: 0,
      languageCode: params.lang === "ja" ? "default" : params.lang || "default",
      orderBy: "asc",
      orderKey: "creatorName",
    });

    if (result.err) {
      return Err(result.err);
    }

    return wrap(
      (async () => ({
        freechats: (result.val?.freechats ?? []).map(mapToFreechat),
      }))(),
      (error) =>
        new AppError({
          message: "Failed to parse freechat data",
          code: "INTERNAL_SERVER_ERROR",
          cause: error,
          context: params,
        }),
    );
  }

  // Use regular VSPO API
  const api = new VSPOApi({
    baseUrl: process.env.API_URL_V2 || "",
    sessionId: params.sessionId,
  });

  const result = await api.freechats.list({
    limit: "100",
    page: "0",
    languageCode: params.lang === "ja" ? "default" : params.lang || "default",
    orderBy: "asc",
    orderKey: "creatorName",
  });

  if (result.err) {
    return Err(result.err);
  }

  return wrap(
    (async () => ({
      freechats: result.val.freechats.map(mapToFreechat),
    }))(),
    (error) =>
      new AppError({
        message: "Failed to parse freechat data",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: params,
      }),
  );
};
