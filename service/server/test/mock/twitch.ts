import { vi } from "vitest";
import type { Stream } from "../../domain";
import type { paths } from "../../infra/twitch/twitch-api.generated";

type StreamsResponse =
  paths["/streams"]["get"]["responses"]["200"]["content"]["application/json"];
type VideosResponse =
  paths["/videos"]["get"]["responses"]["200"]["content"]["application/json"];

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
  expectedResult?: Partial<Stream>;
} & T;

// Mock responses
export const mockTwitchResponses = {
  validToken: {
    body: { access_token: "dummy_token" },
    status: 200,
  },
  invalidToken: {
    body: {
      error: "invalid_client",
      error_description: "Invalid client credentials",
    },
    status: 401,
  },
  validStreams: {
    body: {
      data: [
        {
          id: "stream_id_1",
          user_id: "user_id_1",
          user_login: "streamer1",
          user_name: "streamer1",
          game_id: "123456",
          game_name: "Just Chatting",
          type: "live",
          title: "🔴 Live Gaming Stream",
          viewer_count: 1000,
          started_at: "2024-01-01T00:00:00Z",
          language: "ja",
          thumbnail_url: "https://example.com/thumbnail1.jpg",
          tag_ids: ["123", "456"],
          tags: ["gaming", "live"],
          is_mature: false,
        },
      ],
    } as StreamsResponse,
    status: 200,
  },
  validVideos: {
    body: {
      data: [
        {
          id: "video_id_1",
          stream_id: "stream_id_1",
          user_id: "user_id_1",
          user_login: "streamer1",
          user_name: "streamer1",
          title: "Past Stream",
          description: "This was a great stream",
          created_at: "2024-01-01T00:00:00Z",
          published_at: "2024-01-01T00:00:00Z",
          url: "https://twitch.tv/videos/video_id_1",
          thumbnail_url: "https://example.com/thumbnail1.jpg",
          viewable: "public",
          view_count: 1000,
          language: "ja",
          type: "archive",
          duration: "1h30m",
          muted_segments: null,
        },
      ],
    } as VideosResponse,
    status: 200,
  },
  networkError: new Error("Network error"),
};

// Mock fetch function for Twitch API
export const mockTwitchFetch = vi
  .fn()
  .mockImplementation(async (url: string, options: RequestInit) => {
    // Auth token endpoint
    if (url.includes("oauth2/token")) {
      // Network error case
      if (url.includes("error") || options.body?.toString().includes("error")) {
        throw mockTwitchResponses.networkError;
      }
      // Invalid token case
      if (
        url.includes("invalid") ||
        options.body?.toString().includes("invalid")
      ) {
        return new Response(
          JSON.stringify(mockTwitchResponses.invalidToken.body),
          { status: mockTwitchResponses.invalidToken.status },
        );
      }
      // Valid token case
      return new Response(JSON.stringify(mockTwitchResponses.validToken.body), {
        status: mockTwitchResponses.validToken.status,
      });
    }

    // Check for authorization
    const headers = options.headers as Record<string, string>;
    if (!headers?.Authorization?.includes("Bearer dummy_token")) {
      return new Response(
        JSON.stringify(mockTwitchResponses.invalidToken.body),
        { status: mockTwitchResponses.invalidToken.status },
      );
    }

    // Network error case for API endpoints
    if (url.includes("error")) {
      throw mockTwitchResponses.networkError;
    }

    // Invalid ID case
    if (url.includes("invalid")) {
      return new Response(
        JSON.stringify(mockTwitchResponses.invalidToken.body),
        { status: mockTwitchResponses.invalidToken.status },
      );
    }

    // Streams endpoint
    if (url.includes("/streams")) {
      return new Response(
        JSON.stringify(mockTwitchResponses.validStreams.body),
        { status: mockTwitchResponses.validStreams.status },
      );
    }

    // Videos endpoint
    if (url.includes("/videos")) {
      return new Response(
        JSON.stringify(mockTwitchResponses.validVideos.body),
        { status: mockTwitchResponses.validVideos.status },
      );
    }

    throw new Error(`Unhandled mock request: ${url}`);
  });

// Setup global fetch mock
vi.stubGlobal("fetch", mockTwitchFetch);
