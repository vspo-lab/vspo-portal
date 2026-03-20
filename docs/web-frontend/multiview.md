# Multiview

Watch multiple livestreams simultaneously. Supports YouTube, Twitch, and Twitcasting.

## Structure

```text
features/multiview/
├── api/multiviewService.ts       # Fetch streams (parallel, deduplicated)
├── context/PlaybackContext.tsx    # Cross-player coordination
├── hooks/
│   ├── usePlaybackControls.ts    # Play/volume state management
│   ├── useMultiviewLayout.ts     # Layout definitions (8 types)
│   └── useConfigurationLoader.ts # URL config loading
├── utils/
│   ├── stateManager.ts           # localStorage + URL sharing + custom presets + resolveStream/toStreamSnapshot
│   ├── gridSwap.ts               # Overlap resolution (integer grid) + drag swap
│   ├── urlParser.ts              # Platform URL parsing
│   ├── platformUtils.ts          # Per-platform embed URL generation (YouTube, Twitch, Twitcasting)
│   ├── configLoader.ts           # External config loading
│   └── theme.ts                  # Shared theme utilities
├── components/
│   ├── containers/               # MultiviewGrid, VideoPlayer, ChatCell, LayoutSelector, StreamSelector, UrlInput, MultiviewErrorBoundary
│   └── presenters/               # UI for each container
└── pages/MultiviewPage/          # container, presenter, serverSideProps
```

## Layouts

| Type | Description | Shortcut |
|------|-------------|----------|
| `auto` | Auto-select by stream count | Alt+A |
| `1x1` `2x1` `1x2` `2x2` | Basic grids | Alt+1–4 |
| `3x3` | 9-cell grid | Alt+9 |
| `4x3` | 12-cell grid | Alt+0 |
| `picture-in-picture` | Main + overlay | Alt+P |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F` | Toggle browser fullscreen (Fullscreen API) |
| `I` | Toggle immersive mode |
| `T` | Toggle controls panel (large screens) |
| `Escape` | Exit immersive mode |

Shortcuts are disabled when focus is in an input field, textarea, or contentEditable element.

## Grid

- `react-grid-layout` (120 columns, rowHeight=10px for fine resize control)
- `allowOverlap={true}`, `compactType={null}` for free-form placement
- Drag swap detection at 50% overlap (RAF-throttled)
- Post-drop/resize overlap resolution: integer-grid algorithm checks all pairs, pushes apart on the axis with minimum overlap (up to 20 passes)
- `resolveOverlaps` is called on ALL paths that modify layout: drag stop, resize stop, stream add/remove, and saved layout restore
- All 8 resize handles (n, s, e, w, ne, nw, se, sw) — visible on grid item hover
- Auto-fills viewport height; grid container uses `position: sticky` below the AppBar
- Visual guide lines: 12-column vertical + row-aligned horizontal (CSS background-image)

## Chat

YouTube/Twitch chat iframes as grid cells. Keyed as `chat-{streamId}`. Toggleable from the stream selector list.

## Playback Controls

- Global: play/pause all, mute all, volume, sync to live
- Per-stream: play/pause, mute, volume
- "Listen to this only" (mute all but one)
- Background tab: players pause on `visibilitychange` (saves CPU/battery)

## State

- **Priority**: URL (`?s=`) > localStorage > defaults
- **URL sharing**: pipe-delimited + base64url compression; URL bar syncs only when opened with `?s=` param
- **Custom presets**: up to 10 named presets saved to localStorage, including stream info for full restoration
- **Zod validation**: all deserialized data (localStorage, URL params) validated with schemas
- **Stream factories**: `resolveStream()` and `toStreamSnapshot()` centralize Livestream reconstruction

## URL Input

- Supports YouTube, Twitch, Twitcasting URL parsing
- Fetches title/channel via oEmbed API (YouTube, Twitch — no API key required, 5s timeout)
- Manually added streams listed below input with delete buttons

## Immersive Mode

Hides header/footer/nav for distraction-free viewing. Exit via Escape or `I` key. Uses `data-immersive` attribute + MutationObserver for grid recalculation. Exit button visible on touch devices (`opacity: 0.8`) and on keyboard focus-within.

## Security

- iframe `sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"`
- `postMessage` targets specific origins (`https://www.youtube.com`, `https://player.twitch.tv`)
- Embed URLs generated via `URLSearchParams` (no raw string interpolation)
- No arbitrary URL embedding — unknown platforms return empty string

## Accessibility

- `prefers-reduced-motion`: transitions/transforms disabled
- `aria-live` region announces stream count changes
- `aria-expanded` on collapsible sections
- Minimum 44px touch targets on drag/close buttons
- `focus-within` reveals player header for keyboard users
- Search field has explicit `aria-label`

## Performance

- `startTransition` for drag swap layout updates (React 19)
- `loading="lazy"` on iframes
- `will-change: transform` only during active drag
- Debounced localStorage writes (500ms)
- Mobile stream limit: 4 (desktop: 12) to prevent OOM
- `visualViewport` API for accurate mobile height
- Safe area insets (`env(safe-area-inset-*)`) for notched devices
- `100dvh` for iOS Safari address bar compatibility
- React Compiler enabled — automatic memoization

## Error Handling

- `MultiviewErrorBoundary` wraps the entire multiview page
- Empty embed URLs show error state (not blank iframe)

## References

- [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) — Grid layout library
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) — postMessage-based control
- [Twitch Embed](https://dev.twitch.tv/docs/embed/) — iframe embed spec
- [YouTube oEmbed](https://oembed.com/) — Metadata API for URL-added streams
