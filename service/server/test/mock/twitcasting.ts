import { vi } from "vitest";
import type { Stream } from "../../domain/stream";

export type MockResponse =
  | {
      body: Record<string, unknown>;
      status: number;
      statusText?: string;
    }
  | Error;

export type TestCase<T> = {
  name: string;
  mockResponses: MockResponse[];
  expectedError?: string;
  expectedResult?: Partial<Stream>;
} & T;

// Mock responses
export const mockTwitcastingResponses = {
  validMovies: {
    body: {
      movies: [
        {
          id: "movie_id_1",
          title: "🔴 Live Stream",
          is_live: true,
          total_view_count: 1000,
          large_thumbnail: "https://example.com/thumbnail1.jpg",
          created: 1704067200, // 2024-01-01T00:00:00Z
          user_id: "user_id_1",
        },
        {
          id: "movie_id_2",
          title: "Past Stream",
          is_live: false,
          total_view_count: 5000,
          large_thumbnail: "https://example.com/thumbnail2.jpg",
          created: 1704153600, // 2024-01-02T00:00:00Z
          user_id: "user_id_1",
        },
      ],
    },
    status: 200,
    statusText: "OK",
  },
  invalidToken: {
    body: {
      error: "invalid_token",
      error_description: "The access token is invalid",
    },
    status: 401,
    statusText: "Unauthorized",
  },
  invalidResponse: {
    body: {
      error: "invalid_request",
      error_description: "Invalid request parameters",
    },
    status: 400,
    statusText: "Bad Request",
  },
  networkError: new Error("Network error"),
};

// Mock fetch function for TwitCasting API
export const mockTwitcastingFetch = vi
  .fn()
  .mockImplementation(async (url: string, options: RequestInit) => {
    // Check for authorization
    const headers = options.headers as Record<string, string>;
    if (!headers?.Authorization?.includes("Bearer dummy_token")) {
      return new Response(
        JSON.stringify(mockTwitcastingResponses.invalidToken.body),
        {
          status: mockTwitcastingResponses.invalidToken.status,
          statusText: mockTwitcastingResponses.invalidToken.statusText,
        },
      );
    }

    // Network error case
    if (url.includes("error")) {
      throw mockTwitcastingResponses.networkError;
    }

    // Invalid response case
    if (url.includes("invalid_response")) {
      return new Response(
        JSON.stringify(mockTwitcastingResponses.invalidResponse.body),
        {
          status: mockTwitcastingResponses.invalidResponse.status,
          statusText: mockTwitcastingResponses.invalidResponse.statusText,
        },
      );
    }

    // Invalid token case
    if (url.includes("invalid")) {
      return new Response(
        JSON.stringify(mockTwitcastingResponses.invalidToken.body),
        {
          status: mockTwitcastingResponses.invalidToken.status,
          statusText: mockTwitcastingResponses.invalidToken.statusText,
        },
      );
    }

    // Valid response case
    return new Response(
      JSON.stringify(mockTwitcastingResponses.validMovies.body),
      {
        status: mockTwitcastingResponses.validMovies.status,
        statusText: mockTwitcastingResponses.validMovies.statusText,
      },
    );
  });

// Setup global fetch mock
vi.stubGlobal("fetch", mockTwitcastingFetch);
