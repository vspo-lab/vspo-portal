/**
 * Shared theme toggle logic.
 *
 * Every sun/moon icon pair in the page registers itself via `registerIcons`.
 * When any toggle button fires `toggle()`, ALL registered pairs are synced
 * and localStorage is updated.
 */

type IconPair = { sun: HTMLElement; moon: HTMLElement };

const pairs: IconPair[] = [];

const applyAll = (isDark: boolean): void => {
  for (const { sun, moon } of pairs) {
    sun.classList.toggle("hidden", !isDark);
    moon.classList.toggle("hidden", isDark);
  }
};

/** Register a sun/moon icon pair to be kept in sync. */
export const registerIcons = (sun: HTMLElement, moon: HTMLElement): void => {
  pairs.push({ sun, moon });
  applyAll(document.documentElement.classList.contains("dark"));
};

/** Toggle dark ↔ light, sync every registered icon pair, persist choice. */
export const toggle = (): void => {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  localStorage.setItem("theme", next ? "dark" : "light");
  applyAll(next);
};
