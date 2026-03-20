# UI/UX 包括的改善 — 設計ドキュメント

## Context

vspo-portal の Web フロントエンド（Next.js 15 / MUI v7 / Emotion）について、全ページの UI/UX を包括的に改善する。

**背景:**
- `docs/design/design-tokens.md` に設計済みの 3 層トークンアーキテクチャが実コードに未反映
- Theme.tsx で light/dark が同一パレットを共有し、ダークモードの品質が低い
- カードコンポーネントにホバーエフェクト・ステータス差別化がなく、ライブ/アーカイブの視覚的区別が弱い
- ボトムナビが 3 項目のみで Freechat がドロワーに隠れている
- ローディングがスピナー＋opacity:0 で、レイアウトシフトが発生する
- タイポグラフィに一貫性がなく、10px 最小サイズ違反がある

**アプローチ:** ハイブリッド — 最小基盤整備（ダークモード分離＋ステータスカラー）とカード改善を同時に進め、段階的にトークン完成・ページ固有UXへ拡充する。

---

## Phase 1: ダークモード分離 + ステータスカラー + カード改善

### 1-1. テーマ基盤整備

**対象:** `src/context/Theme.tsx`, `src/types/mui-styles.d.ts`

- `sharedColorSystemOptions` を廃止し `colorSchemes.light` / `colorSchemes.dark` に分離
- ダークモード専用パレット:
  - `videoHighlight.live`: `"#E53935"` (light) / `"#FF5252"` (dark — 明るめ)
  - `videoHighlight.upcoming`: `"#2D4870"` (light) / `"#5C8DBE"` (dark — 視認性 UP)
  - `videoHighlight.trending`: `"#E53935"` (light) / `"#FF5252"` (dark) — 必ず両スキームに含める
- セマンティックカラー追加: `status.success`, `status.warning`, `status.info`
- **ダークモードスタイル適用ルール:**
  - `styled()` コールバック内: 既存の `theme.getColorSchemeSelector("dark")` パターンを継続使用（`theme.applyStyles()` は `styled()` 内で非対応）
  - `sx` prop / `styleOverrides` 内: `theme.applyStyles('dark', {...})` を使用（MUI v7 推奨）
  - 新規コードではどちらの API も混在可能だが、同一ファイル内は統一する
- `mui-styles.d.ts`: `interface CustomPalette` → `type CustomPalette = { ... }` に変換（CLAUDE.md の no-interface ルール遵守）。`status` フィールドを追加

### 1-2. VideoCard 改善

**対象:** `src/features/shared/components/Elements/Card/VideoCard.tsx`

- `backgroundColor: "white"` → `theme.vars.palette.background.paper`
- `border: 3px solid` → 廃止、`borderRadius: 12px` + `box-shadow: --shadow-card` に変更
- ホバーエフェクト追加: `translateY(-4px)` + `shadow elevation 4` + `transition: 150ms ease`
- `prefers-reduced-motion` 対応
- PlatformIconWrapper: ダークモード対応 `background: rgba(0,0,0,0.5)` + `backdropFilter: blur(4px)`
- `thumbnailOverlay` prop を追加:
  - 型: `thumbnailOverlay?: React.ReactNode`
  - レンダリング位置: `StyledCardMedia` 内の `<Image>` 直後、`PlatformIconWrapper` と同階層
  - 用途: 視聴者数バッジ、LIVE バッジ等の自由配置スロット

### 1-3. LivestreamCard 改善

**対象:** `src/features/schedule/pages/ScheduleStatus/components/LivestreamContent/LivestreamCard.tsx`

- ハードコード `#ff0000` / `#2D4870` → `theme.vars.palette.customColors.videoHighlight.*` 参照
- サムネイル上に LIVE バッジ追加（パルスドット + "LIVE" テキスト、backdrop-filter）→ `thumbnailOverlay` prop 経由で VideoCard に渡す
- 視聴者数オーバーレイ（`thumbnailOverlay` prop 経由）
- `TitleTypography`: `lineHeight: 1.2` → `1.5`、`height: 2.4em` → `3.0em`
- `CreatorTypography`: `lineHeight: 1.2` → `1.4`
- 時間表示: `fontWeight: 600` に強化、ライブ時は赤ドット `::before` 付き

### 1-4. ステータス差別化

- **LIVE:** サブトルなグロー (`box-shadow: 0 0 0 2px rgba(229,57,53,0.3)`)、サムネ LIVE バッジ（パルスアニメーション）、視聴者数
- **UPCOMING:** カウントダウン表示「あと 2h 15m」、通常シャドウ
- **ARCHIVE:** サムネイル `filter: saturate(0.7)` + `opacity: 0.85`、再生回数表示

### 1-5. HighlightedVideoChip 改善

**対象:** `src/features/shared/components/Elements/Chip/HighlightedVideoChip.tsx`

- ライブ時: パルスアニメーション（`@keyframes livePulse`）
- `fontSize: "15px"` → `"0.75rem"` に統一

---

## Phase 2: ナビゲーション + スケルトンローディング + ライブセクション

### 2-1. ボトムナビゲーション再設計

**対象:** `src/features/shared/components/Layout/Navigation.tsx`, `src/constants/navigation.ts`

- **型設計:** `bottomNavigationRoutes` の型を `NavigationRouteId[]` から `BottomNavItem[]` に変更
  - `type BottomNavItem = NavigationRouteId | "more"`
  - `"more"` は `getNavigationRouteInfo()` ではなく専用の render path で処理
- `bottomNavigationRoutes`: `["list", "clip", "freechat", "more"]`
- `"more"` タップでドロワーを開く（ルート遷移ではない）— `onDrawerToggle` コールバックを prop として受け取る
- ラベル短縮: 「リスト」→「配信」
- Multiview はドロワー内に移動
- `DrawerIcon` に `"more"` ケース追加（`MoreHorizIcon`）
- 翻訳キー追加: `bottomNav.pages.freechat`, `bottomNav.pages.more`

**対象:** `src/features/shared/components/Layout/ContentLayout.tsx`, `src/features/shared/components/Layout/Header.tsx`

- ドロワーの状態管理を ContentLayout に引き上げ:
  - `ContentLayout` で `const [drawerOpen, setDrawerOpen] = useState(false)` を管理
  - `Header` の props に `drawerOpen: boolean`, `onDrawerToggle: () => void` を追加
  - `Header` から内部の `useState` と `CustomDrawer` レンダリングを削除
  - `CustomDrawer` は `ContentLayout` でレンダリング
  - `CustomBottomNavigation` に `onDrawerToggle: () => void` を追加

### 2-2. ヘッダー改善（デスクトップ）

**対象:** `src/features/shared/components/Layout/Header.tsx`

- `md` 以上: ハンバーガーメニュー → インラインタブナビ（配信/クリップ/フリチャ/マルチビュー）— `useMediaQuery(theme.breakpoints.up('md'))` で切替
- 検索アイコン追加（DateSearchDialog へのグローバルアクセス）
- 設定ポップオーバー（テーマ切替・言語・タイムゾーンのクイックアクセス）— MUI `Popover` 使用
- `sm` 以下: 現状のハンバーガーメニュー維持（ただし `drawerOpen`/`onDrawerToggle` は外部 prop）

### 2-3. スケルトンローディング

**新規:** `src/features/shared/components/Elements/Skeleton/VideoCardSkeleton.tsx`

- MUI `Skeleton` の `animation="wave"` 使用
- サムネイル: `variant="rectangular"` (16:9 aspect ratio)
- テキスト行: `variant="text"` (タイトル、クリエイター名)
- アバター: `variant="circular"` (32px)

**新規:** `src/features/shared/components/Elements/Skeleton/LivestreamGridSkeleton.tsx`

- 6-8 個の VideoCardSkeleton を Grid 配置

**対象:** `src/features/schedule/pages/ScheduleStatus/presenter.tsx`

- `LoadingOverlay` styled component を削除
- コンテンツ `Box` の `opacity`/`visibility` トグルロジック（現行 104-110 行）を削除
- `isLoading` 時は `<LivestreamGridSkeleton />` を表示、`!isLoading` 時は MUI `Fade` (`timeout={300}`) でコンテンツ表示
- **SSR 考慮:** サーバーサイドでは `isLoading = false`（SSR props でデータ取得済み）なので、初回レンダリングでスケルトンは表示されない。スケルトンはクライアントサイドのタブ切替（`router.push` による再フェッチ）時にのみ表示される

### 2-4. 「Now Live」セクション

**対象:** `src/features/schedule/pages/ScheduleStatus/components/LivestreamContent/presenter.tsx`

- `statusFilter === "all"` 時にページ上部に「現在配信中」セクション表示
- 横スクロール (`overflow-x: auto`, `scroll-snap-type: x mandatory`)
- ライブ配信カードをやや大きめに表示
- ライブ配信が 0 件の時はセクション非表示
- タイムブロックヘッダーに配信数バッジ追加

---

## Phase 3: フルトークンアーキテクチャ + タイポグラフィ + Web フォント

### 3-1. 3 層トークンアーキテクチャ実装

**対象:** `src/styles/globals.css`

- `:root` に CSS Custom Properties 定義:
  - Base Palette: `--palette-purple-100`, `--palette-ink-900` など（OKLch 値）
  - Semantic Tokens: `--token-accent`, `--token-live`, `--token-canvas` など
  - Component Tokens: `--color-accent`, `--color-live`, `--color-background` など
  - Radius: `--radius-sm(8px)` / `--radius-md(14px)` / `--radius-lg(20px)` / `--radius-xl(24px)` / `--radius-2xl(32px)`
  - Shadow: `--shadow-card` / `--shadow-action` / `--shadow-hero` / `--shadow-focus`
  - Motion: `--duration-fast(150ms)` / `--duration-md(300ms)` / `--ease-standard`
- `.dark` クラスセレクタでダークモード用トークンオーバーライド（MUI の `colorSchemeSelector: "class"` が `<html class="dark">` を設定するため一致する）
- **MUI CSS 変数との境界:**
  - MUI 管理の変数（`--mui-palette-*`）は MUI テーマ経由で参照（`theme.vars.palette.*`）
  - カスタムトークン（`--palette-*`, `--token-*`, `--color-*`）は非 MUI コンテキスト（globals.css のユーティリティ、将来的な非 MUI コンポーネント）で使用
  - コンポーネントコードでは `theme.vars.*` を優先し、CSS Custom Properties の直接参照は避ける
  - Phase 1 で導入した `theme.vars.palette.customColors.*` 参照はそのまま維持（トークンに置き換えない）

### 3-2. タイポグラフィ改善

**対象:** `src/context/Theme.tsx`

- テーマの `typography` にベースライン設定:
  - `body1`: `fontSize: "0.875rem"`, `lineHeight: 1.5`
  - `body2`: `fontSize: "0.8rem"`, `lineHeight: 1.4`
  - `caption`: `fontSize: "0.75rem"`, `lineHeight: 1.4`
  - `h5`: `fontSize: "1.25rem"`, `fontWeight: 600`, `lineHeight: 1.4`
  - `h6`: `fontSize: "1rem"`, `fontWeight: 600`, `lineHeight: 1.4`
- 見出しのレスポンシブ対応: `responsiveFontSizes()` は使用しない（CSS variables モードと互換性が低い）。代わりに `createTheme` 内でブレークポイント別オーバーライドを定義:
  ```
  h5: {
    fontSize: "1.25rem",
    [theme.breakpoints.down('sm')]: { fontSize: "1.1rem" },
  }
  ```

**対象:** `src/features/shared/components/Layout/Header.tsx`

- `StyledSubtitle` の `fontSize: "0.5rem"` → `"0.7rem"` (10px 最小サイズ違反修正)

### 3-3. Web フォント導入

**対象:** `src/pages/_document.tsx`

- `<link rel="preconnect">` + Google Fonts CSS:
  - 本文: `Noto Sans JP` (400/500/700)
  - 見出し: `M PLUS Rounded 1c` (500/700)
  - `display=swap` で FOIT 防止
- クリティカルフォントウェイトに `<link rel="preload">` 追加
- **Cloudflare Workers CSP 確認:** デプロイ前に `fonts.googleapis.com` と `fonts.gstatic.com` が `style-src` / `font-src` ディレクティブで許可されているか確認。CSP ヘッダーがある場合は Cloudflare Workers の設定を更新

**対象:** `src/context/Theme.tsx`

- `typography.fontFamily`: `'"Noto Sans JP", "Hiragino Kaku Gothic Pro", system-ui, sans-serif'`
- `h1-h4.fontFamily`: `'"M PLUS Rounded 1c", "Noto Sans JP", sans-serif'`

---

## Phase 4: ページ固有 UX + インタラクション

### 4-1. サイトニュース: テーブル → カード化

**対象:** `src/features/site-news/pages/SiteNewsPage/presenter.tsx`

- `Table` (minWidth: 650) → `Grid` + `Card` レイアウト
- タグフィルター: 上部に Chip 行、クリックでフィルタリング
- モバイル 1 列 / デスクトップ 2 列
- 各カード: タイトル (Typography h6)、日付 (caption)、タグ (Chip 行)

### 4-2. クリップ: タブナビ追加

**対象:** `src/features/clips/pages/ClipsHome/presenter.tsx`

- 上部にタブバー: All / YouTube / Shorts / Twitch
- **「All」タブ:** 現在のマルチセクション・カルーセルレイアウトを維持（各プラットフォームのセクション + 「もっと見る」ボタン）
- **プラットフォームタブ:** `router.push` で既存サブページ（`/clips/youtube/` 等）へ SSR ナビゲーション。クライアントサイドフィルタリングではない（各サブページが独自の SSR データを持つため）
- Shorts サブページ: グリッドを `xs: 4`（3 カラム）に変更して縦長コンテンツに最適化

### 4-3. フリチャ: グルーピング + アクティブ表示

**対象:** `src/features/freechat/pages/FreechatPage/presenter.tsx`

- ページ上部に「アクティブ X 件」カウント表示
- ステータス別グルーピング: Active → Upcoming → Archive
  - `freechat.status` フィールドは `livestreamSchema` 継承で利用可能（追加のデータ層変更不要）
  - グルーピングロジックは presenter 内でフィルタリング関数として実装
- アクティブカードに緑ドットインジケーター

### 4-4. インタラクション全般

- タブ切替: MUI `Fade` トランジション (`timeout={300}`) でコンテンツ切替
- ブレッドクラム: `/about`, `/freechat`, `/clips/*`, `/site-news/*`, `/terms`, `/privacy-policy` に追加
- FAB: スクロール方向検知で show/hide（下スクロールで非表示、上スクロールで表示）
- `prefers-reduced-motion: reduce` 時はアニメーション無効化

---

## 検証方法

### 各 Phase 共通
1. `pnpm dev` でローカル起動
2. ライト/ダークモード両方で全ページを目視確認
3. Chrome DevTools のモバイルエミュレーション (375px, 768px, 1440px) で確認
4. `./scripts/post-edit-check.sh` でリント・型チェック通過

### Phase 1 検証
- `/schedule/all` でライブ/予定/アーカイブカードの視覚差別化確認
- カードホバーでリフトエフェクト確認
- ダークモードでステータスカラーの視認性確認
- TypeScript コンパイルエラーなし（`trending` 含む全キーが両 colorScheme に存在）

### Phase 2 検証
- ボトムナビ 4 項目の動作確認（「その他」でドロワー開閉）
- デスクトップ幅でヘッダーインラインナビの表示確認
- ローディング時にスケルトンが表示されることを確認（タブ切替で発動）
- SSR 初回レンダリングでスケルトンが表示されないことを確認
- 「現在配信中」セクションの横スクロール動作確認

### Phase 3 検証
- CSS Custom Properties が `:root` に定義されていることを DevTools で確認
- `.dark` クラスのトークンオーバーライドが正しく適用されることを確認
- Web フォントが正しくロードされることを Network タブで確認
- Cloudflare Workers デプロイ時に CSP エラーが出ないことを確認
- タイポグラフィの line-height が修正されていることを確認

### Phase 4 検証
- `/site-news` がモバイルで横スクロールなく表示されることを確認
- クリップページのタブ切替が正常動作することを確認（「All」タブはカルーセル維持）
- フリチャのグルーピングとカウント表示確認
- ブレッドクラムが各ページに表示されることを確認
