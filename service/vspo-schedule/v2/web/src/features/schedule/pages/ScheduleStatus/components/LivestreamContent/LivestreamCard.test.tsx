import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Livestream } from "@/features/shared/domain/livestream";
import { ThemeModeProvider } from "@/context/Theme";
import { LivestreamCard } from "./LivestreamCard";

vi.mock("@/features/shared/components/Elements/Card/VideoCard", () => ({
  VideoCard: ({
    children,
  }: {
    children: React.ReactNode;
    video: unknown;
    highlight?: unknown;
    priority?: boolean;
  }) => <div data-testid="video-card">{children}</div>,
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: {},
    push: vi.fn(),
    pathname: "/schedule/all",
    events: { on: vi.fn(), off: vi.fn() },
  }),
}));

vi.mock("@/lib/utils", () => ({
  formatDate: (_date: unknown, _fmt: string) => "19:00",
}));

const makeLivestream = (
  overrides: Partial<Livestream> = {},
): Livestream => ({
  id: "ls-1",
  type: "livestream",
  title: "Test Stream Title",
  description: "",
  platform: "youtube",
  thumbnailUrl: "https://example.com/thumb.jpg",
  viewCount: 100,
  channelId: "ch-1",
  channelTitle: "Test Channel Name",
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

describe("LivestreamCard", () => {
  it("renders title, channel name, and formatted time", () => {
    renderWithTheme(
      <LivestreamCard
        livestream={makeLivestream()}
        isFreechat={false}
        timeZone="Asia/Tokyo"
      />,
    );
    expect(screen.getByText("Test Stream Title")).toBeInTheDocument();
    expect(screen.getByText("Test Channel Name")).toBeInTheDocument();
    expect(screen.getByText("19:00~")).toBeInTheDocument();
  });

  it("wraps content in VideoCard", () => {
    renderWithTheme(
      <LivestreamCard
        livestream={makeLivestream()}
        isFreechat={false}
        timeZone="Asia/Tokyo"
      />,
    );
    expect(screen.getByTestId("video-card")).toBeInTheDocument();
  });

  it("does not show time for freechat cards", () => {
    renderWithTheme(
      <LivestreamCard livestream={makeLivestream()} isFreechat={true} />,
    );
    expect(screen.queryByText("19:00~")).not.toBeInTheDocument();
  });
});
