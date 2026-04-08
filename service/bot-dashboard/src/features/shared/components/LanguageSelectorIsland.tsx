import { useCallback, useState } from "react";
import { useClickOutside } from "../hooks/useClickOutside";

type LanguageSelectorIslandProps = {
  currentLocale: string;
  returnTo: string;
  label: string;
  localeLabels: Record<string, string>;
};

export function LanguageSelectorIsland({
  currentLocale,
  returnTo,
  label,
  localeLabels,
}: LanguageSelectorIslandProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-[--radius-sm] text-on-surface-variant transition-colors duration-[--duration-fast] ease-[--ease-standard] hover:bg-surface-container-highest hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vspo-purple/50"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path
            strokeLinecap="round"
            d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
          />
        </svg>
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-vspo-purple px-0.5 text-[10px] font-bold leading-none text-white">
          {currentLocale.toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 min-w-[140px] overflow-hidden rounded-lg border border-outline-variant bg-surface-container shadow-lg"
          role="menu"
        >
          {Object.entries(localeLabels).map(([lang, langLabel]) => (
            <form key={lang} method="post" action="/api/change-locale">
              <input type="hidden" name="_returnTo" value={returnTo} />
              <input type="hidden" name="locale" value={lang} />
              <button
                type="submit"
                role="menuitem"
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  currentLocale === lang
                    ? "bg-vspo-purple/10 text-vspo-purple font-semibold"
                    : "text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                {langLabel}
                {currentLocale === lang && (
                  <svg
                    className="ml-auto h-4 w-4 text-vspo-purple"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
