// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../useTheme";
import { $theme } from "../../stores/theme";

describe("useTheme", () => {
  beforeEach(() => {
    $theme.set("light");
    localStorage.clear();
  });

  it("returns current theme from store", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("toggle switches theme", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.theme).toBe("dark");
  });

  it("isDark reflects current theme", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isDark).toBe(true);
  });

  it("syncs with store changes", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      $theme.set("dark");
    });

    expect(result.current.theme).toBe("dark");
  });

  it("hydrates theme from localStorage on mount", () => {
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
    expect(result.current.isDark).toBe(true);
  });
});
