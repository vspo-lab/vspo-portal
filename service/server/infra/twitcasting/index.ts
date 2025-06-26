import { AppError, Err, Ok, type Result, wrap } from "@vspo-lab/error";
import { type Streams, createStream, createStreams } from "../../domain/stream";
import { withTracerResult } from "../http/trace/cloudflare";
import {
  type TwitcastingAuthConfig,
  type TwitcastingAuthHeader,
  createBasicAuthHeader,
} from "./auth";

export type TwitcastingUser = {
  id: string;
};

export type TwitcastingMovie = {
  id: string;
  user_id: string;
  title: string;
  subtitle?: string;
  last_owner_comment?: string;
  category?: string;
  link: string;
  is_live: boolean;
  is_recorded: boolean;
  comment_count: number;
  large_thumbnail: string;
  small_thumbnail: string;
  country?: string;
  duration: number;
  created: number;
  is_collabo: boolean;
  is_protected: boolean;
  max_view_count: number;
  current_view_count: number;
  total_view_count: number;
  hls_url: string | null;
};

type TwitcastingMoviesResponse = {
  movies: TwitcastingMovie[];
  total_count: number;
};

type GetStreamsParams = {
  userIds: string[];
};

export type TwitCastingStream = {
  id: string;
  userId: string;
  title: string;
  isLive: boolean;
  viewCount: number;
  thumbnailURL: string;
  startedAt: number;
  link: string;
};

export interface ITwitcastingService {
  getStreams(params: GetStreamsParams): Promise<Result<Streams, AppError>>;
}

const isObject = (value: unknown): value is Record<PropertyKey, unknown> => {
  return typeof value === "object" && value !== null;
};

const hasMoviesProperty = (
  obj: Record<PropertyKey, unknown>,
): obj is { movies: unknown } => {
  return Object.prototype.hasOwnProperty.call(obj, "movies");
};

const hasTotalCountProperty = (
  obj: Record<PropertyKey, unknown>,
): obj is { total_count: unknown } => {
  return Object.prototype.hasOwnProperty.call(obj, "total_count");
};

const isMoviesArray = (obj: { movies: unknown }): obj is {
  movies: unknown[];
} => {
  return Array.isArray(obj.movies);
};

const isValidMoviesResponse = (
  data: unknown,
): data is TwitcastingMoviesResponse => {
  if (!isObject(data)) {
    return false;
  }
  if (!hasMoviesProperty(data)) {
    return false;
  }
  if (!isMoviesArray(data)) {
    return false;
  }
  if (!hasTotalCountProperty(data)) {
    return false;
  }
  if (typeof data.total_count !== "number") {
    return false;
  }
  return true;
};

const mapToTwitCastingStream = (movie: TwitcastingMovie): TwitCastingStream => {
  return {
    id: movie.id,
    userId: movie.user_id,
    title: movie.title,
    isLive: movie.is_live,
    viewCount: movie.total_view_count,
    thumbnailURL: movie.large_thumbnail,
    startedAt: movie.created,
    link: movie.link,
  };
};

const createStreamModel = (video: TwitCastingStream) => {
  // Convert UNIX timestamp to ISO string
  const startedAt = new Date(video.startedAt * 1000).toISOString();

  return createStream({
    id: "",
    rawId: video.id,
    rawChannelID: video.userId,
    languageCode: "default",
    title: video.title,
    description: video.title,
    publishedAt: startedAt,
    startedAt: startedAt,
    endedAt: null,
    platform: "twitcasting",
    status: video.isLive ? "live" : "ended",
    tags: [],
    viewCount: video.viewCount,
    thumbnailURL: video.thumbnailURL,
    videoPlayerLink: video.link,
    link: video.link,
  });
};

const fetchUserStreams = async (
  authHeader: TwitcastingAuthHeader,
  userId: string,
): Promise<Result<TwitCastingStream[], AppError>> => {
  return withTracerResult(
    "TwitcastingService",
    "fetchUserStreams",
    async (span) => {
      const fetchPromise = fetch(
        `https://apiv2.twitcasting.tv/users/${userId}/movies?limit=3`,
        {
          method: "GET",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
            "X-Api-Version": "2.0",
            Accept: "application/json",
          },
        },
      );

      const responseResult = await wrap(
        fetchPromise,
        (err) =>
          new AppError({
            message: `Network error while fetching videos for user ${userId}: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
          }),
      );
      if (responseResult.err) {
        return responseResult;
      }

      const response = responseResult.val;
      if (!response.ok) {
        return Err(
          new AppError({
            message: `Failed to fetch videos for user ${userId}: ${response.status} ${response.statusText || "Unauthorized"}`,
            code: "INTERNAL_SERVER_ERROR",
          }),
        );
      }

      const dataResult = await wrap(
        response.json(),
        (err) =>
          new AppError({
            message: `Failed to parse JSON response for user ${userId}: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
          }),
      );
      if (dataResult.err) {
        return dataResult;
      }

      const data = dataResult.val;
      if (!isValidMoviesResponse(data)) {
        return Err(
          new AppError({
            message: `Invalid response format for user ${userId}`,
            code: "INTERNAL_SERVER_ERROR",
          }),
        );
      }

      const videos = data.movies.map((movie) => mapToTwitCastingStream(movie));
      return Ok(videos);
    },
  );
};

export const createTwitcastingService = (
  authConfig: TwitcastingAuthConfig,
): ITwitcastingService => {
  const getStreams = async (
    params: GetStreamsParams,
  ): Promise<Result<Streams, AppError>> => {
    return withTracerResult(
      "TwitcastingService",
      "getStreams",
      async (span) => {
        const authHeaderResult = createBasicAuthHeader(authConfig);
        if (authHeaderResult.err) {
          return Err(authHeaderResult.err);
        }
        const authHeader = authHeaderResult.val;

        let allStreams: Streams = createStreams([]);

        for (const userId of params.userIds) {
          const result = await fetchUserStreams(authHeader, userId);
          if (result.err) {
            return Err(result.err);
          }
          allStreams = createStreams([
            ...allStreams,
            ...result.val.map((video) => createStreamModel(video)),
          ]);
        }

        return Ok(allStreams);
      },
    );
  };

  return {
    getStreams,
  };
};
