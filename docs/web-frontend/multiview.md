# Multiview

Watch up to 12 livestreams simultaneously. Supports YouTube and Twitch.

## Structure

```
features/multiview/
├── api/multiviewService.ts       # Fetch streams (parallel, deduplicated)
├── context/PlaybackContext.tsx    # Cross-player coordination
├── hooks/
│   ├── usePlaybackControls.ts    # Play/volume state management
│   ├── useMultiviewLayout.ts     # Layout definitions (8 types)
│   └── useConfigurationLoader.ts # URL config loading
├── utils/
│   ├── stateManager.ts           # localStorage + URL sharing + custom presets
│   ├── gridSwap.ts               # Drag swap + VPSC overlap resolution (webcola)
│   ├── urlParser.ts              # Platform URL parsing
│   ├── platformUtils.ts          # Per-platform config
│   ├── configLoader.ts           # External config loading
│   └── theme.ts                  # Shared theme utilities
├── components/
│   ├── containers/               # MultiviewGrid, VideoPlayer, ChatCell, LayoutSelector, StreamSelector
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

## Grid

- `react-grid-layout` (12 columns, ROW_UNIT=1px)
- Drag swap (triggers at 50% overlap, RAF-throttled)
- Post-resize overlap resolution via **webcola VPSC** (minimizes sum of squared displacements)
- Auto-fills viewport height with proportional rescaling
- Grid guidelines (CSS background-image)

## Chat

YouTube/Twitch chat iframes as grid cells. Keyed as `chat-{streamId}`.

## Playback Controls

- Global: play/pause all, mute all, volume, sync to live
- Per-stream: play/pause, mute, volume
- "Listen to this only" (mute all but one)

## State

- **Priority**: URL > localStorage > defaults
- **URL sharing**: pipe-delimited + base64url compression (`?s=` param)
- **Custom presets**: up to 10 named layouts saved to localStorage

## Immersive Mode

Hides header/footer/nav for distraction-free viewing. Exit via Escape. Uses `data-immersive` attribute + MutationObserver for grid recalculation.

## Performance

- React.memo (VideoPlayer, Presenter) + MemoizedPlayer wrapper
- RAF-throttled resize and drag handlers
- `will-change: transform` + iframe `pointer-events: none` during drag
- React Compiler enabled

## References

- [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) — Grid layout library
- [webcola](https://github.com/tgdwyer/WebCola) — VPSC constraint solver
- [Fast Node Overlap Removal (VPSC paper)](https://people.eng.unimelb.edu.au/pstuckey/papers/gd2005b.pdf) — Dwyer, Marriott, Stuckey, 2005
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) — postMessage-based control
- [Twitch Embed](https://dev.twitch.tv/docs/embed/) — iframe embed spec
