import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeModeProvider } from "@/context/Theme";
import type { Video } from "@/features/shared/domain/video";
import { VideoCard } from "./VideoCard";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockPushVideo = vi.fn();
vi.mock("@/hooks", () => ({
  useVideoModalContext: () => ({ pushVideo: mockPushVideo }),
}));

const makeVideo = (overrides: Partial<Video> = {}): Video => ({
  id: "v-1",
  type: "livestream",
  title: "Test Stream",
  description: "",
  platform: "youtube",
  thumbnailUrl: "https://example.com/thumb.jpg",
  viewCount: 0,
  channelId: "ch-1",
  channelTitle: "Test Channel",
  channelThumbnailUrl: "https://example.com/icon.jpg",
  link: "https://www.youtube.com/watch?v=abc123",
  tags: [],
  ...overrides,
});

const renderCard = (video: Video) =>
  render(
    <ThemeModeProvider>
      <VideoCard video={video}>
        <div>card body</div>
      </VideoCard>
    </ThemeModeProvider>,
  );

const getWatchLink = (platform = "youtube") =>
  screen.getByRole("link", { name: `videoCard.watchOn.${platform}` });

describe("VideoCard", () => {
  it("renders a watch link pointing at the source platform in a new tab", () => {
    renderCard(makeVideo());

    const link = getWatchLink();
    expect(link).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=abc123",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("labels the watch link with the platform of the video", () => {
    renderCard(makeVideo({ platform: "twitch" }));

    expect(getWatchLink("twitch")).toBeInTheDocument();
  });

  it("shows the watch label on the button", () => {
    renderCard(makeVideo());

    expect(getWatchLink()).toHaveTextContent("videoCard.watch");
  });

  it("falls back to a generic label for an unknown platform", () => {
    renderCard(makeVideo({ platform: "unknown" }));

    expect(getWatchLink("unknown")).toBeInTheDocument();
  });

  it("does not open the detail modal when the watch link is clicked", () => {
    renderCard(makeVideo());

    fireEvent.click(getWatchLink());

    expect(mockPushVideo).not.toHaveBeenCalled();
  });

  it("opens the detail modal when the card body is clicked", () => {
    const video = makeVideo();
    renderCard(video);

    fireEvent.click(screen.getByText("card body"));

    expect(mockPushVideo).toHaveBeenCalledWith(video);
  });

  it.each([
    ["an empty link", ""],
    ["a javascript: link", "javascript:alert(1)"],
    ["a data: link", "data:text/html,<script>alert(1)</script>"],
    ["a scheme-relative link", "//www.youtube.com/watch?v=abc123"],
  ])("omits the watch link for %s", (_name, link) => {
    renderCard(makeVideo({ link }));

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
