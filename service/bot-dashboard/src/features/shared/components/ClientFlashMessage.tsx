import { useStore } from "@nanostores/react";
import { $flash, dismissFlash } from "../stores/flash";

/**
 * Client-side flash message that reads from the global $flash Nano Store.
 * Use alongside (or as a replacement for) the server-rendered FlashMessage.astro.
 *
 * The $flash store handles auto-dismiss timing; this component just renders.
 */
export function ClientFlashMessage() {
  const flash = useStore($flash);

  if (!flash) return null;

  const isSuccess = flash.type === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-xl p-4 text-sm text-on-surface ${
        isSuccess ? "bg-vspo-purple/10" : "bg-destructive/10"
      }`}
    >
      {isSuccess ? (
        <svg
          className="h-5 w-5 shrink-0 text-vspo-purple"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ) : (
        <svg
          className="h-5 w-5 shrink-0 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      )}
      <span className="flex-1">{flash.message}</span>
      <button
        type="button"
        onClick={dismissFlash}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container-highest"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
