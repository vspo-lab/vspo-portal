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
│   ├── gridSwap.ts               # VPSC overlap resolution (webcola) + drag swap
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
- `resolveOverlaps` is called on ALL paths that modify layout: drag stop, resize stop, stream add/remove, and saved layout restore
- All 8 resize handles (n, s, e, w, ne, nw, se, sw) — visible on grid item hover
- Auto-fills viewport height; grid container uses `position: sticky` below the AppBar
- Visual guide lines: 12-column vertical + row-aligned horizontal (CSS background-image)

### Overlap Resolution (`resolveOverlaps`)

2段階のハイブリッドアルゴリズムで重なりを解消する。

**Phase 1: VPSC (webcola)**

[VPSC (Variable Placement with Separation Constraints)](https://doi.org/10.1007/11618058_15) は、二次計画法ベースの制約ソルバー。全アイテムの分離制約を同時に解き、元位置からの二乗変位 `Σ(xᵢ − dᵢ)²` を最小化する。[webcola](https://github.com/tgdwyer/WebCola) の実装を使用。

1. **X-pass**: 各アイテムの中心 X 座標を `Variable` として生成。`generateXConstraints` が Y 方向に重なるペアに対し X 分離制約を sweep-line で生成。境界制約（`x ≥ 0`, `x + w ≤ 120`）を weight=10⁸ の固定変数で追加。`Solver.solve()` で最適解を算出
2. **Y-pass**: 更新後の X 位置を前提に `generateYConstraints` が X 方向に重なるペアに対し Y 分離制約を生成。境界制約（`y ≥ 0`、下限のみ — グリッドは垂直スクロール可能）を追加して解く
3. **整数化**: VPSC の実数解を `Math.round()` で整数グリッドに丸め、境界にクランプ

**Phase 2: Greedy Fixup**

webcola の sweep-line 制約生成は、同一中心のアイテムや整数丸めで残る重なりを見逃すケースがある。残存する重なりを貪欲法で解消する:

1. 全ペアから最大重なり面積のペアを探索（`getOverlapArea` を使用）
2. 重なりなし → 終了
3. X 重なり ≤ Y 重なり → X 方向に押し出し（境界で塞がれたら Y にフォールバック）
4. それ以外 → Y 方向に押し出し
5. 最大 `n² × 2` 回まで繰り返し（n ≤ 12 なので実質的に瞬時）

```
resolveOverlaps(layout)
  ├── solveWithVpsc(items)      ← Phase 1: 大域最適（O(n² log n)）
  │   ├── X-pass + boundary constraints → Solver.solve()
  │   └── Y-pass + boundary constraints → Solver.solve()
  └── greedyFixup(items)        ← Phase 2: 残存重なり修正（通常 0-2 回）
      └── worst-pair → tryPushX / pushY
```

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
- [webcola](https://github.com/tgdwyer/WebCola) — VPSC solver for overlap resolution
- [Dwyer, Marriott & Stuckey, "Fast Node Overlap Removal" (GD 2005)](https://doi.org/10.1007/11618058_15) — VPSC algorithm paper
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) — postMessage-based control
- [Twitch Embed](https://dev.twitch.tv/docs/embed/) — iframe embed spec
- [YouTube oEmbed](https://oembed.com/) — Metadata API for URL-added streams
