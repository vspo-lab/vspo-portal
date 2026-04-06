// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDialog } from "../useDialog";

describe("useDialog", () => {
  const createMockDialog = () => {
    const dialog = document.createElement("dialog");
    dialog.showModal = vi.fn();
    dialog.close = vi.fn();
    Object.defineProperty(dialog, "open", {
      get: vi.fn().mockReturnValue(false),
      configurable: true,
    });
    document.body.appendChild(dialog);
    return dialog;
  };

  it("returns isOpen false initially", () => {
    const { result } = renderHook(() => useDialog());
    expect(result.current.isOpen).toBe(false);
  });

  it("open calls showModal on the dialog ref", () => {
    const dialog = createMockDialog();
    const { result } = renderHook(() => useDialog());

    // Assign ref manually
    (result.current.ref as { current: HTMLDialogElement }).current = dialog;

    act(() => {
      result.current.open();
    });

    expect(dialog.showModal).toHaveBeenCalled();
    dialog.remove();
  });

  it("close calls close on the dialog ref", () => {
    const dialog = createMockDialog();
    const { result } = renderHook(() => useDialog());

    (result.current.ref as { current: HTMLDialogElement }).current = dialog;

    act(() => {
      result.current.open();
      result.current.close();
    });

    expect(dialog.close).toHaveBeenCalled();
    dialog.remove();
  });
});
