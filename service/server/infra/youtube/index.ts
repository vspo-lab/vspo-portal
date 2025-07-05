import { getCurrentUTCString } from "@vspo-lab/dayjs";
import { AppError, Err, Ok, type Result, wrap } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import { google, type youtube_v3 } from "googleapis";
import {
  type Channels,
  createChannel,
  createChannels,
} from "../../domain/channel";
import { type Clips, createClip, createClips } from "../../domain/clip";
import { type Streams, createStream, createStreams } from "../../domain/stream";
import { withTracerResult } from "../http/trace/cloudflare";

type GetStreamsParams = {
  streamIds: string[];
};

export const query = {
  VSPO_JP: "ぶいすぽ",
  VSPO_JP_CLIP: "ぶいすぽ 切り抜き",
  VSPO_EN: "vspo",
  VSPO_EN_CLIP: "vspo clips",
} as const;

export type QueryKeys = (typeof query)[keyof typeof query];

export type SearchStreamsParams = {
  query: QueryKeys;
  eventType: "completed" | "live" | "upcoming";
};

export type GetChannelsParams = {
  channelIds: string[];
};

export type GetStreamsByChannelParams = {
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
};

export type SearchClipsParams = {
  query?: QueryKeys | string;
  channelId?: string;
  maxResults?: number;
  order: "relevance" | "date" | "rating" | "title" | "videoCount" | "viewCount";
};

export type GetClipsParams = {
  videoIds: string[];
};

export interface IYoutubeService {
  getStreams(params: GetStreamsParams): Promise<Result<Streams, AppError>>;
  searchStreams(
    params: SearchStreamsParams,
  ): Promise<Result<Streams, AppError>>;
  getChannels(params: GetChannelsParams): Promise<Result<Channels, AppError>>;
  getStreamsByChannel(
    params: GetStreamsByChannelParams,
  ): Promise<Result<Streams, AppError>>;
  searchClips(params: SearchClipsParams): Promise<Result<Clips, AppError>>;
  getClips(params: GetClipsParams): Promise<Result<Clips, AppError>>;
}

const chunkArray = <T>(array: T[], size: number): T[][] => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

const parseYoutubeDuration = (duration: string): number => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = match[1] ? Number.parseInt(match[1], 10) : 0;
  const minutes = match[2] ? Number.parseInt(match[2], 10) : 0;
  const seconds = match[3] ? Number.parseInt(match[3], 10) : 0;

  return hours * 3600 + minutes * 60 + seconds;
};

const isYoutubeShort = (v: youtube_v3.Schema$Video): boolean => {
  if (!v.id) return false;

  // tag
  const tags = v.snippet?.tags || [];
  if (tags.includes("shorts")) {
    return true;
  }

  // title
  const title = v.snippet?.title || "";
  if (title.includes("#shorts")) {
    return true;
  }

  // duration < 60s
  const duration = v.contentDetails?.duration || "";
  const durationInSeconds = parseYoutubeDuration(duration);
  if (durationInSeconds <= 60) {
    return true;
  }

  return false;
};

const determineStreamStatus = (
  video: youtube_v3.Schema$Video | youtube_v3.Schema$SearchResult,
): "live" | "upcoming" | "ended" | "unknown" => {
  if (video?.snippet?.liveBroadcastContent) {
    if (video.snippet.liveBroadcastContent === "live") {
      return "live";
    }

    if (video.snippet.liveBroadcastContent === "upcoming") {
      return "upcoming";
    }
  }

  if ("liveStreamingDetails" in video) {
    if (video?.liveStreamingDetails?.actualEndTime) {
      return "ended";
    }

    if (
      video?.liveStreamingDetails?.actualStartTime &&
      !video?.liveStreamingDetails?.actualEndTime
    ) {
      return "live";
    }

    if (
      video?.liveStreamingDetails?.scheduledStartTime &&
      !video.liveStreamingDetails?.actualStartTime
    ) {
      return "upcoming";
    }
  }

  // Probably a regular video
  return "ended"; // Regular videos are treated as ended streams
};

export const createYoutubeService = (apiKey: string): IYoutubeService => {
  const youtube = google.youtube({
    version: "v3",
    auth: apiKey,
  });

  const getStreams = async (
    params: GetStreamsParams,
  ): Promise<Result<Streams, AppError>> => {
    return withTracerResult("YoutubeService", "getStreams", async (span) => {
      AppLogger.debug("getStreams", {
        streamIds: params.streamIds,
      });
      const chunks = chunkArray(params.streamIds, 50);
      const videos: youtube_v3.Schema$Video[] = [];
      for (const chunk of chunks) {
        const responseResult = await wrap(
          youtube.videos.list({
            part: ["snippet", "liveStreamingDetails", "statistics"],
            id: chunk,
          }),
          (err) =>
            new AppError({
              message: `Network error while fetching videos: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
            }),
        );
        if (responseResult.err) {
          return Err(responseResult.err);
        }

        const response = responseResult.val;
        videos.push(...(response.data.items || []));
      }
      return Ok(
        createStreams(
          videos.map((video) =>
            createStream({
              id: "",
              rawId: video.id || "",
              rawChannelID: video.snippet?.channelId || "",
              title: video.snippet?.title || "",
              languageCode: "default",
              description: video.snippet?.description || "",
              publishedAt: video.snippet?.publishedAt || getCurrentUTCString(),
              startedAt:
                video.liveStreamingDetails?.actualStartTime ||
                video.liveStreamingDetails?.scheduledStartTime ||
                null,
              endedAt:
                video.liveStreamingDetails?.actualEndTime ||
                video.liveStreamingDetails?.scheduledEndTime ||
                null,
              platform: "youtube",
              status: determineStreamStatus(video),
              tags: video.snippet?.tags || [],
              viewCount: Number.parseInt(
                video.statistics?.viewCount || "0",
                10,
              ),
              thumbnailURL:
                video.snippet?.thumbnails?.high?.url ||
                video.snippet?.thumbnails?.standard?.url ||
                video.snippet?.thumbnails?.medium?.url ||
                video.snippet?.thumbnails?.default?.url ||
                video.snippet?.thumbnails?.maxres?.url ||
                "",
            }),
          ),
        ),
      );
    });
  };

  const searchStreams = async (
    params: SearchStreamsParams,
  ): Promise<Result<Streams, AppError>> => {
    return withTracerResult("YoutubeService", "searchStreams", async (span) => {
      const responseResult = await wrap(
        youtube.search.list({
          part: ["snippet"],
          q: params.query,
          maxResults: 50,
          eventType: params.eventType,
          type: ["video"],
          safeSearch: "none",
          order: "relevance",
        }),
        (err) =>
          new AppError({
            message: `Network error while searching videos: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
          }),
      );

      if (responseResult.err) {
        return Err(responseResult.err);
      }

      const response = responseResult.val;
      return Ok(
        createStreams(
          response.data.items?.map((video) =>
            createStream({
              id: "",
              rawId: video.id?.videoId || "",
              languageCode: "default",
              title: video.snippet?.title || "",
              description: video.snippet?.description || "",
              rawChannelID:
                video.snippet?.channelId || video.id?.channelId || "",
              publishedAt: video.snippet?.publishedAt || getCurrentUTCString(),
              startedAt: null,
              endedAt: null,
              platform: "youtube",
              status: params.eventType === "live" ? "live" : "upcoming",
              tags: [],
              viewCount: 0,
              thumbnailURL:
                video.snippet?.thumbnails?.default?.url ||
                video.snippet?.thumbnails?.standard?.url ||
                "",
            }),
          ) || [],
        ),
      );
    });
  };

  const getChannels = async (
    params: GetChannelsParams,
  ): Promise<Result<Channels, AppError>> => {
    return withTracerResult("YoutubeService", "getChannels", async (span) => {
      const chunks = chunkArray(params.channelIds, 50);
      const channels: youtube_v3.Schema$Channel[] = [];

      for (const chunk of chunks) {
        const responseResult = await wrap(
          youtube.channels.list({
            part: ["snippet"],
            id: chunk,
          }),
          (err) =>
            new AppError({
              message: `Network error while fetching channels: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
            }),
        );

        if (responseResult.err) {
          return Err(responseResult.err);
        }

        const response = responseResult.val;
        channels.push(...(response.data.items || []));
      }

      return Ok(
        createChannels(
          channels.map((channel) =>
            createChannel({
              id: channel.id || "",
              creatorID: "",
              youtube: {
                rawId: channel.id || "",
                name: channel.snippet?.title || "",
                description: channel.snippet?.description || "",
                thumbnailURL:
                  channel.snippet?.thumbnails?.default?.url ||
                  channel.snippet?.thumbnails?.standard?.url ||
                  "",
                publishedAt: channel.snippet?.publishedAt || null,
                subscriberCount: 0,
              },
              twitch: null,
              twitCasting: null,
              niconico: null,
              bilibili: null,
            }),
          ),
        ),
      );
    });
  };

  const getStreamsByChannel = async (
    params: GetStreamsByChannelParams,
  ): Promise<Result<Streams, AppError>> => {
    return withTracerResult(
      "YoutubeService",
      "getStreamsByChannel",
      async (span) => {
        const option: youtube_v3.Params$Resource$Search$List = {
          part: ["snippet"],
          channelId: params.channelId,
          maxResults: 50,
          order: "date",
          type: ["video"],
        };

        if (params.eventType) {
          option.eventType = params.eventType;
        }

        if (params.order) {
          option.order = params.order;
        }

        if (params.maxResults) {
          option.maxResults = params.maxResults;
        }

        const responseResult = await wrap(
          youtube.search.list(option),
          (err) =>
            new AppError({
              message: `Network error while fetching videos by channel: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
            }),
        );

        if (responseResult.err) {
          return Err(responseResult.err);
        }

        const response = responseResult.val;
        return Ok(
          createStreams(
            response.data.items?.map((video) =>
              createStream({
                id: "",
                rawId: video.id?.videoId || "",
                languageCode: "default",
                title: video.snippet?.title || "",
                description: video.snippet?.description || "",
                rawChannelID: video.snippet?.channelId || "",
                publishedAt:
                  video.snippet?.publishedAt || getCurrentUTCString(),
                startedAt: null,
                endedAt: null,
                platform: "youtube",
                status: determineStreamStatus(video),
                tags: [],
                viewCount: 0,
                thumbnailURL:
                  video.snippet?.thumbnails?.medium?.url ||
                  video.snippet?.thumbnails?.standard?.url ||
                  video.snippet?.thumbnails?.default?.url ||
                  video.snippet?.thumbnails?.maxres?.url ||
                  video.snippet?.thumbnails?.high?.url ||
                  "",
              }),
            ) || [],
          ),
        );
      },
    );
  };

  const searchClips = async (
    params: SearchClipsParams,
  ): Promise<Result<Clips, AppError>> => {
    return withTracerResult("YoutubeService", "searchClips", async (span) => {
      const searchParams: youtube_v3.Params$Resource$Search$List = {
        part: ["snippet"],
        maxResults: params.maxResults || 50,
        type: ["video"],
        safeSearch: "none",
        order: params.order,
      };

      if (params.query) {
        searchParams.q = params.query;
      }

      if (params.channelId) {
        searchParams.channelId = params.channelId;
      }

      const responseResult = await wrap(
        youtube.search.list(searchParams),
        (err) =>
          new AppError({
            message: `Network error while fetching clips: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );
      if (responseResult.err) {
        return Err(responseResult.err);
      }

      return Ok(
        createClips(
          responseResult.val.data.items?.map((item) => {
            return {
              id: "",
              rawId: item.id?.videoId || "",
              title: item.snippet?.title || "",
              languageCode: "default",
              rawChannelID: item.snippet?.channelId || "",
              description: item.snippet?.description || "",
              publishedAt: item.snippet?.publishedAt || getCurrentUTCString(),
              platform: "youtube",
              tags: [],
              viewCount: 0,
              thumbnailURL: item.snippet?.thumbnails?.default?.url || "",
              type: "clip",
            };
          }) ?? [],
        ),
      );
    });
  };

  const getClips = async (
    params: GetClipsParams,
  ): Promise<Result<Clips, AppError>> => {
    return withTracerResult("YoutubeService", "getClips", async (span) => {
      const chunks = chunkArray(params.videoIds, 50);
      const items: youtube_v3.Schema$Video[] = [];

      for (const chunk of chunks) {
        const responseResult = await wrap(
          youtube.videos.list({
            part: ["snippet", "contentDetails", "statistics"],
            id: chunk,
          }),
          (err) =>
            new AppError({
              message: `Network error while fetching clips: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (responseResult.err) {
          return Err(responseResult.err);
        }

        const response = responseResult.val;
        items.push(...(response.data.items || []));
      }

      return Ok(
        createClips(
          items.map((item) => {
            const videoId = item.id || "";
            const duration = item.contentDetails?.duration || "";
            const durationInSeconds = parseYoutubeDuration(duration);
            return createClip({
              id: "",
              rawId: videoId,
              title: item.snippet?.title || "",
              languageCode: "default",
              rawChannelID: item.snippet?.channelId || "",
              description: item.snippet?.description || "",
              publishedAt: item.snippet?.publishedAt || getCurrentUTCString(),
              platform: "youtube",
              tags: item.snippet?.tags || [],
              viewCount: Number.parseInt(item.statistics?.viewCount || "0", 10),
              thumbnailURL:
                item.snippet?.thumbnails?.medium?.url ||
                item.snippet?.thumbnails?.standard?.url ||
                item.snippet?.thumbnails?.default?.url ||
                item.snippet?.thumbnails?.maxres?.url ||
                item.snippet?.thumbnails?.high?.url ||
                "",
              type: isYoutubeShort(item) ? "short" : "clip",
              duration: durationInSeconds,
            });
          }) ?? [],
        ),
      );
    });
  };

  return {
    getStreams,
    searchStreams,
    getChannels,
    getStreamsByChannel,
    searchClips,
    getClips,
  };
};
