import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeModeProvider } from "@/context/Theme";
import type { Livestream } from "@/features/shared/domain/livestream";
import { LivestreamContentPresenter } from "./presenter";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

const mockPush = vi.fn();
let mockQuery: Record<string, string> = { date: "2024-01-15" };

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: mockQuery,
    push: mockPush,
    pathname: "/schedule/all",
    events: { on: vi.fn(), off: vi.fn() },
  }),
}));

vi.mock("./LivestreamCard", () => ({
  LivestreamCard: ({ livestream }: { livestream: Livestream }) => (
    <div data-testid="livestream-card">{livestream.title}</div>
  ),
}));

vi.mock("@/lib/utils", () => ({
  formatDate: (date: string, _fmt: string) => {
    // Return a recognizable formatted date
    const d = new Date(date);
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${month}/${day} (Mon)`;
  },
}));

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

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeModeProvider>{ui}</ThemeModeProvider>);

describe("LivestreamContentPresenter", () => {
  beforeEach(() => {
    mockQuery = { date: "2024-01-15" };
    mockPush.mockClear();
  });

  it("shows noLivestreams message when empty", () => {
    renderWithTheme(
      <LivestreamContentPresenter
        livestreamsByDate={{}}
        timeZone="Asia/Tokyo"
      />,
    );
    expect(screen.getByText("noLivestreams")).toBeInTheDocument();
  });

  it("shows navigation buttons when empty", () => {
    renderWithTheme(
      <LivestreamContentPresenter livestreamsByDate={{}} timeZone="UTC" />,
    );
    expect(screen.getByText("navigation.previousDay")).toBeInTheDocument();
    expect(screen.getByText("navigation.nextDay")).toBeInTheDocument();
  });

  it("shows time block headers and livestream cards when streams exist", () => {
    const livestreamsByDate = {
      "2024-01-15": [
        makeLivestream({
          id: "ls-1",
          scheduledStartTime: "2024-01-15T10:00:00Z",
        }),
      ],
    };
    renderWithTheme(
      <LivestreamContentPresenter
        livestreamsByDate={livestreamsByDate}
        timeZone="UTC"
      />,
    );
    // The stream at 10:00 UTC should fall in 06:00 - 12:00 block
    expect(screen.getByText("06:00 - 12:00")).toBeInTheDocument();
    expect(screen.getByTestId("livestream-card")).toBeInTheDocument();
  });

  it("shows date navigation for each date when streams exist", () => {
    const livestreamsByDate = {
      "2024-01-15": [makeLivestream()],
    };
    renderWithTheme(
      <LivestreamContentPresenter
        livestreamsByDate={livestreamsByDate}
        timeZone="UTC"
      />,
    );
    expect(screen.getByText("navigation.previousDay")).toBeInTheDocument();
    expect(screen.getByText("navigation.nextDay")).toBeInTheDocument();
  });

  it("navigates to previous day when clicking previous button in empty state", () => {
    renderWithTheme(
      <LivestreamContentPresenter livestreamsByDate={{}} timeZone="UTC" />,
    );
    fireEvent.click(screen.getByText("navigation.previousDay"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          date: expect.any(String),
        }),
      }),
      undefined,
      { shallow: false },
    );
  });

  it("navigates to next day when clicking next button in empty state", () => {
    renderWithTheme(
      <LivestreamContentPresenter livestreamsByDate={{}} timeZone="UTC" />,
    );
    fireEvent.click(screen.getByText("navigation.nextDay"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          date: expect.any(String),
        }),
      }),
      undefined,
      { shallow: false },
    );
  });

  it("navigates to previous day when clicking nav button on date with streams", () => {
    const livestreamsByDate = {
      "2024-01-15": [makeLivestream()],
    };
    renderWithTheme(
      <LivestreamContentPresenter
        livestreamsByDate={livestreamsByDate}
        timeZone="UTC"
      />,
    );
    fireEvent.click(screen.getByText("navigation.previousDay"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          date: expect.any(String),
        }),
      }),
      undefined,
      { shallow: false },
    );
  });

  it("navigates to next day when clicking nav button on date with streams", () => {
    const livestreamsByDate = {
      "2024-01-15": [makeLivestream()],
    };
    renderWithTheme(
      <LivestreamContentPresenter
        livestreamsByDate={livestreamsByDate}
        timeZone="UTC"
      />,
    );
    fireEvent.click(screen.getByText("navigation.nextDay"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          date: expect.any(String),
        }),
      }),
      undefined,
      { shallow: false },
    );
  });

  it("renders multiple dates with their own time blocks", () => {
    const livestreamsByDate = {
      "2024-01-15": [
        makeLivestream({
          id: "ls-1",
          title: "Stream Day 1",
          scheduledStartTime: "2024-01-15T10:00:00Z",
        }),
      ],
      "2024-01-16": [
        makeLivestream({
          id: "ls-2",
          title: "Stream Day 2",
          scheduledStartTime: "2024-01-16T20:00:00Z",
        }),
      ],
    };
    renderWithTheme(
      <LivestreamContentPresenter
        livestreamsByDate={livestreamsByDate}
        timeZone="UTC"
      />,
    );
    expect(screen.getByText("Stream Day 1")).toBeInTheDocument();
    expect(screen.getByText("Stream Day 2")).toBeInTheDocument();
    // Both dates should have nav buttons (4 buttons total: 2 per date)
    expect(screen.getAllByText("navigation.previousDay")).toHaveLength(2);
    expect(screen.getAllByText("navigation.nextDay")).toHaveLength(2);
  });

  it("uses current date when no date query param is set", () => {
    mockQuery = {};
    renderWithTheme(
      <LivestreamContentPresenter livestreamsByDate={{}} timeZone="UTC" />,
    );
    // Should still render without crashing
    expect(screen.getByText("noLivestreams")).toBeInTheDocument();
  });
});
