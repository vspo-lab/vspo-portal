import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sidebar-collapsed";

type ActiveGuild = {
  id: string;
  name: string;
  iconUrl: string | null;
};

type DesktopSidebarIslandProps = {
  activeGuild: ActiveGuild | null;
  translations: {
    allServers: string;
    sidebarCollapse: string;
    sidebarLabel: string;
    firstLabel: string;
    notifications: string;
  };
  channelsHref: string;
  announcementsHref: string;
  isChannelsActive: boolean;
  isAnnouncementsActive: boolean;
};

const navBase =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vspo-purple/50";
const navActive = `${navBase} bg-vspo-purple/10 text-vspo-purple`;
const navInactive = `${navBase} text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface`;

/** Avatar with initial-letter fallback */
function Avatar({
  src,
  name,
  size,
}: {
  src: string | null;
  name: string;
  size: "xs" | "md";
}) {
  const cls = size === "xs" ? "h-5 w-5" : "h-10 w-10";
  const textCls = size === "xs" ? "text-xs" : "text-sm font-bold";
  const px = size === "xs" ? 20 : 40;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${cls} rounded-full`}
        loading="lazy"
        width={px}
        height={px}
      />
    );
  }
  return (
    <div
      className={`flex ${cls} items-center justify-center rounded-full bg-muted text-muted-foreground ${textCls}`}
      role="img"
      aria-label={name}
    >
      {name[0]}
    </div>
  );
}

/** Hash icon for channel settings */
function HashIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
      />
    </svg>
  );
}

/** Grid icon for servers list */
function GridIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

/** Bell icon for notifications */
function BellIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

/** Hamburger icon */
function MenuIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

export function DesktopSidebarIsland({
  activeGuild,
  translations,
  channelsHref,
  announcementsHref,
  isChannelsActive,
  isAnnouncementsActive,
}: DesktopSidebarIslandProps) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setExpanded(false);
  }, []);

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      localStorage.setItem(STORAGE_KEY, String(prev));
      return !prev;
    });
  }, []);

  const FirstIcon = activeGuild ? HashIcon : GridIcon;

  return (
    <aside
      className={`hidden shrink-0 flex-col bg-surface-container-lowest transition-[width] duration-200 ease-in-out lg:flex ${
        expanded ? "w-[260px]" : "w-16"
      }`}
    >
      {/* Toggle header */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 px-3 py-3">
        <button
          type="button"
          onClick={toggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
          aria-label={translations.sidebarCollapse}
          aria-expanded={expanded}
        >
          <MenuIcon />
        </button>
        {expanded && (
          <a
            href="/dashboard"
            className="truncate text-sm text-on-surface-variant transition-colors hover:text-on-surface"
          >
            {translations.allServers}
          </a>
        )}
      </div>

      {/* Guild info */}
      {activeGuild && (
        <div
          className={`flex items-center gap-3 px-4 py-4 ${
            expanded ? "" : "justify-center px-0 gap-0"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
            <Avatar
              src={activeGuild.iconUrl}
              name={activeGuild.name}
              size="md"
            />
          </div>
          {expanded && (
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold font-heading text-on-surface leading-none">
                {activeGuild.name}
              </h2>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav
        className="flex-1 space-y-1 px-3 pt-2"
        aria-label={translations.sidebarLabel}
      >
        <a
          href={channelsHref}
          className={`${isChannelsActive ? navActive : navInactive} ${
            expanded ? "" : "justify-center px-0 gap-0"
          }`}
          aria-current={isChannelsActive ? "page" : undefined}
          title={translations.firstLabel}
        >
          <FirstIcon className="h-5 w-5 shrink-0" />
          {expanded && <span>{translations.firstLabel}</span>}
        </a>
        <a
          href={announcementsHref}
          className={`${isAnnouncementsActive ? navActive : navInactive} ${
            expanded ? "" : "justify-center px-0 gap-0"
          }`}
          aria-current={isAnnouncementsActive ? "page" : undefined}
          title={translations.notifications}
        >
          <BellIcon className="h-5 w-5 shrink-0" />
          {expanded && <span>{translations.notifications}</span>}
        </a>
      </nav>
    </aside>
  );
}
