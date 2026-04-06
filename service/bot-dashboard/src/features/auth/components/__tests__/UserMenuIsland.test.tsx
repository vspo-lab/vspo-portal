// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenuIsland } from "../UserMenuIsland";
import { $theme } from "~/features/shared/stores/theme";

const defaultProps = {
  displayName: "TestUser",
  avatarUrl: "https://cdn.discordapp.com/avatars/123/abc.png",
  translations: {
    language: "Language",
    theme: "Theme",
    logout: "Logout",
  },
  localeLabels: { ja: "日本語", en: "English" },
  currentLocale: "ja" as const,
  returnTo: "/dashboard",
};

describe("UserMenuIsland", () => {
  beforeEach(() => {
    $theme.set("light");
    document.documentElement.classList.remove("dark");
  });

  it("renders avatar and display name", () => {
    render(<UserMenuIsland {...defaultProps} />);
    expect(screen.getByAltText("TestUser")).toBeInTheDocument();
    expect(screen.getByText("TestUser")).toBeInTheDocument();
  });

  it("renders fallback initial when no avatar", () => {
    render(<UserMenuIsland {...defaultProps} avatarUrl={null} />);
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("opens dropdown on click", async () => {
    const user = userEvent.setup();
    render(<UserMenuIsland {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /TestUser/i }));
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("closes dropdown on second click", async () => {
    const user = userEvent.setup();
    render(<UserMenuIsland {...defaultProps} />);

    const trigger = screen.getByRole("button", { name: /TestUser/i });
    await user.click(trigger);
    expect(screen.getByText("Logout")).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  it("toggles theme when theme button is clicked", async () => {
    const user = userEvent.setup();
    render(<UserMenuIsland {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /TestUser/i }));
    await user.click(screen.getByText("Theme"));
    expect($theme.get()).toBe("dark");
  });

  it("renders locale buttons in dropdown", async () => {
    const user = userEvent.setup();
    render(<UserMenuIsland {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /TestUser/i }));
    expect(screen.getByText("日本語")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });
});
