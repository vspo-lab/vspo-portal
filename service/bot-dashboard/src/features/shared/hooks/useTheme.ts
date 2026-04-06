import { useStore } from "@nanostores/react";
import { useEffect, useRef } from "react";
import { $theme, initTheme, type Theme, toggleTheme } from "../stores/theme";

export type ThemeHook = {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
};

/**
 * React hook that syncs with the global $theme Nano Store.
 * Calls initTheme() once on first mount to hydrate from localStorage.
 * Provides the current theme, a toggle function, and a convenience isDark flag.
 */
export function useTheme(): ThemeHook {
  const initialized = useRef(false);
  const theme = useStore($theme);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initTheme();
    }
  }, []);

  return {
    theme,
    isDark: theme === "dark",
    toggle: toggleTheme,
  };
}
