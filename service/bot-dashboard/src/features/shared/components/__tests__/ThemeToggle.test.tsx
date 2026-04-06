// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "../ThemeToggle";
import { $theme } from "../../stores/theme";

describe("ThemeToggle", () => {
  beforeEach(() => {
    $theme.set("light");
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("renders a button with aria-label", () => {
    render(<ThemeToggle label="Toggle theme" />);
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toBeInTheDocument();
  });

  it("shows moon icon in light mode", () => {
    render(<ThemeToggle label="Toggle theme" />);
    const button = screen.getByRole("button");
    expect(button.querySelector("[data-icon='moon']")).toBeInTheDocument();
    expect(button.querySelector("[data-icon='sun']")).not.toBeInTheDocument();
  });

  it("shows sun icon in dark mode", () => {
    $theme.set("dark");
    render(<ThemeToggle label="Toggle theme" />);
    const button = screen.getByRole("button");
    expect(button.querySelector("[data-icon='sun']")).toBeInTheDocument();
    expect(button.querySelector("[data-icon='moon']")).not.toBeInTheDocument();
  });

  it("toggles theme on click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle label="Toggle theme" />);

    await user.click(screen.getByRole("button"));
    expect($theme.get()).toBe("dark");

    await user.click(screen.getByRole("button"));
    expect($theme.get()).toBe("light");
  });

  it("syncs document class on toggle", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle label="Toggle theme" />);

    await user.click(screen.getByRole("button"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await user.click(screen.getByRole("button"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
