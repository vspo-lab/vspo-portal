// @vitest-environment happy-dom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { $theme } from "../../stores/theme";
import { useTheme } from "../useTheme";

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
