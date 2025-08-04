import { type AppError, Ok, type Result } from "@vspo-lab/error";
import type { Channel } from "../../domain/channel";
import type { Clip } from "../../domain/clip";
import type { Stream } from "../../domain/stream";
import type {
  ITwitcastingService,
  ITwitchService,
  IYoutubeService,
  SearchClipsParams,
} from "../../infra";
import type {
  TwitCastingStream,
  TwitcastingMovie,
} from "../../infra/twitcasting";

export class MockYoutubeService implements IYoutubeService {
  youtube = null;
  chunkArray = () => [];

  async getChannels(_params: {
    channelIds: string[];
  }): Promise<Result<Channel[], AppError>> {
    return Ok([]);
  }

  async getStreams(_params: {
    streamIds: string[];
  }): Promise<Result<Stream[], AppError>> {
    return Ok([]);
  }

  async searchStreams(_params: {
    query: string;
    eventType: "completed" | "live" | "upcoming";
  }): Promise<Result<Stream[], AppError>> {
    return Ok([]);
  }

  async getStreamsByChannel(_params: {
    channelId: string;
    maxResults?: number;
    order?:
      | "date"
      | "rating"
      | "relevance"
      | "title"
      | "videoCount"
      | "viewCount";
  }): Promise<Result<Stream[], AppError>> {
    return Ok([]);
  }

  async searchClips(
    _params: SearchClipsParams,
  ): Promise<Result<Clip[], AppError>> {
    return Ok([]);
  }

  async getClips(_params: {
    videoIds: string[];
  }): Promise<Result<Clip[], AppError>> {
    return Ok([]);
  }
}

export class MockTwitchService implements ITwitchService {
  baseUrl = "";
  accessToken = "";
  config = { clientId: "", clientSecret: "" };

  async getAccessToken(): Promise<string> {
    return "";
  }

  async fetchFromTwitch<T>(): Promise<Result<T, AppError>> {
    return Ok({} as T);
  }

  async getStreams(_params: {
    userIds: string[];
  }): Promise<Result<Stream[], AppError>> {
    return Ok([]);
  }

  async getStreamsByIDs(_params: {
    streamIds: string[];
  }): Promise<Result<Stream[], AppError>> {
    return Ok([]);
  }

  async getArchive(_params: {
    userIds: string[];
  }): Promise<Result<Stream[], AppError>> {
    return Ok([]);
  }

  async getClipsByUserID(_params: {
    userId: string;
  }): Promise<Result<Clip[], AppError>> {
    return Ok([]);
  }
}

export class MockTwitcastingService implements ITwitcastingService {
  accessToken = "";

  async fetchUserStreams(
    _userId: string,
  ): Promise<Result<TwitCastingStream[], AppError>> {
    return Ok([]);
  }

  async mapToTwitCastingStream(
    _movie: TwitcastingMovie,
  ): Promise<TwitCastingStream> {
    return {} as TwitCastingStream;
  }

  async createStreamModel(_video: TwitCastingStream): Promise<Stream> {
    return {} as Stream;
  }

  async getStreams(_params: {
    userIds: string[];
  }): Promise<Result<Stream[], AppError>> {
    return Ok([]);
  }
}
