import {
  type ListStreams200StreamsItem,
  type ListStreamsMemberType,
  type ListStreamsParams,
  type ListStreamsPlatform,
  VSPOApi,
} from "@vspo-lab/api";
import { convertToUTCTimestamp, getEndOfDayUTC } from "@vspo-lab/dayjs";
import type { BaseError, Result } from "@vspo-lab/error";
import { AppError, wrap } from "@vspo-lab/error";
import { getCloudflareEnvironmentContext } from "@/lib/cloudflare/context";
import { type Livestream, livestreamSchema, type Status } from "../domain";

export type FetchLivestreamsParams = {
  limit: number;
  lang: string;
  status: "live" | "upcoming" | "archive" | "all";
  order: "asc" | "desc";
  timezone: string;
  startedDate?: string;
  memberType?: string;
  platform?: string;
  sessionId?: string;
};

export type LivestreamFetchResult = Result<
  {
    livestreams: Livestream[];
  },
  BaseError
>;

/**
 * Transforms API event data to domain Livestream model
 */
const transformLivestreamsToDomain = (
  apiLivestreams?: ListStreams200StreamsItem[],
): Livestream[] => {
  if (!apiLivestreams) {
    return [];
  }
  return apiLivestreams.map((stream) => {
    const livestream = {
      id: stream.rawId,
      type: "livestream",
      title: stream.title,
      description: stream.description,
      platform: stream.platform,
      thumbnailUrl: stream.thumbnailURL,
      viewCount: stream.viewCount,
      status: stream.status,
      scheduledStartTime: stream.startedAt || "",
      scheduledEndTime: stream.endedAt,
      channelId: stream.rawChannelID,
      channelTitle: stream.creatorName || "",
      channelThumbnailUrl: stream.creatorThumbnailURL || "",
      link: stream.link || "",
      videoPlayerLink: stream.videoPlayerLink || "",
      chatPlayerLink: stream.chatPlayerLink || "",
      tags: stream.tags,
    } satisfies Livestream;
    return livestreamSchema.parse(livestream);
  });
};

/**
 * Fetch livestreams from the API
 */
export const fetchLivestreams = async (
  params: FetchLivestreamsParams,
): Promise<LivestreamFetchResult> => {
  const getLivestreamsData = async (): Promise<{
    livestreams: Livestream[];
  }> => {
    const { cfEnv } = await getCloudflareEnvironmentContext();
    let livestreams: Livestream[] = [];

    if (cfEnv) {
      const { APP_WORKER } = cfEnv;

      const statusMap: Record<string, Status | undefined> = {
        live: "live",
        upcoming: "upcoming",
        archive: "ended",
        all: undefined,
      };

      const lang = params.lang === "ja" ? "default" : params.lang;

      const startDateFrom = params.startedDate
        ? convertToUTCTimestamp(params.startedDate, params.timezone)
        : undefined;

      const startDateTo = params.startedDate
        ? getEndOfDayUTC(params.startedDate, params.timezone)
        : undefined;

      const workerParams: {
        limit: number;
        page: number;
        status?: Status;
        orderBy: "asc" | "desc";
        languageCode: string;
        memberType: string;
        platform?: string;
        startDateFrom?: Date;
        startDateTo?: Date;
      } = {
        limit: params.limit,
        page: 0,
        status: statusMap[params.status] || undefined,
        orderBy: params.order,
        languageCode: lang,
        memberType: params.memberType || "vspo_all",
        platform: params.platform,
      };

      if (params.status === "all") {
        workerParams.startDateFrom = startDateFrom
          ? new Date(startDateFrom)
          : undefined;
        workerParams.startDateTo = startDateTo
          ? new Date(startDateTo)
          : undefined;
      }

      // Add 30 day limit for ended (archive) streams
      if (params.status === "archive") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        workerParams.startDateFrom = thirtyDaysAgo;
      }

      const result = await APP_WORKER.newStreamUsecase().list(workerParams);

      if (result.err) {
        throw result.err;
      }

      livestreams = transformLivestreamsToDomain(result.val?.streams);
    } else {
      // Use regular VSPO API
      const client = new VSPOApi({
        baseUrl: process.env.API_URL_V2 || "",
        sessionId: params.sessionId,
      });

      const statusMap: Record<string, Status | undefined> = {
        live: "live",
        upcoming: "upcoming",
        archive: "ended",
        all: undefined,
      };

      const lang = params.lang === "ja" ? "default" : params.lang;

      const startDateFrom = params.startedDate
        ? convertToUTCTimestamp(params.startedDate, params.timezone)
        : undefined;

      const startDateTo = params.startedDate
        ? getEndOfDayUTC(params.startedDate, params.timezone)
        : undefined;

      const param: ListStreamsParams = {
        limit: params.limit.toString(),
        page: "0", // Default to first page
        status: statusMap[params.status] || undefined,
        orderBy: params.order,
        languageCode: lang,
        memberType: (params.memberType || "vspo_all") as ListStreamsMemberType,
      };

      // Add platform filter if provided
      if (params.platform) {
        param.platform = params.platform as ListStreamsPlatform;
      }

      if (params.status === "all") {
        param.startDateFrom = startDateFrom;
        param.startDateTo = startDateTo;
      }

      // Add 30 day limit for ended (archive) streams
      if (params.status === "archive") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        param.startDateFrom = convertToUTCTimestamp(
          thirtyDaysAgo.toISOString(),
          params.timezone,
        );
      }

      const result = await client.streams.list(param);
      if (result.err) {
        throw result.err;
      }

      livestreams = transformLivestreamsToDomain(result.val.streams);
    }

    return { livestreams };
  };

  return wrap(
    getLivestreamsData(),
    (error) =>
      new AppError({
        message: "Failed to fetch livestreams",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: params,
      }),
  );
};
