import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Livestream } from "@/features/shared/domain/livestream";
import { ThemeModeProvider } from "@/context/Theme";
import { LivestreamContentPresenter } from "./presenter";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: { date: "2024-01-15" },
    push: vi.fn(),
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

const makeLivestream = (
  overrides: Partial<Livestream> = {},
): Livestream => ({
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
      <LivestreamContentPresenter
        livestreamsByDate={{}}
        timeZone="UTC"
      />,
    );
    expect(screen.getByText("navigation.previousDay")).toBeInTheDocument();
    expect(screen.getByText("navigation.nextDay")).toBeInTheDocument();
  });

  it("shows time block headers and livestream cards when streams exist", () => {
    const livestreamsByDate = {
      "2024-01-15": [
        makeLivestream({ id: "ls-1", scheduledStartTime: "2024-01-15T10:00:00Z" }),
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
});
