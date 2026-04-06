# Islands Architecture 移行計画

## 現状の課題

現在のbot-dashboardは全ページが SSR (`output: "server"`) で、クライアントサイドのインタラクティビティはすべて vanilla JS (`<script>` タグ) で実装されている。

### 問題点
1. **JS が巨大な monolith** — ChannelConfigForm.astro の `<script>` は 300行超。テスト困難、再利用不可
2. **DOM 操作が手動** — `querySelector`, `classList.toggle`, `addEventListener` の嵐。状態とUIの乖離が起きやすい
3. **View Transitions との相性** — `astro:page-load` で毎回 re-init が必要。AbortController のリーク可能性
4. **コンポーネント間の状態共有がない** — 例: チャンネル追加後のテーブル更新は PRG (Post-Redirect-Get) に頼っている

## Islands Architecture とは

Astro の Islands は「静的HTML海の中にインタラクティブな島を浮かべる」パターン。

```
┌─────────────────────────────────────────┐
│         Static HTML (Server)            │
│  ┌──────────┐    ┌─────────────────┐    │
│  │ React    │    │ React           │    │
│  │ Island   │    │ Island          │    │
│  │ (hydrate)│    │ (hydrate)       │    │
│  └──────────┘    └─────────────────┘    │
│                                         │
│         Static HTML continues...        │
└─────────────────────────────────────────┘
```

## 移行対象の分類

### Island 化すべきコンポーネント (client-side interactivity 必須)

| コンポーネント | 理由 | ディレクティブ |
|---------------|------|---------------|
| `ChannelConfigForm` | フォーム状態、ドロップダウン、チェックボックス連動 | `client:load` |
| `ChannelAddModal` | fetch API でチャンネル一覧取得、検索フィルタ | `client:load` |
| `DeleteChannelDialog` | 確認ダイアログの動的テキスト入れ替え | `client:load` |
| `ThemeToggle` | localStorage 連動 | `client:load` |
| `LanguageSelector` (header variant) | `<details>` の open/close | `client:idle` |
| `UserMenu` | `<details>` の open/close | `client:idle` |
| `FeaturePopup` (LP) | dialog open/close | `client:visible` |
| `FlashMessage` | auto-dismiss タイマー | `client:idle` |
| Landing page feature cards | dialog trigger | `client:visible` |
| `DigitRoll` | アニメーション (CSS-only で可能だが状態連携で React 化もあり) | `client:visible` |

### Astro コンポーネントのまま維持 (server-only)

| コンポーネント | 理由 |
|---------------|------|
| `Header` | 静的構造。slot で island を受け取るだけ |
| `Footer` | 完全に静的 |
| `Button` | 汎用UI。Astro のままで十分 |
| `IconButton` | 同上 |
| `Card` | 同上 |
| `GuildCard` | サーバーサイドで完結 |
| `ChannelTable` | テーブル描画は SSR。操作ボタンのみ island 化 |
| `ErrorAlert` | 静的表示 |
| `AvatarFallback` | 静的表示 |
| `ScrollReveal` | CSS-only アニメーション |
| `MenuItem` | 静的 |
| `Dashboard` layout | 静的構造 |
| `Base` layout | 静的構造 |

## Server Islands の活用候補

Astro の `server:defer` を使うと、ページの一部を遅延レンダリングできる。

| 候補 | 効果 |
|------|------|
| `GuildCard` のチャンネル数表示 | ギルド一覧のファーストペイントを高速化 |
| Bot Stats (LP) | LP のTTFBを改善、stats API呼び出しを遅延 |

```astro
<!-- 例: Server Island でBot統計を遅延ロード -->
<BotStats server:defer>
  <StatsPlaceholder slot="fallback" />
</BotStats>
```

## React Integration の設定

### 1. 依存追加

```bash
pnpm add @astrojs/react react react-dom
pnpm add -D @types/react @types/react-dom
```

### 2. astro.config.ts 変更

```typescript
import react from "@astrojs/react";

export default defineConfig({
  // ...existing config
  integrations: [
    react(),  // 追加
    sitemap({ ... }),
  ],
});
```

### 3. tsconfig.json 変更

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

## Island 間データ受け渡しのルール

1. **Props は serializable のみ** — React island に渡せるのは JSON シリアライズ可能な値のみ
2. **children は `<slot />` で渡す** — Astro コンポーネントの子要素は `client:*` island 内では slot 経由
3. **island 間の通信は Nano Stores** — 05_STATE_MANAGEMENT.md 参照
4. **サーバーデータは Astro ページの frontmatter で取得** → props で island に渡す

```astro
---
// サーバーサイドでデータ取得
const channels = await fetchChannels(guildId);
---

<!-- React Island にデータを props で渡す -->
<ChannelConfigForm
  client:load
  channels={channels}
  guildId={guildId}
/>
```

## 移行ステップ

> **注意**: これは Islands Architecture 移行に特化した5フェーズの概要です。
> セキュリティ・フォント最適化・CSP等を含む完全な7フェーズ実装計画は [`11_IMPLEMENTATION_PLAN.md`](./11_IMPLEMENTATION_PLAN.md) を参照してください。

### Phase 1: 基盤セットアップ
1. `@astrojs/react` integration 追加
2. `nanostores` + `@nanostores/react` 追加
3. 共通 React hooks ディレクトリ作成

### Phase 2: 小さい island から開始
1. `ThemeToggle` → React (`client:load`)
2. `FlashMessage` → React (`client:idle`)
3. `FeaturePopup` dialog → React (`client:visible`)

### Phase 3: 大きなフォーム系
1. `ChannelConfigForm` → React (`client:load`)
2. `ChannelAddModal` → React (`client:load`)
3. `DeleteChannelDialog` → React (`client:load`)

### Phase 4: 状態管理統合
1. Nano Stores でチャンネルデータ共有
2. PRG パターンから楽観的UIへ

### Phase 5: クリーンアップ
1. vanilla JS ファイル削除 (`dialog-helpers.ts`, `close-on-outside-click.ts`, `theme.ts`)
2. `astro:page-load` イベントハンドラ削除
3. `<script>` タグ整理
