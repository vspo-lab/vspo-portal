// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { $flash, dismissFlash, showFlash } from "../flash";

describe("flash store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    $flash.set(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts as null", () => {
    expect($flash.get()).toBeNull();
  });

  it("showFlash sets a success message", () => {
    showFlash({ type: "success", message: "Saved!" });
    expect($flash.get()).toEqual({ type: "success", message: "Saved!" });
  });

  it("showFlash sets an error message", () => {
    showFlash({ type: "error", message: "Failed" });
    expect($flash.get()).toEqual({ type: "error", message: "Failed" });
  });

  it("showFlash auto-dismisses after 5 seconds", () => {
    showFlash({ type: "success", message: "Done" });
    expect($flash.get()).not.toBeNull();

    vi.advanceTimersByTime(5000);
    expect($flash.get()).toBeNull();
  });

  it("dismissFlash clears immediately", () => {
    showFlash({ type: "success", message: "Done" });
    dismissFlash();
    expect($flash.get()).toBeNull();
  });

  it("showFlash resets timer on consecutive calls", () => {
    showFlash({ type: "success", message: "First" });
    vi.advanceTimersByTime(3000);

    showFlash({ type: "error", message: "Second" });
    vi.advanceTimersByTime(3000);
    // Second timer still has 2s remaining
    expect($flash.get()).toEqual({ type: "error", message: "Second" });

    vi.advanceTimersByTime(2000);
    expect($flash.get()).toBeNull();
  });
});
