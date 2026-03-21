import { describe, expect, it } from "vitest";
import type { Livestream } from "@/features/shared/domain/livestream";
import { groupLivestreamsByTimeBlock } from "./index";

const makeLivestream = (overrides: Partial<Livestream> = {}): Livestream => ({
  id: "ls-1",
  type: "livestream",
  title: "Test Stream",
  description: "",
  platform: "youtube",
  thumbnailUrl: "https://example.com/thumb.jpg",
  viewCount: 0,
  channelId: "ch-1",
  channelTitle: "Test Channel",
  channelThumbnailUrl: "https://example.com/icon.jpg",
  link: "https://example.com",
  tags: [],
  status: "live",
  scheduledStartTime: "2024-01-15T10:00:00Z",
  scheduledEndTime: null,
  ...overrides,
});

describe("groupLivestreamsByTimeBlock", () => {
  it("returns empty object for empty input", () => {
    const result = groupLivestreamsByTimeBlock({}, "Asia/Tokyo");
    expect(result).toEqual({});
  });

  it.each([
    {
      name: "morning block (06:00-12:00) in Asia/Tokyo",
      scheduledStartTime: "2024-01-15T00:00:00Z", // 09:00 JST
      timeZone: "Asia/Tokyo",
      expectedBlock: "06:00 - 12:00",
    },
    {
      name: "afternoon block (12:00-18:00) in Asia/Tokyo",
      scheduledStartTime: "2024-01-15T06:00:00Z", // 15:00 JST
      timeZone: "Asia/Tokyo",
      expectedBlock: "12:00 - 18:00",
    },
    {
      name: "evening block (18:00-00:00) in UTC",
      scheduledStartTime: "2024-01-15T20:00:00Z", // 20:00 UTC
      timeZone: "UTC",
      expectedBlock: "18:00 - 00:00",
    },
    {
      name: "early morning block (00:00-06:00) in UTC",
      scheduledStartTime: "2024-01-15T03:00:00Z", // 03:00 UTC
      timeZone: "UTC",
      expectedBlock: "00:00 - 06:00",
    },
  ])(
    "groups stream into $name",
    ({ scheduledStartTime, timeZone, expectedBlock }) => {
      const input = {
        "2024-01-15": [makeLivestream({ scheduledStartTime })],
      };
      const result = groupLivestreamsByTimeBlock(input, timeZone);
      expect(result["2024-01-15"]).toBeDefined();
      expect(Object.keys(result["2024-01-15"])).toContain(expectedBlock);
      expect(result["2024-01-15"][expectedBlock]).toHaveLength(1);
    },
  );

  it("skips streams without scheduledStartTime", () => {
    const input = {
      "2024-01-15": [makeLivestream({ scheduledStartTime: "" })],
    };
    const result = groupLivestreamsByTimeBlock(input, "UTC");
    // Date should be removed because no time blocks have streams
    expect(result["2024-01-15"]).toBeUndefined();
  });

  it("removes dates with no time blocks containing streams", () => {
    const input = {
      "2024-01-15": [makeLivestream({ scheduledStartTime: "" })],
      "2024-01-16": [
        makeLivestream({
          id: "ls-2",
          scheduledStartTime: "2024-01-16T10:00:00Z",
        }),
      ],
    };
    const result = groupLivestreamsByTimeBlock(input, "UTC");
    expect(result["2024-01-15"]).toBeUndefined();
    expect(result["2024-01-16"]).toBeDefined();
  });

  it("groups multiple streams into the same time block", () => {
    const input = {
      "2024-01-15": [
        makeLivestream({
          id: "ls-1",
          scheduledStartTime: "2024-01-15T10:00:00Z",
        }),
        makeLivestream({
          id: "ls-2",
          scheduledStartTime: "2024-01-15T11:30:00Z",
        }),
      ],
    };
    const result = groupLivestreamsByTimeBlock(input, "UTC");
    expect(result["2024-01-15"]["06:00 - 12:00"]).toHaveLength(2);
  });
});
