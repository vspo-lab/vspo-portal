import { convertToUTCDate, getCurrentUTCDate } from "@vspo-lab/dayjs";
import { type AppError, Ok, type OkResult, type Result } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import {
  type Creator,
  MemberTypeSchema,
  PlatformSchema,
  StatusSchema,
  type Streams,
} from "..";
import {
  type IBilibiliService,
  type IStreamRepository,
  type ITwitcastingService,
  type ITwitchService,
  type IYoutubeService,
  query,
} from "../../infra";
import type { IAIService } from "../../infra/ai";
import type { ICacheClient } from "../../infra/cache";
import { withTracerResult } from "../../infra/http/trace/cloudflare";
import type { ICreatorRepository } from "../../infra/repository/creator";
import { TargetLangSchema } from "../translate";

export interface IStreamService {
  searchLiveYoutubeStreams(): Promise<Result<Streams, AppError>>;
  searchLiveTwitchStreams(): Promise<Result<Streams, AppError>>;
  searchLiveTwitCastingStreams(): Promise<Result<Streams, AppError>>;
  searchLiveBilibiliStreams(): Promise<Result<Streams, AppError>>;
  searchAllLiveStreams(): Promise<Result<Streams, AppError>>;
  searchExistStreams(): Promise<Result<Streams, AppError>>;
  getStreamsByIDs({
    youtubeStreamIds,
    twitchStreamIds,
  }: {
    youtubeStreamIds: string[];
    twitchStreamIds: string[];
  }): Promise<Result<Streams, AppError>>;
  searchDeletedStreams(): Promise<Result<Streams, AppError>>;
  translateStreams({
    languageCode,
    streams,
  }: {
    languageCode: string;
    streams: Streams;
  }): Promise<Result<Streams, AppError>>;
  getStreamsByChannel({
    channelId,
    maxResults,
    order,
  }: {
    channelId: string;
    maxResults?: number;
    order?:
      | "date"
      | "rating"
      | "relevance"
      | "title"
      | "videoCount"
      | "viewCount";
  }): Promise<Result<Streams, AppError>>;
  getMemberStreams(): Promise<Result<Streams, AppError>>;
  getStreamsByStreamIds(params: {
    streamIds: string[];
  }): Promise<Result<Streams, AppError>>;
}

// Helper functions for the stream service
const masterCreators = async (deps: {
  creatorRepository: ICreatorRepository;
}): Promise<
  Result<{ jp: Creator[]; en: Creator[]; ch: Creator[] }, AppError>
> => {
  const jpCreators = await deps.creatorRepository.list({
    limit: 300,
    page: 0,
    memberType: MemberTypeSchema.Enum.vspo_jp,
    languageCode: "default",
  });
  if (jpCreators.err) {
    return jpCreators;
  }

  const enCreators = await deps.creatorRepository.list({
    limit: 300,
    page: 0,
    memberType: MemberTypeSchema.Enum.vspo_en,
    languageCode: "default",
  });
  if (enCreators.err) {
    return enCreators;
  }

  const chCreators = await deps.creatorRepository.list({
    limit: 300,
    page: 0,
    memberType: MemberTypeSchema.Enum.vspo_ch,
    languageCode: "default",
  });
  if (chCreators.err) {
    return chCreators;
  }

  return Ok({ jp: jpCreators.val, en: enCreators.val, ch: chCreators.val });
};

const getStreamDifferences = (
  fetchedStreams: Streams,
  existingStreams: Streams,
): Streams => {
  return fetchedStreams.filter((fetchedStream) => {
    const existingStream = existingStreams.find(
      (v) => v.rawId === fetchedStream.rawId,
    );
    if (!existingStream) return true;
    return (
      existingStream.title !== fetchedStream.title ||
      existingStream.status !== fetchedStream.status ||
      existingStream.description !== fetchedStream.description ||
      existingStream.startedAt !== fetchedStream.startedAt ||
      existingStream.endedAt !== fetchedStream.endedAt
    );
  });
};

export const createStreamService = (deps: {
  youtubeClient: IYoutubeService;
  twitchClient: ITwitchService;
  twitCastingClient: ITwitcastingService;
  bilibiliClient: IBilibiliService;
  creatorRepository: ICreatorRepository;
  streamRepository: IStreamRepository;
  aiService: IAIService;
  cacheClient: ICacheClient;
}): IStreamService => {
  const SERVICE_NAME = "StreamService";

  const getStreamsByIDs = async ({
    youtubeStreamIds,
    twitchStreamIds,
  }: {
    youtubeStreamIds: string[];
    twitchStreamIds: string[];
  }): Promise<Result<Streams, AppError>> => {
    return withTracerResult(SERVICE_NAME, "getStreamsByIDs", async (span) => {
      const results: PromiseSettledResult<Result<Streams, AppError>>[] =
        await Promise.allSettled([
          ...(youtubeStreamIds.length > 0
            ? [
                deps.youtubeClient.getStreams({
                  streamIds: youtubeStreamIds,
                }),
              ]
            : []),
          ...(twitchStreamIds.length > 0
            ? [
                deps.twitchClient.getStreamsByIDs({
                  streamIds: twitchStreamIds,
                }),
              ]
            : []),
        ]);
      const streams = results
        .filter(
          (r): r is PromiseFulfilledResult<OkResult<Streams>> =>
            r.status === "fulfilled" && !r.value.err,
        )
        .flatMap((r) => r.value.val);

      return Ok(streams);
    });
  };

  const searchLiveYoutubeStreams = async (): Promise<
    Result<Streams, AppError>
  > => {
    return withTracerResult(
      SERVICE_NAME,
      "searchLiveYoutubeStreams",
      async (span) => {
        AppLogger.debug("Searching live YouTube streams", {
          service: SERVICE_NAME,
        });

        const c = await masterCreators({
          creatorRepository: deps.creatorRepository,
        });
        if (c.err) {
          AppLogger.error("Failed to get master creators", {
            service: SERVICE_NAME,
            error: c.err,
          });
          return c;
        }

        span.setAttributes({
          creatorCount: c.val.jp.length + c.val.en.length,
        });

        const promises = [
          deps.youtubeClient.searchStreams({
            query: query.VSPO_JP,
            eventType: "live",
          }),
          deps.youtubeClient.searchStreams({
            query: query.VSPO_EN,
            eventType: "live",
          }),
          deps.youtubeClient.searchStreams({
            query: query.VSPO_JP,
            eventType: "upcoming",
          }),
          deps.youtubeClient.searchStreams({
            query: query.VSPO_EN,
            eventType: "upcoming",
          }),
        ];

        const results = await Promise.allSettled(promises);
        const streams = results
          .filter(
            (r): r is PromiseFulfilledResult<OkResult<Streams>> =>
              r.status === "fulfilled" && !r.value.err,
          )
          .flatMap((r) => r.value.val);
        const failedResults = results.filter(
          (r): r is PromiseRejectedResult => r.status === "rejected",
        );

        if (failedResults.length > 0) {
          AppLogger.warn("Some YouTube stream searches failed", {
            service: SERVICE_NAME,
            failedCount: failedResults.length,
            errors: failedResults.map((r) => r.reason),
          });
        }

        AppLogger.debug("Successfully fetched Raw YouTube streams", {
          service: SERVICE_NAME,
          count: streams.length,
          streamTitles: streams.map((v) => v.title),
        });

        const channelIds = c.val.jp
          .map((c) => c.channel?.youtube?.rawId)
          .concat(c.val.en.map((c) => c.channel?.youtube?.rawId))
          .filter((id) => id !== undefined);

        AppLogger.debug("Youtube Channels", {
          service: SERVICE_NAME,
          channelIds,
          channelTitles: c.val.jp.map((c) => c.channel?.youtube?.name),
        });

        const streamIds = Array.from(
          new Set(
            streams
              .map((v) => {
                const channelId = v.rawChannelID;
                if (channelIds.includes(channelId)) {
                  return v.rawId;
                }
                return null;
              })
              .filter((id) => id !== null),
          ),
        );

        AppLogger.debug("Successfully fetched Filtered YouTube streams", {
          service: SERVICE_NAME,
          count: streamIds.length,
          streamTitles: streamIds.map(
            (id) => streams.find((v) => v.rawId === id)?.title,
          ),
        });

        const fetchedStreams = await getStreamsByIDs({
          youtubeStreamIds: streamIds,
          twitchStreamIds: [],
        });
        if (fetchedStreams.err) {
          AppLogger.error("Failed to fetch streams by IDs", {
            service: SERVICE_NAME,
            error: fetchedStreams.err,
          });
          return fetchedStreams;
        }

        AppLogger.debug("Successfully fetched YouTube streams", {
          service: SERVICE_NAME,
          count: fetchedStreams.val.length,
          streams: fetchedStreams.val.map((v) => ({
            rawId: v.rawId,
            title: v.title,
            status: v.status,
          })),
        });
        return Ok(fetchedStreams.val);
      },
    );
  };

  const searchLiveTwitchStreams = async (): Promise<
    Result<Streams, AppError>
  > => {
    return withTracerResult(
      SERVICE_NAME,
      "searchLiveTwitchStreams",
      async (span) => {
        AppLogger.debug("Searching live Twitch streams", {
          service: SERVICE_NAME,
        });

        const c = await masterCreators({
          creatorRepository: deps.creatorRepository,
        });
        if (c.err) {
          AppLogger.error("Failed to get master creators", {
            service: SERVICE_NAME,
            error: c.err,
          });
          return c;
        }

        const userIds = c.val.jp
          .map((c) => c.channel?.twitch?.rawId)
          .concat(c.val.en.map((c) => c.channel?.twitch?.rawId))
          .filter((id) => id !== undefined);

        // Fetch both live streams and archives in parallel
        const results = await Promise.allSettled([
          deps.twitchClient.getStreams({ userIds }),
          deps.twitchClient.getArchive({ userIds }),
        ]);

        const liveStreams =
          results[0].status === "fulfilled" ? results[0].value.val : [];
        const archives =
          results[1].status === "fulfilled" ? results[1].value.val : [];

        const streams = liveStreams?.concat(archives ?? []);

        if (!streams) {
          return Ok([]);
        }

        const err = results.filter(
          (r): r is PromiseRejectedResult => r.status === "rejected",
        );

        if (err.length > 0) {
          AppLogger.error("Failed to get live streams", {
            service: SERVICE_NAME,
            errors: err.map((r) => r.reason),
          });
        }

        const errLive =
          results[0].status === "fulfilled" ? results[0].value.err : null;
        const errArchive =
          results[1].status === "fulfilled" ? results[1].value.err : null;

        if (errLive) {
          AppLogger.error("Failed to get live streams", {
            service: SERVICE_NAME,
            error: errLive,
          });
        }

        if (errArchive) {
          AppLogger.error("Failed to get archive", {
            service: SERVICE_NAME,
            error: errArchive,
          });
        }

        // Get the current live stream IDs to check against existing streams
        const ids = new Set(streams.map((stream) => stream.rawId));
        // Get existing streams that are marked as live from Twitch
        const existingLiveStreamsResult = await deps.streamRepository.list({
          limit: 500,
          page: 0,
          status: StatusSchema.Enum.live,
          platform: PlatformSchema.Enum.twitch,
          languageCode: "default",
          orderBy: "desc",
        });

        // Process ended streams in parallel with other operations
        if (
          !existingLiveStreamsResult.err &&
          existingLiveStreamsResult.val.length > 0
        ) {
          const endedStreamIds = existingLiveStreamsResult.val
            .filter((stream) => !ids.has(stream.rawId))
            .map((stream) => stream.id);

          // Delete streams that are no longer live
          if (endedStreamIds.length > 0) {
            AppLogger.debug(
              `Deleting ${endedStreamIds.length} Twitch streams that have ended`,
              {
                service: SERVICE_NAME,
                endedStreamIds: endedStreamIds,
                streamIds: ids,
              },
            );
            // Delete streams that have ended using batchDelete (don't await here)
            await deps.streamRepository.batchDelete(endedStreamIds);
          }
        }

        AppLogger.debug("Successfully fetched Twitch streams", {
          service: SERVICE_NAME,
          count: streams.length,
        });
        return Ok(streams);
      },
    );
  };

  const searchLiveTwitCastingStreams = async (): Promise<
    Result<Streams, AppError>
  > => {
    return withTracerResult(
      SERVICE_NAME,
      "searchLiveTwitCastingStreams",
      async (span) => {
        AppLogger.debug("Searching live TwitCasting streams", {
          service: SERVICE_NAME,
        });

        const c = await masterCreators({
          creatorRepository: deps.creatorRepository,
        });
        if (c.err) {
          AppLogger.error("Failed to get master creators", {
            service: SERVICE_NAME,
            error: c.err,
          });
          return c;
        }

        const userIds = c.val.jp
          .map((c) => c.channel?.twitCasting?.rawId)
          .concat(c.val.en.map((c) => c.channel?.twitCasting?.rawId))
          .filter((id) => id !== undefined);

        const result = await deps.twitCastingClient.getStreams({
          userIds: userIds,
        });
        if (result.err) {
          AppLogger.error("Failed to get TwitCasting streams", {
            service: SERVICE_NAME,
            error: result.err,
          });
          return result;
        }

        AppLogger.debug("Successfully fetched TwitCasting streams", {
          service: SERVICE_NAME,
          count: result.val.length,
        });
        return Ok(result.val);
      },
    );
  };

  const searchLiveBilibiliStreams = async (): Promise<
    Result<Streams, AppError>
  > => {
    return withTracerResult(
      SERVICE_NAME,
      "searchLiveBilibiliStreams",
      async (span) => {
        AppLogger.debug("Searching live Bilibili streams", {
          service: SERVICE_NAME,
        });

        const c = await masterCreators({
          creatorRepository: deps.creatorRepository,
        });
        if (c.err) {
          AppLogger.error("Failed to get master creators", {
            service: SERVICE_NAME,
            error: c.err,
          });
          return c;
        }

        const channelIds = c.val.ch
          .map((c) => c.channel?.bilibili?.rawId)
          .concat(c.val.en.map((c) => c.channel?.bilibili?.rawId))
          .filter((id) => id !== undefined);

        if (channelIds.length === 0) {
          AppLogger.debug("No Bilibili channel IDs found", {
            service: SERVICE_NAME,
          });
          return Ok([]);
        }

        const result = await deps.bilibiliClient.getStreams({
          channelIds: channelIds,
        });
        if (result.err) {
          AppLogger.error("Failed to get Bilibili streams", {
            service: SERVICE_NAME,
            error: result.err,
          });
          return result;
        }

        AppLogger.debug("Successfully fetched Bilibili streams", {
          service: SERVICE_NAME,
          videos: result.val.map((v) => ({
            rawChannelID: v.rawChannelID,
            rawId: v.rawId,
            title: v.title,
            status: v.status,
            platform: v.platform,
            creatorName: v.creatorName,
          })),
        });
        return Ok(result.val);
      },
    );
  };

  const searchAllLiveStreams = async (): Promise<Result<Streams, AppError>> => {
    return withTracerResult(
      SERVICE_NAME,
      "searchAllLiveStreams",
      async (span) => {
        AppLogger.debug("Searching all live streams", {
          service: SERVICE_NAME,
        });

        const results = await Promise.allSettled([
          searchLiveYoutubeStreams(),
          searchLiveTwitchStreams(),
          searchLiveTwitCastingStreams(),
          // searchLiveBilibiliStreams(),
        ]);

        const streams = results
          .filter(
            (r): r is PromiseFulfilledResult<OkResult<Streams>> =>
              r.status === "fulfilled" && !r.value.err,
          )
          .flatMap((r) => r.value.val);

        const failedResults = results.filter(
          (r): r is PromiseRejectedResult => r.status === "rejected",
        );

        if (failedResults.length > 0) {
          AppLogger.warn("Some stream searches failed", {
            service: SERVICE_NAME,
            failedCount: failedResults.length,
            errors: failedResults.map((r) => r.reason),
          });
        }

        AppLogger.debug("Successfully fetched all live streams", {
          service: SERVICE_NAME,
          count: streams.length,
          streams: streams.map((v) => ({
            rawId: v.rawId,
            title: v.title,
            status: v.status,
          })),
        });
        return Ok(streams);
      },
    );
  };

  // Get streams that have differences from existing streams
  const searchExistStreams = async (): Promise<Result<Streams, AppError>> => {
    return withTracerResult(
      SERVICE_NAME,
      "searchExistStreams",
      async (span) => {
        const liveStreams = await deps.streamRepository.list({
          limit: 1000,
          page: 0,
          status: StatusSchema.Enum.live,
          startDateFrom: convertToUTCDate(
            getCurrentUTCDate().setDate(getCurrentUTCDate().getDate() - 1),
          ),
          languageCode: "default",
          orderBy: "desc",
        });
        const upcomingStreams = await deps.streamRepository.list({
          limit: 1000,
          page: 0,
          status: StatusSchema.Enum.upcoming,
          startDateFrom: convertToUTCDate(
            getCurrentUTCDate().setDate(getCurrentUTCDate().getDate() - 1),
          ),
          languageCode: "default",
          orderBy: "desc",
        });
        if (liveStreams.err) {
          return liveStreams;
        }
        if (upcomingStreams.err) {
          return upcomingStreams;
        }

        const existingStreams = liveStreams.val.concat(upcomingStreams.val);
        const youtubeStreamIds = existingStreams
          .filter((v) => v.platform === PlatformSchema.Enum.youtube)
          .map((v) => v.rawId);

        const twitchStreamIds = existingStreams
          .filter((v) => v.platform === PlatformSchema.Enum.twitch)
          .map((v) => v.rawId);

        const fetchedStreams = await getStreamsByIDs({
          youtubeStreamIds,
          twitchStreamIds,
        });

        if (fetchedStreams.err) {
          return fetchedStreams;
        }

        AppLogger.debug("Successfully fetched streams", {
          service: SERVICE_NAME,
          count: fetchedStreams.val.length,
          streams: fetchedStreams.val.map((v) => ({
            rawId: v.rawId,
            title: v.title,
            status: v.status,
          })),
        });

        const diff = getStreamDifferences(fetchedStreams.val, existingStreams);

        AppLogger.debug("Successfully fetched streams", {
          service: SERVICE_NAME,
          count: diff.length,
          streams: diff.map((v) => ({
            rawId: v.rawId,
            title: v.title,
            status: v.status,
          })),
        });

        return Ok(diff);
      },
    );
  };

  const searchDeletedStreams = async (): Promise<Result<Streams, AppError>> => {
    return withTracerResult(
      SERVICE_NAME,
      "searchDeletedStreams",
      async (span) => {
        const existingStreams = await deps.streamRepository.list({
          limit: 500,
          page: 0,
          platform: PlatformSchema.Enum.youtube,
          languageCode: "default",
          orderBy: "desc",
        });
        if (existingStreams.err) {
          return existingStreams;
        }

        const youtubeStreamIds = existingStreams.val
          .filter((v) => v.platform === PlatformSchema.Enum.youtube)
          .map((v) => v.rawId);

        const ytFetchedStreams = await getStreamsByIDs({
          youtubeStreamIds,
          twitchStreamIds: [],
        });

        if (ytFetchedStreams.err) {
          return ytFetchedStreams;
        }

        // const existTwitchStreams = existingStreams.val.filter(
        //   (v) => v.platform === PlatformSchema.Enum.twitch,
        // );

        // const liveTwitchStreams = await searchLiveTwitchStreams();
        // if (liveTwitchStreams.err) {
        //   return liveTwitchStreams;
        // }

        // const liveTwitchStreamIds = liveTwitchStreams.val
        //   .filter((v) => v.platform === PlatformSchema.Enum.twitch)
        //   .map((v) => v.rawId);

        // const deletedTwitchStreams = existTwitchStreams.filter(
        //   (v) => !liveTwitchStreamIds.includes(v.rawId),
        // );

        const deletedYtStreams = existingStreams.val.filter(
          (v) => !ytFetchedStreams.val.find((fv) => fv.rawId === v.rawId),
        );

        const deletedStreams = deletedYtStreams;

        AppLogger.debug("Successfully fetched deleted streams", {
          service: SERVICE_NAME,
          count: deletedStreams.length,
          streams: deletedStreams.map((v) => ({
            rawId: v.rawId,
            title: v.title,
            status: v.status,
          })),
        });

        return Ok(
          deletedStreams.map((stream) => ({
            ...stream,
            deleted: true,
          })),
        );
      },
    );
  };

  const translateStreams = async ({
    languageCode,
    streams,
  }: {
    languageCode: string;
    streams: Streams;
  }): Promise<Result<Streams, AppError>> => {
    return withTracerResult(SERVICE_NAME, "translateStreams", async (span) => {
      AppLogger.debug("Translating streams", {
        service: SERVICE_NAME,
        languageCode,
        streamCount: streams.length,
      });

      const translatePromises = streams.map((stream) =>
        deps.aiService.translateText(stream.title, languageCode),
      );
      const translatedResults = await Promise.allSettled(translatePromises);
      const translatedStreams = streams.map((stream, i) => {
        const translatedText =
          translatedResults[i].status === "fulfilled"
            ? (translatedResults[i].value.val?.translatedText ?? stream.title)
            : stream.title;
        return {
          ...stream,
          title: translatedText,
          languageCode: TargetLangSchema.parse(languageCode),
          translated: true,
        };
      });

      AppLogger.debug("Successfully translated streams", {
        service: SERVICE_NAME,
        count: translatedStreams.length,
      });
      return Ok(translatedStreams);
    });
  };

  const getMemberStreams = async (): Promise<Result<Streams, AppError>> => {
    return withTracerResult(SERVICE_NAME, "getMemberStreams", async (span) => {
      // Check if the channel exists in our creators
      const creators = await masterCreators({
        creatorRepository: deps.creatorRepository,
      });
      if (creators.err) {
        AppLogger.error("Failed to get master creators", {
          service: SERVICE_NAME,
          error: creators.err,
        });
        return creators;
      }
      const channelIds = creators.val.jp
        .map((c) => c.channel?.youtube?.rawId)
        .concat(creators.val.en.map((c) => c.channel?.youtube?.rawId))
        .filter((id) => id !== undefined);

      const existingLiveStreams = await deps.streamRepository.list({
        limit: 500,
        page: 0,
        languageCode: "default",
        status: StatusSchema.Enum.live,
        channelIds: channelIds,
        orderBy: "desc",
      });
      if (existingLiveStreams.err) {
        return existingLiveStreams;
      }

      const existingStreams = existingLiveStreams.val;

      const promises = channelIds.map((id) =>
        getStreamsByChannel({ channelId: id, maxResults: 50 }),
      );
      const results = await Promise.allSettled(promises);
      const streams = results
        .filter(
          (r): r is PromiseFulfilledResult<OkResult<Streams>> =>
            r.status === "fulfilled" && !r.value.err,
        )
        .flatMap((r) => r.value.val);

      const streamsWithDiff = getStreamDifferences(streams, existingStreams);

      AppLogger.debug("Successfully fetched member streams", {
        service: SERVICE_NAME,
        count: streamsWithDiff.length,
        streams: streamsWithDiff.map((v) => ({
          rawId: v.rawId,
          title: v.title,
          status: v.status,
        })),
      });
      return Ok(streamsWithDiff);
    });
  };

  const getStreamsByChannel = async ({
    channelId,
    maxResults,
    order,
    eventType,
  }: {
    channelId: string;
    maxResults?: number;
    order?:
      | "date"
      | "rating"
      | "relevance"
      | "title"
      | "videoCount"
      | "viewCount";
    eventType?: "completed" | "live" | "upcoming";
  }): Promise<Result<Streams, AppError>> => {
    return withTracerResult(
      SERVICE_NAME,
      "getStreamsByChannel",
      async (span) => {
        AppLogger.debug("Fetching streams by channel ID", {
          service: SERVICE_NAME,
          channelId,
        });

        // Fetch streams from the channel
        const result = await deps.youtubeClient.getStreamsByChannel({
          channelId,
          maxResults,
          order,
          eventType,
        });

        if (result.err) {
          AppLogger.error("Failed to fetch streams by channel", {
            service: SERVICE_NAME,
            channelId,
            error: result.err,
          });
          return result;
        }

        const yt = await deps.youtubeClient.getStreams({
          streamIds: result.val.map((v) => v.rawId),
        });

        if (yt.err) {
          return yt;
        }

        AppLogger.debug("Successfully fetched streams by channel", {
          service: SERVICE_NAME,
          channelId,
          count: yt.val.length,
          streams: yt.val.map((v) => ({
            rawId: v.rawId,
            title: v.title,
            status: v.status,
          })),
        });

        return Ok(yt.val);
      },
    );
  };

  const getStreamsByStreamIds = async (params: {
    streamIds: string[];
  }): Promise<Result<Streams, AppError>> => {
    return withTracerResult(
      SERVICE_NAME,
      "getStreamsByStreamIds",
      async (span) => {
        return deps.youtubeClient.getStreams({
          streamIds: params.streamIds,
        });
      },
    );
  };

  return {
    searchLiveYoutubeStreams,
    searchLiveTwitchStreams,
    searchLiveTwitCastingStreams,
    searchLiveBilibiliStreams,
    searchAllLiveStreams,
    searchExistStreams,
    getStreamsByIDs,
    searchDeletedStreams,
    translateStreams,
    getStreamsByChannel,
    getMemberStreams,
    getStreamsByStreamIds,
  };
};
