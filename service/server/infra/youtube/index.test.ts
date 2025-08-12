import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Channel } from "../../domain/channel";
import {
  mockYoutubeClient,
  mockYoutubeResponses,
  type TestCase,
} from "../../test/mock/youtube";
import { createYoutubeService, type IYoutubeService, query } from "./index";

type QueryEventType = "completed" | "live" | "upcoming";

describe("YoutubeService", () => {
  let youtubeService: IYoutubeService;

  beforeEach(() => {
    vi.mock("googleapis", () => ({
      google: {
        youtube: vi.fn().mockImplementation(() => mockYoutubeClient),
      },
    }));
    youtubeService = createYoutubeService("dummy_api_key");
    vi.clearAllMocks();
  });

  describe("getStreams", () => {
    const testCases: TestCase<{ streamIds: string[] }>[] = [
      {
        name: "should fetch videos by IDs successfully",
        streamIds: ["archive_video_id"],
        mockResponses: [mockYoutubeResponses.validStreams],
        expectedResult: {
          rawId: "archive_video_id",
          rawChannelID: "channel_id_1",
          title: "Archived Stream",
          description: "This is an archived stream",
          platform: "youtube",
          status: "ended",
          viewCount: 10000,
          tags: ["gaming", "archive"],
          languageCode: "default",
          platformIconURL:
            "https://raw.githubusercontent.com/sugar-cat7/vspo-portal/main/service/server/assets/icon/youtube.png",
          link: "https://www.youtube.com/watch?v=archive_video_id",
          statusColor: 255, // Blue for ended
          startedAt: "2024-01-01T00:00:00Z",
          endedAt: "2024-01-01T02:00:00Z",
        },
      },
      {
        name: "should handle API error",
        streamIds: ["invalid_id"],
        mockResponses: [mockYoutubeResponses.invalidRequest],
        expectedError: "Network error while fetching videos",
      },
      {
        name: "should handle network error",
        streamIds: ["error"],
        mockResponses: [mockYoutubeResponses.networkError],
        expectedError: "Network error",
      },
    ];

    it.concurrent.each(testCases)(
      "$name",
      async ({ streamIds, expectedError, expectedResult }) => {
        const result = await youtubeService.getStreams({
          streamIds: streamIds,
        });

        if (expectedError) {
          expect(result.err).toBeDefined();
          expect(result.err?.message).toContain(expectedError);
          return;
        }

        expect(result.err).toBeUndefined();
        if (result.err || !expectedResult) return;

        const videos = result.val;
        expect(videos).toHaveLength(1);
        const video = videos[0];
        expect(video).toMatchObject(expectedResult);
      },
    );
  });

  describe("searchStreams", () => {
    const testCases: TestCase<{
      query: typeof query.VSPO_JP;
      eventType: QueryEventType;
    }>[] = [
      {
        name: "should search live videos successfully",
        query: query.VSPO_JP,
        eventType: "live",
        mockResponses: [mockYoutubeResponses.validSearchResults],
        expectedResult: {
          rawId: "live_video_id",
          status: "live",
          title: "🔴 Live Gaming Stream",
          platform: "youtube",
          languageCode: "default",
          statusColor: 16711680, // Red for live
          link: "https://www.youtube.com/watch?v=live_video_id",
        },
      },
      {
        name: "should handle API error",
        query: "invalid" as typeof query.VSPO_JP,
        eventType: "live",
        mockResponses: [mockYoutubeResponses.invalidRequest],
        expectedError: "Network error while searching videos",
      },
    ];

    it.concurrent.each(testCases)(
      "$name",
      async ({ query, eventType, expectedError, expectedResult }) => {
        const result = await youtubeService.searchStreams({ query, eventType });

        if (expectedError) {
          expect(result.err).toBeDefined();
          expect(result.err?.message).toContain(expectedError);
          return;
        }

        expect(result.err).toBeUndefined();
        if (result.err || !expectedResult) return;

        const videos = result.val;
        expect(videos).toHaveLength(1);
        const video = videos[0];
        expect(video).toMatchObject(expectedResult);
      },
    );
  });

  describe("getChannels", () => {
    const testCases: TestCase<{ channelIds: string[] }>[] = [
      {
        name: "should fetch channels by IDs successfully",
        channelIds: ["channel_id_1"],
        mockResponses: [mockYoutubeResponses.validChannels],
        expectedResult: {
          id: "channel_id_1",
          creatorID: "",
          youtube: {
            rawId: "channel_id_1",
            name: "Gaming Channel",
            description: "Main gaming channel",
            thumbnailURL: expect.stringContaining("example.com"),
            publishedAt: "2023-01-01T00:00:00Z",
            subscriberCount: 0,
          },
          twitch: null,
          twitCasting: null,
          niconico: null,
        } as Channel,
      },
      {
        name: "should handle API error",
        channelIds: ["invalid_id"],
        mockResponses: [mockYoutubeResponses.invalidRequest],
        expectedError: "Network error while fetching channels",
      },
    ];

    it.concurrent.each(testCases)(
      "$name",
      async ({ channelIds, expectedError, expectedResult }) => {
        const result = await youtubeService.getChannels({ channelIds });

        if (expectedError) {
          expect(result.err).toBeDefined();
          expect(result.err?.message).toContain(expectedError);
          return;
        }

        expect(result.err).toBeUndefined();
        if (result.err || !expectedResult) return;

        const channels = result.val;
        expect(channels).toHaveLength(1);
        const channel = channels[0];
        expect(channel).toMatchObject(expectedResult);
      },
    );
  });
});
