import { atom } from "nanostores";

export type Theme = "light" | "dark";

/** Global theme state shared across all islands */
export const $theme = atom<Theme>("light");

/**
 * Initialize theme from localStorage.
 * Call once on app startup (e.g., in a React island's useEffect).
 * The is:inline script in Base.astro handles FOUC prevention separately.
 */
export const initTheme = (): void => {
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") {
    $theme.set(stored);
  }
};

/** Toggle between light and dark, persisting to localStorage */
export const toggleTheme = (): void => {
  const next: Theme = $theme.get() === "dark" ? "light" : "dark";
  $theme.set(next);
  localStorage.setItem("theme", next);
};
