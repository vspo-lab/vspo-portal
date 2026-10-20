import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchLivestreams } from "./livestream";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  restList: vi.fn(),
  context: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/cloudflare/context", () => ({
  getCloudflareEnvironmentContext: mocks.context,
}));
vi.mock("@vspo-lab/api", () => ({
  VSPOApi: class {
    streams = { list: mocks.restList };
  },
}));

const video = {
  rawId: "video-1",
  rawChannelID: "UC_test",
  title: "Live",
  description: "description",
  platform: "youtube",
  thumbnailURL: "https://example.com/video.jpg",
  viewCount: 42,
  status: "live",
  startedAt: "2026-10-20T00:00:00Z",
  endedAt: null,
  creatorName: "Member",
  creatorThumbnailURL: "https://example.com/member.jpg",
  link: "https://example.com/watch",
  tags: ["game"],
};
const response = {
  val: {
    streams: [video, { ...video, rawId: "no-start", startedAt: null }],
    pagination: { totalCount: 0 },
  },
};
const base = {
  limit: 50,
  lang: "ja",
  status: "live" as const,
  order: "asc" as const,
  timezone: "Asia/Tokyo",
};

describe("fetchLivestreams", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.context.mockResolvedValue({
      cfEnv: { APP_WORKER: { newStreamUsecase: () => ({ list: mocks.list }) } },
    });
    mocks.list.mockResolvedValue(response);
    mocks.restList.mockResolvedValue(response);
  });

  it("skips the RPC count and preserves displayed video fields and null-start filtering", async () => {
    const result = await fetchLivestreams({
      ...base,
      memberType: "vspo_jp",
      platform: "youtube",
    });
    expect(result.err).toBeFalsy();
    expect(mocks.list).toHaveBeenCalledWith({
      limit: 50,
      page: 0,
      status: "live",
      orderBy: "asc",
      languageCode: "default",
      memberType: "vspo_jp",
      platform: "youtube",
      skipCount: true,
    });
    expect(result.val?.livestreams).toEqual([
      {
        id: video.rawId,
        type: "livestream",
        title: video.title,
        description: video.description,
        platform: video.platform,
        thumbnailUrl: video.thumbnailURL,
        viewCount: video.viewCount,
        status: video.status,
        scheduledStartTime: video.startedAt,
        scheduledEndTime: null,
        channelId: video.rawChannelID,
        channelTitle: video.creatorName,
        channelThumbnailUrl: video.creatorThumbnailURL,
        link: video.link,
        videoPlayerLink: "",
        chatPlayerLink: "",
        tags: video.tags,
      },
    ]);
  });

  it.each([
    { status: "all" as const, end: "2026-10-20T14:59:59.000Z" },
    { status: "upcoming" as const, end: "2026-10-21T14:59:59.000Z" },
  ])("preserves timezone boundaries for $status", async ({ status, end }) => {
    await fetchLivestreams({
      ...base,
      status,
      startedDate: "2026-10-20",
      lang: "en",
    });
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({
        skipCount: true,
        languageCode: "en",
        startDateFrom: new Date("2026-10-19T15:00:00Z"),
        startDateTo: new Date(end),
      }),
    );
  });

  it("preserves the archive window", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T03:00:00Z"));
    const result = await fetchLivestreams({
      ...base,
      status: "archive",
      order: "desc",
      limit: 300,
    });
    vi.useRealTimers();
    expect(result.err).toBeFalsy();
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ended",
        orderBy: "desc",
        limit: 300,
        skipCount: true,
        startDateFrom: new Date("2026-09-21T03:00:00Z"),
      }),
    );
  });

  it("keeps the REST fallback compatible with the public API", async () => {
    mocks.context.mockResolvedValue({ cfEnv: undefined });
    const result = await fetchLivestreams(base);
    expect(result.err).toBeFalsy();
    expect(result.val?.livestreams.map((stream) => stream.id)).toEqual([
      "video-1",
    ]);
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.restList).toHaveBeenCalledWith({
      limit: "50",
      page: "0",
      status: "live",
      orderBy: "asc",
      languageCode: "default",
      memberType: "vspo_all",
    });
  });

  it("preserves RPC errors as a Result error", async () => {
    mocks.list.mockResolvedValue({ err: new Error("RPC failed") });
    const result = await fetchLivestreams(base);
    expect(result.err?.message).toBe("Failed to fetch livestreams");
    expect(result.val).toBeUndefined();
  });
});
