import { useEffect, useState } from "react";

type Props = {
  readonly ariaLabel: string;
};

const getIsDark = (): boolean =>
  document.documentElement.classList.contains("dark");

/**
 * React Island for theme toggle button.
 *
 * @precondition Base.astro's `is:inline` script has already applied the
 *   initial theme class to `<html>`, so `getIsDark()` returns the correct
 *   value on first render.
 * @postcondition Clicking the button toggles `dark` class on `<html>`,
 *   persists the choice to `localStorage`, and updates the icon.
 */
export default function ThemeToggle({ ariaLabel }: Props) {
  const [isDark, setIsDark] = useState(getIsDark);

  useEffect(() => {
    // Sync state after View Transitions swap (MPA page-load re-mounts the
    // island, but just in case the component survives a swap).
    const sync = () => setIsDark(getIsDark());
    document.addEventListener("astro:page-load", sync);
    return () => document.removeEventListener("astro:page-load", sync);
  }, []);

  const handleToggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={handleToggle}
      className="inline-flex items-center justify-center rounded-lg text-on-surface-variant transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 hover:bg-surface-container-highest hover:text-vspo-purple focus-visible:ring-vspo-purple/50 h-10 w-10"
    >
      {isDark ? (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx={12} cy={12} r={5} />
          <path
            strokeLinecap="round"
            d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          />
        </svg>
      ) : (
        <svg
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
