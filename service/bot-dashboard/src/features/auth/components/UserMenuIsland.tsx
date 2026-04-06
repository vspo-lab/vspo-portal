import { useCallback, useEffect, useState } from "react";
import { useClickOutside } from "~/features/shared/hooks/useClickOutside";
import { useTheme } from "~/features/shared/hooks/useTheme";

type UserMenuIslandProps = {
  displayName: string;
  avatarUrl: string | null;
  translations: {
    language: string;
    theme: string;
    logout: string;
  };
  localeLabels: Record<string, string>;
  currentLocale: string;
  returnTo: string;
};

export function UserMenuIsland({
  displayName,
  avatarUrl,
  translations,
  localeLabels,
  currentLocale,
  returnTo,
}: UserMenuIslandProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(close);
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <div ref={ref} className="group relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-surface-container-highest [&::-webkit-details-marker]:hidden"
        aria-label={displayName}
        aria-expanded={isOpen}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-8 w-8 rounded-full"
            loading="lazy"
            width={32}
            height={32}
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
            role="img"
            aria-label={displayName}
          >
            {displayName[0]}
          </div>
        )}
        <span className="hidden text-sm font-medium sm:block">
          {displayName}
        </span>
        <svg
          className={`h-4 w-4 opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl bg-surface-container-high/95 p-2 shadow-hover glass">
          {/* Language */}
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              {translations.language}
            </p>
            <div className="mt-1 flex items-center gap-1">
              {Object.entries(localeLabels).map(([lang, langLabel]) => (
                <form key={lang} method="post" action="/api/change-locale">
                  <input type="hidden" name="_returnTo" value={returnTo} />
                  <button
                    type="submit"
                    name="locale"
                    value={lang}
                    className={`rounded px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                      currentLocale === lang
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-pressed={currentLocale === lang ? "true" : "false"}
                  >
                    {langLabel}
                  </button>
                </form>
              ))}
            </div>
          </div>

          <div className="my-1 h-px bg-outline-variant/20" />

          {/* Theme */}
          <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer text-on-surface hover:bg-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vspo-purple/50"
          >
            {isDark ? (
              <svg
                className="h-4 w-4"
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
                className="h-4 w-4"
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
            <span>{translations.theme}</span>
          </button>

          <div className="my-1 h-px bg-outline-variant/20" />

          {/* Logout */}
          <form method="post" action="/auth/logout">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {translations.logout}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
