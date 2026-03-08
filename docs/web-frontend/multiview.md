# Multiview

## Overview

Multi-stream viewer allowing users to watch up to 9 livestreams simultaneously with customizable grid layouts. Supports YouTube and Twitch with per-stream and global playback controls, state persistence via LocalStorage, and URL-based sharing.

## Architecture

```
features/multiview/
├── api/multiviewService.ts       # Fetches live + upcoming streams
├── context/PlaybackContext.tsx    # Cross-video player coordination
├── hooks/
│   ├── usePlaybackControls.ts    # Global + per-stream controls
│   ├── useMultiviewLayout.ts     # Responsive grid generation
│   └── useConfigurationLoader.ts # URL config loading
├── utils/
│   ├── stateManager.ts           # LocalStorage + URL state
│   ├── urlParser.ts              # Platform URL detection + embed generation
│   ├── platformUtils.ts          # Platform-specific capabilities
│   └── configLoader.ts           # External config loading
├── types/multiview.ts            # Zod schemas for layouts, panels, audio
├── components/
│   ├── containers/               # MultiviewGrid, LayoutSelector, StreamSelector, VideoPlayer
│   └── presenters/               # UI rendering for each container
└── pages/MultiviewPage/
    ├── container.tsx
    ├── presenter.tsx
    └── serverSideProps.ts
```

## Layout Types

The runtime layout system is defined in `useMultiviewLayout.ts`:

| Layout | Streams | Description |
|--------|---------|-------------|
| `auto` | Any | Auto-selects based on stream count (default) |
| `1x1` | 1 | Single stream |
| `2x1` | 2 | Side by side |
| `1x2` | 2 | Stacked |
| `2x2` | 4 | 2x2 equal grid |
| `3x3` | 9 | 3x3 equal grid |
| `picture-in-picture` | 2+ | Main stream with small overlay |

Auto-layout selects based on stream count: 1 -> `1x1`, 2 -> `2x1`, 3-4 -> `2x2`, 5+ -> `3x3`. Mobile restricts to `auto`, `1x1`, `1x2`.

> Note: `types/multiview.ts` defines a separate Zod schema with extended layout names (`grid-2x2`, `side-by-side`, `theater-mode`, `custom`) for preset configurations and validation. The runtime hook uses the simpler names above.

## State Management

### Priority Order

```
URL State > LocalStorage > Defaults
```

### LocalStorage Persistence

`stateManager.ts` saves/loads `MultiviewState`:

```typescript
{
  selectedStreams: Array<{ id, platform, channelId, title, channelTitle, link }>,
  layout: LayoutType,
  gridLayout?: GridLayoutItem[],
  version: 1,
}
```

Functions: `saveStateToLocalStorage()`, `loadStateFromLocalStorage()`, `clearStateFromLocalStorage()`.

### URL Sharing

`generateShareableUrl()` creates a compact base64-encoded URL parameter:

```typescript
// Compact format (minimal data for sharing)
{
  s: Array<{ i, p, c? }>,  // streams: id, platform, channelId
  l: string,                // layout type
  g?: Array<{ x, y, w, h }>, // grid positions
  v: number,                // version
}
```

`parseCompactStateFromUrl()` decodes it back. `expandCompactState()` restores full stream objects by matching IDs against available streams.

## PlaybackContext

React Context for coordinating multiple video players.

### VideoPlayerRef Interface

Each registered player exposes:

```typescript
play(), pause(), setVolume(volume), mute(), unmute(),
getState(): { isMuted, volume }, toggleFullscreen()
```

### Global Controls

```typescript
playAll(), pauseAll(), muteAll(), unmuteAll(), setAllVolume(volume)
```

Players are stored in a `useRef<Map>` to avoid re-renders on registration.

## usePlaybackControls Hook

Manages per-stream and global playback state.

- Initial state: first stream unmuted at 70% volume, others muted
- Global volume applies to all unmuted streams
- Volume clamped to 0-100
- Returns `streamStates`, `globalVolume`, `isGlobalMuted`, and toggle/set functions

## useMultiviewLayout Hook

Generates CSS Grid layout based on stream count and screen size.

Returns `gridTemplateColumns`, `gridTemplateRows` strings for direct CSS Grid usage, plus `availableLayouts` and `changeLayout()`.

## Platform Support

| Platform | Embed | Chat | Autoplay | Parent Domain Required |
|----------|-------|------|----------|----------------------|
| YouTube | Yes | Yes | Yes | Yes |
| Twitch | Yes | Channels only | Yes | Yes |
| TwitCasting | Yes | No | No | No |
| Niconico | Yes | No | No | No |

`urlParser.ts` handles URL detection and embed URL generation for all platforms. `platformUtils.ts` provides per-platform capability configuration.

## Data Flow

```
serverSideProps: fetchLivestreams(live) + fetchLivestreams(upcoming)
  → Container: manages selectedStreams, layout, gridLayout
    → useMultiviewLayout: generates CSS Grid
    → usePlaybackControls: manages play/pause/volume state
    → PlaybackProvider: coordinates player refs
      → VideoPlayerPresenter(s): render iframe embeds
      → PlaybackControlsPresenter: global control buttons
```
