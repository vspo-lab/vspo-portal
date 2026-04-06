import { useEffect } from "react";
import { useTheme } from "../hooks/useTheme";

type ThemeToggleProps = {
  label: string;
};

/**
 * React island for theme toggling.
 * Reads from and writes to the global $theme Nano Store.
 * Syncs the document.documentElement class for Tailwind dark mode.
 *
 * Note: The is:inline script in Base.astro handles FOUC prevention on initial load.
 * This component syncs state on mount and handles subsequent toggles.
 */
export function ThemeToggle({ label }: ThemeToggleProps) {
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-vspo-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vspo-purple/50"
    >
      {isDark ? (
        <svg
          data-icon="sun"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <path
            strokeLinecap="round"
            d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          />
        </svg>
      ) : (
        <svg
          data-icon="moon"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
          />
        </svg>
      )}
    </button>
  );
}
