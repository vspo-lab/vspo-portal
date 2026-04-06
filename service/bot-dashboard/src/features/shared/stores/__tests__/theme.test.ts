// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { $theme, initTheme, toggleTheme } from "../theme";

describe("theme store", () => {
  beforeEach(() => {
    $theme.set("light");
    localStorage.clear();
  });

  it("initializes to light by default", () => {
    expect($theme.get()).toBe("light");
  });

  it("toggleTheme switches from light to dark", () => {
    toggleTheme();
    expect($theme.get()).toBe("dark");
  });

  it("toggleTheme switches from dark to light", () => {
    $theme.set("dark");
    toggleTheme();
    expect($theme.get()).toBe("light");
  });

  it("initTheme reads from localStorage", () => {
    localStorage.setItem("theme", "dark");
    initTheme();
    expect($theme.get()).toBe("dark");
  });

  it("initTheme defaults to light when localStorage is empty", () => {
    initTheme();
    expect($theme.get()).toBe("light");
  });

  it("toggleTheme persists to localStorage", () => {
    toggleTheme();
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});
