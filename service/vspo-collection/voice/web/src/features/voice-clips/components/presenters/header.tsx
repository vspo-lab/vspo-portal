import { Plus, Volume2 } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  onRequestClick?: () => void;
}

export function Header({ onRequestClick }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-amber-600/30 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-6 h-6 md:w-8 md:h-8 text-amber-600 dark:text-amber-500" />
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-amber-100">
              Vspo! ボイス
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={onRequestClick}
              className="flex items-center space-x-1 md:space-x-2 bg-amber-600 dark:bg-amber-600 text-white dark:text-zinc-900 px-3 py-2 md:px-4 rounded-lg hover:bg-amber-700 dark:hover:bg-amber-500 transition-colors text-sm md:text-base font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">クリップをリクエスト</span>
              <span className="md:hidden">リクエスト</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
