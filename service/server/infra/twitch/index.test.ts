import { beforeEach, describe, expect, it } from "vitest";
import { mockTwitchResponses, type TestCase } from "../../test/mock/twitch";
import { createTwitchService, type ITwitchService } from "./index";

const mockConfig = {
  clientId: "dummy_client_id",
  clientSecret: "dummy_client_secret",
};

describe("TwitchService", () => {
  let twitchService: ITwitchService;

  beforeEach(() => {
    twitchService = createTwitchService(mockConfig);
  });

  describe("getStreams", () => {
    const testCases: TestCase<{ userIds: string[] }>[] = [
      {
        name: "should fetch streams successfully",
        userIds: ["user_id_1"],
        mockResponses: [
          mockTwitchResponses.validToken,
          mockTwitchResponses.validStreams,
        ],
        expectedResult: {
          rawId: "stream_id_1",
          rawChannelID: "user_id_1",
          title: "🔴 Live Gaming Stream",
          platform: "twitch",
          status: "live",
          viewCount: 1000,
          tags: ["gaming", "live"],
          languageCode: "default",
          platformIconURL:
            "https://raw.githubusercontent.com/sugar-cat7/vspo-portal/main/service/server/assets/icon/twitch.png",
          link: "https://www.twitch.tv/streamer1",
          statusColor: 16711680, // Red for live
          startedAt: "2024-01-01T00:00:00Z",
          endedAt: null,
        },
      },
      {
        name: "should handle API error - invalid token",
        userIds: ["invalid"],
        mockResponses: [mockTwitchResponses.invalidToken],
        expectedError: "Twitch API error: invalid_client",
      },
      {
        name: "should handle network error",
        userIds: ["error"],
        mockResponses: [mockTwitchResponses.networkError],
        expectedError: "Network error",
      },
    ];

    it.concurrent.each(testCases)(
      "$name",
      async ({ userIds, expectedError, expectedResult }) => {
        const result = await twitchService.getStreams({ userIds });

        if (expectedError) {
          expect(result.err).toBeDefined();
          expect(result.err?.message).toContain(expectedError);
          return;
        }

        expect(result.err).toBeUndefined();
        if (result.err || !expectedResult) return;

        const streams = result.val;
        expect(streams).toHaveLength(1);
        const stream = streams[0];
        expect(stream).toMatchObject(expectedResult);
      },
    );
  });

  describe("getStreamsByIDs", () => {
    const testCases: TestCase<{ streamIds: string[] }>[] = [
      {
        name: "should fetch videos by IDs successfully",
        streamIds: ["video_id_1"],
        mockResponses: [
          mockTwitchResponses.validToken,
          mockTwitchResponses.validStreams,
        ],
        expectedResult: {
          rawId: "video_id_1",
          rawChannelID: "user_id_1",
          title: "Past Stream",
          description: "This was a great stream",
          platform: "twitch",
          status: "ended",
          viewCount: 0,
          tags: [],
          languageCode: "default",
          platformIconURL:
            "https://raw.githubusercontent.com/sugar-cat7/vspo-portal/main/service/server/assets/icon/twitch.png",
          link: "https://www.twitch.tv/videos/video_id_1",
          statusColor: 255, // Blue for ended
          startedAt: "2024-01-01T00:00:00Z",
          endedAt: null,
        },
      },
      {
        name: "should handle API error - invalid token",
        streamIds: ["invalid"],
        mockResponses: [mockTwitchResponses.invalidToken],
        expectedError: "Twitch API error: invalid_client",
      },
      {
        name: "should handle network error",
        streamIds: ["error"],
        mockResponses: [mockTwitchResponses.networkError],
        expectedError: "Network error",
      },
    ];

    it.concurrent.each(testCases)(
      "$name",
      async ({ streamIds, expectedError, expectedResult }) => {
        const result = await twitchService.getStreamsByIDs({ streamIds });

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
});
