import {
  type ListStreams200StreamsItem,
  ListStreamsMemberType,
  type ListStreamsParams,
  ListStreamsPlatform,
  VSPOApi,
} from "@vspo-lab/api";
import {
  convertToUTCTimestamp,
  getCurrentUTCDate,
  getEndOfDayUTC,
} from "@vspo-lab/dayjs";
import {
  AppError,
  type BaseError,
  Err,
  type Result,
  wrap,
} from "@vspo-lab/error";
import { getCloudflareEnvironmentContext } from "@/lib/cloudflare/context";
import { type Livestream, livestreamSchema, type Status } from "../domain";

/** Maps URL status param to domain Status. Hoisted to avoid duplication. */
const STATUS_MAP: Record<string, Status | undefined> = {
  live: "live",
  upcoming: "upcoming",
  archive: "ended",
  all: undefined,
};

type FetchLivestreamsParams = {
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

type LivestreamFetchResult = Result<
  {
    livestreams: Livestream[];
  },
  BaseError
>;

/**
 * Transforms API stream data to domain Livestream model.
 * Filters out streams without a startedAt timestamp.
 * Validates each stream through livestreamSchema which includes platformSchema validation.
 */
const transformLivestreamsToDomain = (
  apiLivestreams?: ListStreams200StreamsItem[],
): Livestream[] => {
  if (!apiLivestreams) {
    return [];
  }

  const streamsWithStartTime = apiLivestreams.filter(
    (stream): stream is ListStreams200StreamsItem & { startedAt: string } =>
      Boolean(stream.startedAt),
  );

  return streamsWithStartTime.map((stream) => {
    const livestream = {
      id: stream.rawId,
      type: "livestream",
      title: stream.title,
      description: stream.description,
      platform: stream.platform,
      thumbnailUrl: stream.thumbnailURL,
      viewCount: stream.viewCount,
      status: stream.status,
      scheduledStartTime: stream.startedAt,
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
 * Fetch livestreams from the API.
 * Precondition: params must contain valid filter values including timezone.
 * Postcondition: returns Ok with livestreams array, or Err on failure.
 */
export const fetchLivestreams = async (
  params: FetchLivestreamsParams,
): Promise<LivestreamFetchResult> => {
  const { cfEnv } = await getCloudflareEnvironmentContext();

  if (cfEnv) {
    const { APP_WORKER } = cfEnv;

    const statusMap = STATUS_MAP;

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
      const thirtyDaysAgo = getCurrentUTCDate();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      workerParams.startDateFrom = thirtyDaysAgo;
    }

    const result = await APP_WORKER.newStreamUsecase().list(workerParams);

    if (result.err) {
      return Err(result.err);
    }

    return wrap(
      (async () => ({
        livestreams: transformLivestreamsToDomain(result.val?.streams),
      }))(),
      (error) =>
        new AppError({
          message: "Failed to parse livestream data",
          code: "INTERNAL_SERVER_ERROR",
          cause: error,
          context: params,
        }),
    );
  }

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

  const memberTypeValue = params.memberType || "vspo_all";
  // Assertion needed: TS cannot narrow string via `in` operator to const object value type
  const validMemberType =
    memberTypeValue in ListStreamsMemberType
      ? (memberTypeValue as ListStreamsMemberType)
      : ListStreamsMemberType.vspo_all;

  const param: ListStreamsParams = {
    limit: params.limit.toString(),
    page: "0", // Default to first page
    status: statusMap[params.status] || undefined,
    orderBy: params.order,
    languageCode: lang,
    memberType: validMemberType,
  };

  // Add platform filter if provided
  // Assertion needed: TS cannot narrow string via `in` operator to const object value type
  if (params.platform && params.platform in ListStreamsPlatform) {
    param.platform = params.platform as ListStreamsPlatform;
  }

  if (params.status === "all") {
    param.startDateFrom = startDateFrom;
    param.startDateTo = startDateTo;
  }

  // Add 30 day limit for ended (archive) streams
  if (params.status === "archive") {
    const thirtyDaysAgo = getCurrentUTCDate();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    param.startDateFrom = convertToUTCTimestamp(
      thirtyDaysAgo.toISOString(),
      params.timezone,
    );
  }

  const result = await client.streams.list(param);

  if (result.err) {
    return Err(result.err);
  }

  return wrap(
    (async () => ({
      livestreams: transformLivestreamsToDomain(result.val.streams),
    }))(),
    (error) =>
      new AppError({
        message: "Failed to parse livestream data",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: params,
      }),
  );
};
