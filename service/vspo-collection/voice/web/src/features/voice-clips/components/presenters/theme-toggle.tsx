"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/theme-context";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-colors bg-zinc-800 dark:bg-zinc-800 hover:bg-zinc-700 dark:hover:bg-zinc-700 border border-zinc-700 dark:border-amber-600/20"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-amber-500" />
      ) : (
        <Moon className="w-5 h-5 text-zinc-600" />
      )}
    </button>
  );
}
