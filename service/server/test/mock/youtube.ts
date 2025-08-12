import { type AppError, Ok, type Result } from "@vspo-lab/error";
import { vi } from "vitest";
import type { Channel } from "../../domain/channel";
import type { Clip } from "../../domain/clip";
import type { Stream } from "../../domain/stream";
import type { IYoutubeService, SearchClipsParams } from "../../infra/youtube";

export type MockResponse =
  | {
      body: Record<string, unknown>;
      status: number;
    }
  | Error;

export type TestCase<T> = {
  name: string;
  mockResponses: MockResponse[];
  expectedError?: string;
  expectedResult?: T extends { streamIds: string[] } | { query: string }
    ? Partial<Stream>
    : T extends { channelIds: string[] }
      ? Channel
      : never;
} & T;

// Mock responses
export const mockYoutubeResponses = {
  validStreams: {
    body: {
      items: [
        {
          id: "archive_video_id",
          snippet: {
            publishedAt: "2024-01-01T00:00:00Z",
            channelId: "channel_id_1",
            title: "Archived Stream",
            description: "This is an archived stream",
            thumbnails: {
              default: { url: "https://example.com/archive_thumb.jpg" },
            },
            channelTitle: "Gaming Channel",
            tags: ["gaming", "archive"],
          },
          statistics: {
            viewCount: "10000",
          },
          liveStreamingDetails: {
            actualStartTime: "2024-01-01T00:00:00Z",
            actualEndTime: "2024-01-01T02:00:00Z",
          },
        },
      ],
    },
    status: 200,
  },
  validSearchResults: {
    body: {
      items: [
        {
          id: { videoId: "live_video_id" },
          snippet: {
            publishedAt: "2024-01-02T00:00:00Z",
            channelId: "channel_id_2",
            title: "🔴 Live Gaming Stream",
            description: "Currently streaming!",
            thumbnails: {
              default: { url: "https://example.com/live_thumb.jpg" },
            },
            channelTitle: "Live Gaming",
          },
        },
      ],
    },
    status: 200,
  },
  validChannels: {
    body: {
      items: [
        {
          id: "channel_id_1",
          snippet: {
            title: "Gaming Channel",
            description: "Main gaming channel",
            publishedAt: "2023-01-01T00:00:00Z",
            thumbnails: {
              default: { url: "https://example.com/channel1_thumb.jpg" },
            },
          },
        },
      ],
    },
    status: 200,
  },
  invalidRequest: {
    body: { error: { message: "Invalid request" } },
    status: 400,
  },
  networkError: new Error("Network error"),
};

// Mock YouTube client
export const mockYoutubeClient = {
  videos: {
    list: vi.fn().mockImplementation(async ({ id }) => {
      if (id?.includes("invalid_id")) {
        throw new Error("YouTube API error");
      }
      if (id?.includes("error")) {
        throw mockYoutubeResponses.networkError;
      }
      return { data: mockYoutubeResponses.validStreams.body };
    }),
  },
  search: {
    list: vi.fn().mockImplementation(async ({ q }) => {
      if (q === "invalid") {
        throw new Error("YouTube API error");
      }
      if (q?.includes("error")) {
        throw mockYoutubeResponses.networkError;
      }
      return { data: mockYoutubeResponses.validSearchResults.body };
    }),
  },
  channels: {
    list: vi.fn().mockImplementation(async ({ id }) => {
      if (id?.includes("invalid_id")) {
        throw new Error("YouTube API error");
      }
      if (id?.includes("error")) {
        throw mockYoutubeResponses.networkError;
      }
      return { data: mockYoutubeResponses.validChannels.body };
    }),
  },
};
vi.mock("googleapis", () => ({
  google: {
    youtube: vi.fn().mockImplementation(() => mockYoutubeClient),
  },
}));

export const mockYoutubeService: IYoutubeService = {
  getChannels: async (_params: {
    channelIds: string[];
  }): Promise<Result<Channel[], AppError>> => {
    return Ok([]);
  },

  getStreams: async (_params: {
    streamIds: string[];
  }): Promise<Result<Stream[], AppError>> => {
    return Ok([]);
  },

  searchStreams: async (_params: {
    query: string;
    eventType: "completed" | "live" | "upcoming";
  }): Promise<Result<Stream[], AppError>> => {
    return Ok([]);
  },

  getStreamsByChannel: async (_params: {
    channelId: string;
    maxResults?: number;
    order?:
      | "date"
      | "rating"
      | "relevance"
      | "title"
      | "videoCount"
      | "viewCount";
  }): Promise<Result<Stream[], AppError>> => {
    return Ok([]);
  },

  searchClips: async (
    _params: SearchClipsParams,
  ): Promise<Result<Clip[], AppError>> => {
    return Ok([]);
  },

  getClips: async (_params: {
    videoIds: string[];
  }): Promise<Result<Clip[], AppError>> => {
    return Ok([]);
  },
};
