# Frontend Architecture

## Overview

Next.js 15 application using the **Pages Router**, deployed to Cloudflare Workers via OpenNextJS. UI is built with **MUI v7 + Emotion**. Code is organized into feature modules following the **Container/Presenter** pattern.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (Pages Router) |
| UI Library | MUI v7 (Material UI) + Emotion CSS-in-JS |
| Language | TypeScript 5.9 (strict mode, Zod Schema First) |
| i18n | next-i18next (ja, en, cn, tw, ko) |
| Error Handling | Result type (`@vspo-lab/error`) |
| Date | date-fns + date-fns-tz (display), `@vspo-lab/dayjs` (UTC ops) |
| Runtime | Cloudflare Workers |

## Related Documents

| Document | Description |
|----------|-------------|
| [Routing](./routing.md) | Pages Router, route map, layout system, middleware |
| [Data Fetching](./data-fetching.md) | serverSideProps, dual API support, Result pattern |
| [State Management](./state-management.md) | Context providers, cookies, LocalStorage |
| [i18n](./i18n.md) | Internationalization setup and locale resolution |
| [Styling](./styling.md) | MUI + Emotion theming and component styling |
| [Shared Components](./shared-components.md) | Layout, VideoCard, VideoModal, common UI elements |
| [Multiview](./multiview.md) | Multi-stream viewer, grid layouts, playback controls |
| [Middleware](./middleware.md) | Locale routing, timezone, session tracking |
| [PWA](./pwa.md) | Progressive Web App configuration and caching |

## Directory Structure

```text
service/vspo-schedule/v2/web/src/
├── pages/                         # Next.js Pages Router (route entry points)
│   ├── _app.tsx                   # Provider stack + per-page layout
│   ├── _document.tsx              # HTML document (MUI SSR, analytics, PWA)
│   ├── schedule/[status].tsx      # /schedule/all, /schedule/live, etc.
│   ├── clips/                     # /clips, /clips/youtube, /clips/twitch
│   ├── freechat.tsx               # /freechat
│   ├── multiview.tsx              # /multiview
│   ├── about.tsx                  # /about
│   ├── site-news/                 # /site-news, /site-news/[id]
│   ├── privacy-policy.tsx         # /privacy-policy
│   └── terms.tsx                  # /terms
│
├── features/                      # Feature modules (business logic + UI)
│   ├── schedule/                  # Livestream schedule
│   ├── clips/                     # YouTube/Twitch clips
│   ├── freechat/                  # Free chat rooms
│   ├── multiview/                 # Multi-stream viewer
│   ├── site-news/                 # Site announcements
│   ├── about/                     # About page
│   ├── legal-documents/           # Privacy policy, Terms
│   └── shared/                    # Cross-feature code
│       ├── domain/                # Zod schemas + types
│       ├── api/                   # API fetch functions (Result-based)
│       ├── components/            # Shared UI (Layout, Card, Modal, etc.)
│       ├── utils/                 # Video embed URL helpers
│       └── types/                 # Worker API type definitions
│
├── context/                       # React contexts (Theme, TimeZone, VideoModal)
├── lib/                           # Utilities (Const, i18n, cloudflare, markdown)
├── constants/navigation.ts        # Route definitions
├── hooks/                         # Shared hooks (useCookie, etc.)
├── middleware.ts                   # Locale, timezone, session ID handling
└── styles/                        # Global styles
```

## Feature Module Structure

Each feature follows a consistent layout:

```text
features/<feature>/
├── api/                           # Feature-specific data orchestration
│   └── <feature>Service.ts        # Composes shared API calls
├── components/
│   ├── containers/                # Business logic (state, effects, handlers)
│   └── presenters/                # Pure UI rendering
├── pages/
│   └── <PageName>/
│       ├── container.tsx           # Page-level container
│       ├── presenter.tsx           # Page-level presenter
│       └── serverSideProps.ts      # getServerSideProps logic
├── hooks/                         # Feature-specific hooks
├── types/                         # Feature-specific types
└── utils/                         # Feature-specific utilities
```

Not every feature has all directories -- only include what is needed.

### Feature Catalog

| Feature | Data Source | Key Patterns |
|---------|-------------|--------------|
| **schedule** | fetchLivestreams, fetchEvents | Status tabs (all/live/upcoming/archive), date grouping, favorite filters |
| **clips** | fetchClips (3x parallel), fetchVspoMembers | Per-platform pages, pagination, sort by viewCount/date |
| **freechat** | fetchFreechats | Simple list display |
| **multiview** | fetchLivestreams (2x) | Grid layout, LocalStorage persistence, URL sharing, PlaybackContext |
| **site-news** | Markdown files | Static content, no API |
| **about** | Markdown files | Static content, no API |
| **legal-documents** | Translations | getStaticProps |

See [Routing](./routing.md) for the full route map.

## Container/Presenter Pattern

Every UI feature separates business logic from rendering.

### Container

- Manages state (`useState`, `useEffect`, custom hooks)
- Orchestrates data (received from `serverSideProps` via page props)
- Defines event handlers
- Passes computed props to presenter
- Minimal JSX

```tsx
// features/schedule/pages/ScheduleStatus/container.tsx
export const ScheduleStatus: React.FC<ScheduleStatusProps> = ({
  livestreams, events, timeZone, locale, liveStatus, ...
}) => {
  const [currentStatusFilter, setCurrentStatusFilter] = useState(liveStatus);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const { groupedLivestreams } = useGroupedLivestreams(livestreams, timeZone);

  return (
    <ScheduleStatusPresenter
      groupedLivestreams={groupedLivestreams}
      currentStatusFilter={currentStatusFilter}
      onStatusFilterChange={setCurrentStatusFilter}
      onSearchDialogOpen={() => setIsSearchDialogOpen(true)}
      // ...
    />
  );
};
```

### Presenter

- Receives all data and callbacks via props
- Handles rendering, styling, and accessibility
- Pure functional component (no direct state or effects)
- Reusable across different containers

```tsx
// features/schedule/pages/ScheduleStatus/presenter.tsx
export const ScheduleStatusPresenter: React.FC<PresenterProps> = ({
  groupedLivestreams, currentStatusFilter, onStatusFilterChange, ...
}) => {
  return (
    <Box>
      <Tabs value={currentStatusFilter} onChange={(_, v) => onStatusFilterChange(v)}>
        {/* tab items */}
      </Tabs>
      {/* content */}
    </Box>
  );
};
```

### Guidelines

| Container | Presenter |
|-----------|-----------|
| `useState`, `useEffect`, hooks | Props only |
| Business logic (filtering, sorting) | Pure rendering |
| Event handler definitions | `onClick={onXxx}` callbacks |
| Minimal JSX | Rich JSX + MUI components |

When a container would be a trivial pass-through (no logic), skip it and use the presenter directly from the page.

## Dependency Direction

```text
@vspo-lab/* packages (error, api, dayjs, logging)
         |
    features/shared/ (domain, api, components)
         |
    features/<feature>/ (schedule, clips, etc.)
         |
       pages/ (route entry points)
```

### Rules

- **Shared -> Features**: Shared domain/api/components available to all features
- **Features -> Pages**: Features imported by page files
- **Prohibited**: Feature must not import from another feature
- **Prohibited**: Shared code must not import from features or pages
- Within a feature: Container -> Presenter (one-way)

## Domain Models

All defined as Zod schemas in `features/shared/domain/`. Types are inferred via `z.infer<>`.

The domain entity "Stream" is called `Livestream` in frontend code. The entity "Creator" maps to the `Channel` type. See [Entities](../domain/entities.md) for full attribute tables and business rules.

**Platform enum**: `youtube`, `twitch`, `twitcasting`, `niconico`, `unknown`.
**Status enum**: `live`, `upcoming`, `ended`, `unknown`.
