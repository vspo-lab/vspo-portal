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
└── pages/MultiviewPage/          # container, presenter (page at app/[locale]/(standalone)/multiview/page.tsx)
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
- Drag swap: real-time position swap during drag (50% overlap threshold, RAF-throttled via `computeSwapDuringDrag`)
- Post-drop: `resolveOverlaps` on ALL paths that modify layout: drag stop, resize stop, stream add/remove, and saved layout restore
- All 8 resize handles (n, s, e, w, ne, nw, se, sw) — visible on grid item hover
- Auto-fills viewport height; grid container uses `position: sticky` below the AppBar
- Visual guide lines: 12-column vertical + row-aligned horizontal (CSS background-image)

### Drag-Time Swap (`computeSwapDuringDrag`)

ドラッグ中に RAF スロットルで呼び出され、アイテムの位置をリアルタイムに入れ替える。

1. ドラッグ中のアイテムと最も重なりが大きいアイテムを検出
2. 重なり面積がドラッグアイテム面積の **50%** 以上 → ターゲットをドラッグ元の位置にスワップ
3. 同一ターゲットへの連続スワップを `lastSwappedId` で抑制（チャタリング防止）
4. スワップ後の二次衝突は `resolveOverlaps` で即解消
5. `startTransition` でレイアウト更新し、ドラッグの応答性を維持

### Overlap Resolution (`resolveOverlaps`)

#### 数学的背景

[VPSC (Variable Placement with Separation Constraints)](https://doi.org/10.1007/11618058_15) は以下の制約付き二次計画問題を解く:

```text
minimize   Σᵢ wᵢ(xᵢ − dᵢ)²
subject to xₗ + gₗᵣ ≤ xᵣ   ∀(l, r) ∈ C
```

- **xᵢ**: アイテム i の中心座標（求解対象）
- **dᵢ**: アイテム i の元の中心座標（desired position）
- **wᵢ**: 重み（通常 1、境界変数は 10⁸）
- **gₗᵣ**: ペア (l, r) 間の最小距離 = `(wₗ + wᵣ) / 2`（半幅の和）
- **C**: 分離制約の集合

目的関数は元位置からの **二乗変位の重み付き和** を最小化するため、全アイテムが協調的に最小量だけ移動する。これが貪欲法（1ペアずつ逐次処理）と本質的に異なる点で、カスケード問題（A-B を直すと B-C が壊れる）が発生しない。

VPSC ソルバーはブロックマージ/分割アルゴリズムで O(n log n) で解く（[Dwyer et al., GD 2005](https://doi.org/10.1007/11618058_15)）。

#### 2D への拡張

2D の矩形重なり除去は X 軸と Y 軸を逐次解く（[Dwyer et al., "Fast Node Overlap Removal"](https://doi.org/10.1007/11618058_15)）:

1. **X-pass**: Y 方向に重なるペアに対し X 分離制約を生成して VPSC で解く
2. **Y-pass**: 更新後の X 位置で X 方向に重なるペアに対し Y 分離制約を生成して解く

各パスの制約生成は [webcola](https://github.com/tgdwyer/WebCola) の sweep-line アルゴリズムが行う。

#### 境界制約と整数化

webcola の `removeOverlaps` は境界制約を持たない（実数座標で解く）ため、後処理で対応する:

1. **境界クランプ**: `x ∈ [0, GRID_COLS - w]`, `y ≥ 0` に丸め
2. **整数化**: `Math.round()` で整数グリッドにスナップ

クランプや丸めで新たな重なりが生じうるため、`ensureNoOverlaps` で保証する。

#### ensureNoOverlaps（重なりゼロ保証）

VPSC で解決しきれなかった重なり（境界クランプ副作用、scan-line エッジケース、アイテムがグリッド幅に収まらない場合）を解消する。戦略の優先順:

1. **X-push**: 短い軸方向に押し出し（右→左の順に試行）
2. **位置スワップ**: 2アイテムの位置を交換
3. **Y-push**: 下方向に押し出し（常に成功 — グリッドは垂直スクロール可能）

#### 処理フロー

```text
resolveOverlaps(layout)
  ├── colaRemoveOverlaps(rects)     ← webcola 2D VPSC (O(n log n))
  ├── boundary clamp + round        ← 整数グリッド + 境界制約
  └── ensureNoOverlaps(items)       ← 重なりゼロ保証 (X-push / swap / Y-push)
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

- `startTransition` for drag swap layout updates (keeps drag responsive)
- Drag-time swap throttled via `requestAnimationFrame` (one swap computation per frame)
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
