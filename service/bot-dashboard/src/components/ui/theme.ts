/**
 * Shared theme toggle logic.
 *
 * Sun/moon icons are discovered via `[data-theme-icon="sun"]` and
 * `[data-theme-icon="moon"]` attributes — no manual registration needed.
 */

const syncIcons = (isDark: boolean): void => {
  for (const el of document.querySelectorAll<HTMLElement>("[data-theme-icon]")) {
    const isSun = el.dataset.themeIcon === "sun";
    el.classList.toggle("hidden", isSun ? !isDark : isDark);
  }
};

/** Toggle dark / light, sync every icon, persist choice. */
export const toggle = (): void => {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  localStorage.setItem("theme", next ? "dark" : "light");
  syncIcons(next);
};

/** Sync all theme icons to the current state (call on page load). */
export const syncTheme = (): void => {
  syncIcons(document.documentElement.classList.contains("dark"));
};
