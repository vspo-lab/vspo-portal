import { renderHook } from "@testing-library/react";
import type { Livestream } from "../../shared/domain/livestream";
import { useGroupedLivestreams } from "./useGroupedLivestreams";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) =>
      opts?.date ? `すべて (${opts.date}~)` : key,
  }),
}));

vi.mock("@/lib/utils", () => ({
  formatDate: (
    date: string | Date | number,
    fmt: string,
    _opts?: Record<string, string>,
  ) => {
    const dateStr = typeof date === "string" ? date : String(date);
    if (fmt === "yyyy-MM-dd") return dateStr.slice(0, 10);
    if (fmt === "M/d") {
      // Extract month/day from yyyy-MM-dd
      const parts = dateStr.slice(0, 10).split("-");
      return `${Number(parts[1])}/${Number(parts[2])}`;
    }
    return dateStr;
  },
  groupBy: <T>(items: T[], keyGetter: (item: T) => string) => {
    const result: Record<string, T[]> = {};
    for (const item of items) {
      const key = keyGetter(item);
      if (!result[key]) result[key] = [];
      result[key].push(item);
    }
    return result;
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let nextId = 0;

const makeLivestream = (
  overrides: Partial<Livestream> & { scheduledStartTime: string },
): Livestream => ({
  id: `id-${nextId++}`,
  type: "livestream",
  title: "Test Stream",
  description: "",
  platform: "youtube",
  thumbnailUrl: "https://example.com/thumb.jpg",
  viewCount: 0,
  channelId: "ch1",
  channelTitle: "Channel",
  channelThumbnailUrl: "https://example.com/ch.jpg",
  link: "https://example.com",
  tags: [],
  status: "upcoming",
  scheduledEndTime: null,
  ...overrides,
});

const defaultParams = {
  timeZone: "Asia/Tokyo",
  locale: "ja",
  currentStatusFilter: "all" as const,
  liveStatus: "all",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useGroupedLivestreams", () => {
  it("returns empty result when livestreams is empty", () => {
    const { result } = renderHook(() =>
      useGroupedLivestreams({ ...defaultParams, livestreams: [] }),
    );

    expect(result.current.livestreamsByDate).toEqual({});
    expect(result.current.firstDate).toBeNull();
    expect(result.current.formattedDate).toBe("");
  });

  it("groups streams by scheduledStartTime date", () => {
    const streams = [
      makeLivestream({ scheduledStartTime: "2024-01-15T10:00:00Z" }),
      makeLivestream({ scheduledStartTime: "2024-01-15T14:00:00Z" }),
      makeLivestream({ scheduledStartTime: "2024-01-16T10:00:00Z" }),
    ];

    const { result } = renderHook(() =>
      useGroupedLivestreams({ ...defaultParams, livestreams: streams }),
    );

    const dates = Object.keys(result.current.livestreamsByDate);
    expect(dates).toHaveLength(2);
    expect(result.current.livestreamsByDate["2024-01-15"]).toHaveLength(2);
    expect(result.current.livestreamsByDate["2024-01-16"]).toHaveLength(1);
  });

  it.each([
    {
      filter: "live" as const,
      statuses: ["live", "upcoming", "live"] as const,
      expectedCount: 2,
      label: "live",
    },
    {
      filter: "upcoming" as const,
      statuses: ["live", "upcoming", "upcoming"] as const,
      expectedCount: 2,
      label: "upcoming",
    },
  ])('filters $label streams when currentStatusFilter="$filter"', ({
    filter,
    statuses,
    expectedCount,
  }) => {
    const streams = statuses.map((status, i) =>
      makeLivestream({
        scheduledStartTime: "2024-01-15T10:00:00Z",
        status,
        id: `stream-${i}`,
      }),
    );

    const { result } = renderHook(() =>
      useGroupedLivestreams({
        ...defaultParams,
        livestreams: streams,
        currentStatusFilter: filter,
      }),
    );

    const allStreams = Object.values(result.current.livestreamsByDate).flat();
    expect(allStreams).toHaveLength(expectedCount);
    for (const s of allStreams) {
      expect(s.status).toBe(filter);
    }
  });

  it("removes date groups that become empty after filtering", () => {
    const streams = [
      makeLivestream({
        scheduledStartTime: "2024-01-15T10:00:00Z",
        status: "live",
      }),
      makeLivestream({
        scheduledStartTime: "2024-01-16T10:00:00Z",
        status: "upcoming",
      }),
    ];

    const { result } = renderHook(() =>
      useGroupedLivestreams({
        ...defaultParams,
        livestreams: streams,
        currentStatusFilter: "live",
      }),
    );

    expect(Object.keys(result.current.livestreamsByDate)).toEqual([
      "2024-01-15",
    ]);
  });

  it('generates allTabLabel with formatted date when liveStatus="all"', () => {
    const streams = [
      makeLivestream({ scheduledStartTime: "2024-01-15T10:00:00Z" }),
    ];

    const { result } = renderHook(() =>
      useGroupedLivestreams({
        ...defaultParams,
        livestreams: streams,
        liveStatus: "all",
        currentStatusFilter: "all",
      }),
    );

    // The mock t returns "すべて (1/15~)" when opts.date is provided
    expect(result.current.allTabLabel).toContain("1/15");
  });

  it('returns tabs.all label when liveStatus is not "all"', () => {
    const streams = [
      makeLivestream({ scheduledStartTime: "2024-01-15T10:00:00Z" }),
    ];

    const { result } = renderHook(() =>
      useGroupedLivestreams({
        ...defaultParams,
        livestreams: streams,
        liveStatus: "upcoming",
        currentStatusFilter: "all",
      }),
    );

    expect(result.current.allTabLabel).toBe("tabs.all");
  });

  it("archive mode reverses date order for all filter", () => {
    const streams = [
      makeLivestream({
        scheduledStartTime: "2024-01-15T10:00:00Z",
        status: "live",
      }),
      makeLivestream({
        scheduledStartTime: "2024-01-17T10:00:00Z",
        status: "live",
      }),
      makeLivestream({
        scheduledStartTime: "2024-01-16T10:00:00Z",
        status: "live",
      }),
    ];

    const { result } = renderHook(() =>
      useGroupedLivestreams({
        ...defaultParams,
        livestreams: streams,
        liveStatus: "archive",
        currentStatusFilter: "all",
      }),
    );

    const dates = Object.keys(result.current.livestreamsByDate);
    expect(dates).toEqual(["2024-01-17", "2024-01-16", "2024-01-15"]);
  });

  it("archive mode reverses date order for filtered streams", () => {
    const streams = [
      makeLivestream({
        scheduledStartTime: "2024-01-15T10:00:00Z",
        status: "live",
      }),
      makeLivestream({
        scheduledStartTime: "2024-01-17T10:00:00Z",
        status: "live",
      }),
      makeLivestream({
        scheduledStartTime: "2024-01-16T10:00:00Z",
        status: "upcoming",
      }),
    ];

    const { result } = renderHook(() =>
      useGroupedLivestreams({
        ...defaultParams,
        livestreams: streams,
        liveStatus: "archive",
        currentStatusFilter: "live",
      }),
    );

    const dates = Object.keys(result.current.livestreamsByDate);
    expect(dates).toEqual(["2024-01-17", "2024-01-15"]);
  });

  it("sets firstDate to earliest date when currentStatusFilter is all", () => {
    const streams = [
      makeLivestream({ scheduledStartTime: "2024-01-17T10:00:00Z" }),
      makeLivestream({ scheduledStartTime: "2024-01-15T10:00:00Z" }),
    ];

    const { result } = renderHook(() =>
      useGroupedLivestreams({
        ...defaultParams,
        livestreams: streams,
        currentStatusFilter: "all",
      }),
    );

    expect(result.current.firstDate).toBe("2024-01-15");
    expect(result.current.formattedDate).toBe("1/15");
  });

  it("sets firstDate to null when currentStatusFilter is not all", () => {
    const streams = [
      makeLivestream({
        scheduledStartTime: "2024-01-15T10:00:00Z",
        status: "live",
      }),
    ];

    const { result } = renderHook(() =>
      useGroupedLivestreams({
        ...defaultParams,
        livestreams: streams,
        currentStatusFilter: "live",
      }),
    );

    expect(result.current.firstDate).toBeNull();
  });

  it("archive mode sorts streams within a date in ascending order (all filter)", () => {
    const streams = [
      makeLivestream({
        id: "late",
        scheduledStartTime: "2024-01-15T20:00:00Z",
        status: "live",
      }),
      makeLivestream({
        id: "early",
        scheduledStartTime: "2024-01-15T08:00:00Z",
        status: "live",
      }),
    ];

    const { result } = renderHook(() =>
      useGroupedLivestreams({
        ...defaultParams,
        livestreams: streams,
        liveStatus: "archive",
        currentStatusFilter: "all",
      }),
    );

    const dateStreams = result.current.livestreamsByDate["2024-01-15"];
    expect(dateStreams).toHaveLength(2);
    // Should be sorted ascending by scheduledStartTime
    expect(dateStreams[0].id).toBe("early");
    expect(dateStreams[1].id).toBe("late");
  });

  it("archive mode sorts filtered streams within a date in ascending order", () => {
    const streams = [
      makeLivestream({
        id: "late-live",
        scheduledStartTime: "2024-01-15T20:00:00Z",
        status: "live",
      }),
      makeLivestream({
        id: "early-live",
        scheduledStartTime: "2024-01-15T08:00:00Z",
        status: "live",
      }),
      makeLivestream({
        id: "upcoming",
        scheduledStartTime: "2024-01-15T12:00:00Z",
        status: "upcoming",
      }),
    ];

    const { result } = renderHook(() =>
      useGroupedLivestreams({
        ...defaultParams,
        livestreams: streams,
        liveStatus: "archive",
        currentStatusFilter: "live",
      }),
    );

    const dateStreams = result.current.livestreamsByDate["2024-01-15"];
    expect(dateStreams).toHaveLength(2);
    // Should be sorted ascending by scheduledStartTime, and upcoming filtered out
    expect(dateStreams[0].id).toBe("early-live");
    expect(dateStreams[1].id).toBe("late-live");
  });

  it("handles non-array livestreams gracefully", () => {
    const { result } = renderHook(() =>
      useGroupedLivestreams({
        ...defaultParams,
        // @ts-expect-error testing runtime safety
        livestreams: null,
      }),
    );

    expect(result.current.livestreamsByDate).toEqual({});
  });
});
