import { atom } from "nanostores";

export type FlashType = "success" | "error";

export type FlashMessage = {
  type: FlashType;
  message: string;
};

/** Global flash message state shared across all islands */
export const $flash = atom<FlashMessage | null>(null);

let dismissTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Show a flash message that auto-dismisses after 5 seconds.
 * Calling again resets the timer.
 */
export const showFlash = (flash: FlashMessage): void => {
  if (dismissTimer !== undefined) {
    clearTimeout(dismissTimer);
  }
  $flash.set(flash);
  dismissTimer = setTimeout(() => {
    $flash.set(null);
    dismissTimer = undefined;
  }, 5000);
};

/** Dismiss the flash message immediately */
export const dismissFlash = (): void => {
  if (dismissTimer !== undefined) {
    clearTimeout(dismissTimer);
    dismissTimer = undefined;
  }
  $flash.set(null);
};
