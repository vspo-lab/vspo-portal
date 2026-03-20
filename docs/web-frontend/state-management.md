# State Management

## Principle

State lives in the **narrowest scope** possible. No global state library is used.

## State Types

| Type | Mechanism | Example |
|------|-----------|---------|
| **Server data** | `getServerSideProps` -> page props | Livestreams, clips, events |
| **Page-level UI** | `useState` in containers | Tab selection, dialog open/close, loading |
| **Computed data** | `useMemo` in hooks | Grouped livestreams by date |
| **User preferences** | Cookies via context | Timezone, locale, session ID |
| **Theme** | React Context | Light/dark mode |
| **Video modal** | React Context | Modal visibility, video stack |
| **Complex persistence** | LocalStorage + URL params | Multiview layout, selected streams |

## Context Providers

Defined in `_app.tsx` provider stack (outermost to innermost):

### ThemeModeProvider

MUI theme with custom VSPO colors and CSS variable-based light/dark mode. Persistence is handled by MUI's built-in `InitColorSchemeScript`. See [Styling](./styling.md) for theme details and custom colors.

### TimeZoneContextProvider

Manages user's timezone preference.

```tsx
// context/TimeZoneContext.tsx
// Hook: useTimeZoneContext()
// Returns: { timeZone: string, setTimeZone: (tz: string) => void }
// Persistence: TIME_ZONE_COOKIE ("time-zone")
// Default: "Asia/Tokyo"
```

### VideoModalContextProvider

Stack-based video modal with history navigation.

```tsx
// context/VideoModalContext.tsx
// Hook: useVideoModal()
// Returns: { pushVideo, popVideo, clearVideos, activeVideo }
// VideoModal component is lazy-loaded (dynamic import, ssr: false)
```

## Cookie-Based State

| Cookie | Purpose | Default |
|--------|---------|---------|
| `NEXT_LOCALE` | User's locale preference | `ja` |
| `time-zone` | User's timezone | `Asia/Tokyo` |
| `x-session-id` | Analytics session tracking | Auto-generated UUID |

Cookies are set by middleware on first request and updated by context providers.

## Feature-Specific State

### Schedule

- `currentStatusFilter`: Selected tab (all/live/upcoming/archive)
- `isSearchDialogOpen`: Date search dialog visibility
- `useGroupedLivestreams`: Groups livestreams by date via `useMemo`
- `useFavoriteSearchConditions`: Favorite filters persisted to cookie

### Clips

- Pagination state (current page, total pages) in container
- Sort order selection in container

### Multiview

Most complex state management in the app. See [Multiview](./multiview.md) for full details.

- **Selected streams**: Which livestreams to display
- **Layout**: Grid configuration (2x2, 3x3, side-by-side, etc.)
- **Grid positions**: Drag-and-drop positions via `react-grid-layout`
- **Persistence**: LocalStorage for state, URL params for sharing
- **PlaybackContext**: Cross-video controls (playAll, pauseAll, muteAll)

```text
Priority: URL State > LocalStorage > Defaults
```
