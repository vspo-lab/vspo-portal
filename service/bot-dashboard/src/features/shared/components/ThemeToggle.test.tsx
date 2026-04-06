import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ThemeToggle from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    localStorage.clear();
  });

  afterEach(cleanup);

  it("renders a button with the provided aria-label", () => {
    render(<ThemeToggle ariaLabel="Toggle theme" />);
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toBeInTheDocument();
  });

  it("shows moon icon when in light mode", () => {
    render(<ThemeToggle ariaLabel="Toggle theme" />);
    const btn = screen.getByRole("button");
    const svgs = btn.querySelectorAll("svg");
    expect(svgs).toHaveLength(1);
    // Moon path has the distinctive "M21 12.79" d attribute
    const moonPath = btn.querySelector('path[d^="M21 12.79"]');
    expect(moonPath).toBeInTheDocument();
  });

  it("shows sun icon when in dark mode", () => {
    document.documentElement.classList.add("dark");
    render(<ThemeToggle ariaLabel="Toggle theme" />);
    const btn = screen.getByRole("button");
    // Sun icon has a <circle> element
    const circle = btn.querySelector("circle");
    expect(circle).toBeInTheDocument();
  });

  it("toggles from light to dark on click", () => {
    render(<ThemeToggle ariaLabel="Toggle theme" />);
    const btn = screen.getByRole("button");

    fireEvent.click(btn);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
    // Now shows sun icon
    expect(btn.querySelector("circle")).toBeInTheDocument();
  });

  it("toggles from dark to light on click", () => {
    document.documentElement.classList.add("dark");
    render(<ThemeToggle ariaLabel="Toggle theme" />);
    const btn = screen.getByRole("button");

    fireEvent.click(btn);

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
    // Now shows moon icon
    expect(btn.querySelector('path[d^="M21 12.79"]')).toBeInTheDocument();
  });

  it("registers astro:page-load listener on mount and removes on unmount", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = render(<ThemeToggle ariaLabel="Toggle theme" />);

    expect(addSpy).toHaveBeenCalledWith(
      "astro:page-load",
      expect.any(Function),
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      "astro:page-load",
      expect.any(Function),
    );
  });
});
