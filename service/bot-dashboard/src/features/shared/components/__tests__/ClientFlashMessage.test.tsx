// @vitest-environment happy-dom

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { $flash, showFlash } from "../../stores/flash";
import { ClientFlashMessage } from "../ClientFlashMessage";

describe("ClientFlashMessage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    $flash.set(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when flash is null", () => {
    const { container } = render(<ClientFlashMessage dismissLabel="Dismiss" />);
    expect(container.querySelector("[role='status']")).toBeNull();
  });

  it("renders success message", () => {
    $flash.set({ type: "success", message: "Channel added!" });
    render(<ClientFlashMessage dismissLabel="Dismiss" />);
    expect(screen.getByRole("status")).toHaveTextContent("Channel added!");
  });

  it("renders error message", () => {
    $flash.set({ type: "error", message: "Something went wrong" });
    render(<ClientFlashMessage dismissLabel="Dismiss" />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Something went wrong",
    );
  });

  it("dismisses on button click", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    $flash.set({ type: "success", message: "Done" });
    render(<ClientFlashMessage dismissLabel="Dismiss" />);

    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    expect($flash.get()).toBeNull();
  });

  it("auto-dismisses after 5 seconds", () => {
    showFlash({ type: "success", message: "Auto" });
    render(<ClientFlashMessage dismissLabel="Dismiss" />);

    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect($flash.get()).toBeNull();
  });
});
