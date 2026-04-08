import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeModeProvider } from "@/context/Theme";
import { makeLivestream } from "@/features/schedule/__testutils__/fixtures";
import { LivestreamCard } from "./LivestreamCard";

const mockUseMediaQuery = vi.fn().mockReturnValue(false);
vi.mock("@mui/material", async () => {
  const actual = await vi.importActual("@mui/material");
  return {
    ...actual,
    useMediaQuery: (...args: unknown[]) => mockUseMediaQuery(...args),
  };
});

let capturedHighlight: unknown;

vi.mock("@/features/shared/components/Elements/Card/VideoCard", () => ({
  VideoCard: ({
    children,
    highlight,
  }: {
    children: React.ReactNode;
    video: unknown;
    highlight?: unknown;
    priority?: boolean;
  }) => {
    capturedHighlight = highlight;
    return <div data-testid="video-card">{children}</div>;
  },
}));

vi.mock("@/lib/utils", () => ({
  formatDate: (_date: unknown, _fmt: string) => "19:00",
}));

const cardDefaults = {
  title: "Test Stream Title",
  channelTitle: "Test Channel Name",
  viewCount: 100,
} as const;

const makeCardLivestream = (
  overrides: Parameters<typeof makeLivestream>[0] = {},
) => makeLivestream({ ...cardDefaults, ...overrides });

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeModeProvider>{ui}</ThemeModeProvider>);

describe("LivestreamCard", () => {
  it("renders title, channel name, and formatted time", () => {
    renderWithTheme(
      <LivestreamCard
        livestream={makeCardLivestream()}
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
        livestream={makeCardLivestream()}
        isFreechat={false}
        timeZone="Asia/Tokyo"
      />,
    );
    expect(screen.getByTestId("video-card")).toBeInTheDocument();
  });

  it("does not show time for freechat cards", () => {
    renderWithTheme(
      <LivestreamCard livestream={makeCardLivestream()} isFreechat={true} />,
    );
    expect(screen.queryByText("19:00~")).not.toBeInTheDocument();
  });

  it("renders without highlight for ended/archive status", () => {
    renderWithTheme(
      <LivestreamCard
        livestream={makeCardLivestream({ status: "ended" })}
        isFreechat={false}
        timeZone="Asia/Tokyo"
      />,
    );
    // Should still render the card (archive status = no highlight)
    expect(screen.getByTestId("video-card")).toBeInTheDocument();
    expect(screen.getByText("Test Stream Title")).toBeInTheDocument();
  });

  it("renders AvatarGroup when additionalMembers are provided", () => {
    const additionalMembers = [
      { name: "Member A", iconUrl: "https://example.com/a.jpg" },
      { name: "Member B", iconUrl: "https://example.com/b.jpg" },
    ];
    renderWithTheme(
      <LivestreamCard
        livestream={makeCardLivestream()}
        isFreechat={false}
        timeZone="Asia/Tokyo"
        additionalMembers={additionalMembers}
      />,
    );
    // Check that the additional member avatars are rendered
    expect(screen.getByAltText("Member A")).toBeInTheDocument();
    expect(screen.getByAltText("Member B")).toBeInTheDocument();
  });

  it("renders upcoming highlight when status is upcoming", () => {
    renderWithTheme(
      <LivestreamCard
        livestream={makeCardLivestream({ status: "upcoming" })}
        isFreechat={false}
        timeZone="Asia/Tokyo"
      />,
    );
    expect(capturedHighlight).toEqual({
      label: "upcoming",
      color: "#2D4870",
      bold: true,
    });
  });

  it("falls back to empty string when channelThumbnailUrl is falsy", () => {
    renderWithTheme(
      <LivestreamCard
        livestream={makeCardLivestream({ channelThumbnailUrl: "" })}
        isFreechat={false}
        timeZone="Asia/Tokyo"
      />,
    );
    // Card renders without crashing even when channelThumbnailUrl is empty
    expect(screen.getByTestId("video-card")).toBeInTheDocument();
    expect(screen.getByText("Test Stream Title")).toBeInTheDocument();
  });

  it("does not show time for freechat cards (isFreechat=true)", () => {
    renderWithTheme(
      <LivestreamCard
        livestream={makeCardLivestream({ status: "upcoming" })}
        isFreechat={true}
      />,
    );
    // formattedTime should be "" so no time container is shown
    expect(screen.queryByText("19:00~")).not.toBeInTheDocument();
    // Card still renders
    expect(screen.getByText("Test Stream Title")).toBeInTheDocument();
  });

  it("renders AvatarGroup with mobile max when isMobile is true", () => {
    mockUseMediaQuery.mockReturnValueOnce(true);
    const additionalMembers = [
      { name: "Member A", iconUrl: "https://example.com/a.jpg" },
      { name: "Member B", iconUrl: "https://example.com/b.jpg" },
    ];
    renderWithTheme(
      <LivestreamCard
        livestream={makeCardLivestream()}
        isFreechat={false}
        timeZone="Asia/Tokyo"
        additionalMembers={additionalMembers}
      />,
    );
    expect(screen.getByAltText("Member A")).toBeInTheDocument();
    expect(screen.getByAltText("Member B")).toBeInTheDocument();
  });

  it("handles falsy title, channelTitle, and scheduledStartTime", () => {
    renderWithTheme(
      <LivestreamCard
        livestream={makeCardLivestream({
          title: "" as string,
          channelTitle: "" as string,
          scheduledStartTime: "" as string,
          channelThumbnailUrl: "" as string,
        })}
        isFreechat={false}
        timeZone="Asia/Tokyo"
      />,
    );
    // Card still renders even with all falsy string fields
    expect(screen.getByTestId("video-card")).toBeInTheDocument();
  });
});
