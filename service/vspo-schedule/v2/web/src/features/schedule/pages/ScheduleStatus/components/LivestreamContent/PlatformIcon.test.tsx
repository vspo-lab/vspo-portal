import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformIcon } from "./PlatformIcon";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (_props: { icon: unknown }) => (
    <span data-testid="fa-icon" />
  ),
}));

vi.mock("@fortawesome/free-brands-svg-icons", () => ({
  faTwitch: { iconName: "twitch" },
}));

describe("PlatformIcon", () => {
  it.each([
    {
      platform: "youtube" as const,
      expected: { alt: "Youtube Icon" },
    },
    {
      platform: "twitcasting" as const,
      expected: { alt: "Twitcasting" },
    },
    {
      platform: "niconico" as const,
      expected: { alt: "niconico" },
    },
  ])("renders image for $platform", ({ platform, expected }) => {
    render(<PlatformIcon platform={platform} />);
    expect(screen.getByAltText(expected.alt)).toBeInTheDocument();
  });

  it("renders FontAwesome icon for twitch", () => {
    render(<PlatformIcon platform="twitch" />);
    expect(screen.getByTestId("fa-icon")).toBeInTheDocument();
  });

  it("renders empty fragment for unknown platform", () => {
    const { container } = render(<PlatformIcon platform="unknown" />);
    expect(container.innerHTML).toBe("");
  });
});
