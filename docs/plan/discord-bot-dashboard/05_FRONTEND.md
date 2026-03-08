# Discord Bot Dashboard - Frontend

## Overview

React Router v7 (Framework mode) + Vite で構築する SPA/SSR ハイブリッドアプリ。
Cloudflare Workers 上で動作し、server-side loader/action で BFF パターンを実現する。

## Route Structure

```
routes/
  _index.tsx              # Landing page (未ログイン → ログイン誘導)
  auth.discord.tsx        # Discord OAuth2 redirect
  auth.callback.tsx       # OAuth2 callback handler
  auth.logout.tsx         # Logout action
  dashboard.tsx           # Dashboard layout (header, sidebar, auth guard)
  dashboard._index.tsx    # Server list (default dashboard view)
  dashboard.$guildId.tsx  # Server detail / channel config
```

## Page Designs

### Landing Page (`/`)

- Hero section with Bot の説明
- 「Discord でログイン」ボタン (CTA)
- ログイン済みの場合は `/dashboard` にリダイレクト

### Dashboard Layout (`/dashboard`)

- **Header**: ユーザーアバター + 名前、ログアウトボタン
- **Sidebar** (desktop) / **Drawer** (mobile): サーバー一覧ナビゲーション
- **Content area**: 子ルートの内容

### Server List (`/dashboard`)

- Bot 導入済みサーバーをカード形式で一覧表示
  - サーバーアイコン、名前、有効チャンネル数
  - クリックで詳細画面へ
- Bot 未導入サーバーは別セクションに表示
  - 「Bot を追加」ボタン (Discord の Bot 招待 URL)

### Server Detail (`/dashboard/:guildId`)

- **Server info header**: サーバーアイコン、名前
- **Channel list**: テーブル or カード形式
  - チャンネル名、Bot 有効/無効トグル、言語、メンバータイプ
  - 行クリック or 編集ボタンで設定パネルを開く
- **Channel config panel** (Sheet / Modal):
  - 言語選択 (Select)
  - メンバータイプ選択 (Radio group)
  - カスタムメンバー選択 (Checkbox list with avatar + name, `memberType=custom` 時のみ表示)
  - 保存ボタン、キャンセルボタン
- **Add channel section**:
  - Bot 未追加のテキストチャンネルを選択して追加

## Design Patterns

### Feature-Based Architecture + Clean Architecture

機能ドメインごとにディレクトリを分割し、各 feature が `internal/` に domain・usecase・repository を内包する。
feature の公開 API は `index.ts` のみで、`internal/` は外部から直接参照禁止。

### Internal Layer Structure (per feature)

```
feature/
  index.ts                 # 公開 API (re-export のみ。internal を直接露出しない)
  internal/
    domain/                # Zod Schema + Companion Object (純粋な型とビジネスルール)
    usecase/               # ユースケース関数 (domain + repository を組み合わせる)
    repository/            # 外部データアクセス (Discord API, vspo-server API, session)
```

### Companion Object Pattern

型定義と関連ロジックを Zod Schema + namespace で一体化する。
`class` は使わず、関数型 + type-safe なアプローチを徹底する。

```typescript
// domain/guild.ts
const GuildSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  isAdmin: z.boolean(),
  botInstalled: z.boolean(),
});
type GuildSummary = z.infer<typeof GuildSummarySchema>;

/** GuildSummary のコンパニオンオブジェクト */
const GuildSummary = {
  schema: GuildSummarySchema,
  /** Discord API レスポンスからパースする */
  fromDiscordGuild: (raw: unknown): Result<GuildSummary, AppError> =>
    wrap(() => GuildSummarySchema.parse(transformDiscordGuild(raw))),
  /** Bot 招待 URL を生成する */
  inviteUrl: (guild: GuildSummary): string =>
    `https://discord.com/oauth2/authorize?...&guild_id=${guild.id}`,
  /** 管理可能なサーバーのみフィルタ */
  filterManageable: (guilds: readonly GuildSummary[]): GuildSummary[] =>
    guilds.filter(g => g.isAdmin),
} as const;
```

### Presenter / Container Pattern

pages (ルートレベル) と components (再利用可能) の両方で Presenter/Container を分離する。

- **Container**: usecase を呼び出してデータを取得・変換し、Presenter に渡す。副作用・ロジックを担当。
- **Presenter**: props のみに依存する純粋な表示コンポーネント。状態・副作用を持たない。テスタブル。

```
route file (loader/action) → Page Container → Page Presenter
                                                  └→ Component Container → Component Presenter
```

Container は usecase のみを参照し、internal の domain/repository を直接参照しない。

## Directory Structure

```
app/
  features/
    auth/                              # 認証機能
      index.ts                         # 公開 API (usecase, pages, components の re-export)
      internal/
        domain/
          discord-user.ts              # DiscordUser schema + companion object
          session.ts                   # Session schema + companion object
        usecase/
          login.server.ts              # OAuth2 login flow
          logout.server.ts             # Session destroy
          get-current-user.server.ts   # セッションからユーザー取得
        repository/
          discord-api.server.ts        # Discord OAuth2/User API
          session-store.server.ts      # Session persistence (KV/cookie)
      pages/
        Landing/
          container.tsx                # auth guard check, redirect logic
          presenter.tsx                # Hero + Login CTA
        Callback/
          container.tsx                # code → session creation
      components/
        LoginButton/
          container.tsx
          presenter.tsx
        UserMenu/
          container.tsx                # logout action handler
          presenter.tsx                # avatar + dropdown
    guild/                             # サーバー管理機能
      index.ts                         # 公開 API
      internal/
        domain/
          guild.ts                     # GuildSummary schema + companion object
          guild-bot-config.ts          # GuildBotConfig schema + companion object
        usecase/
          list-guilds.server.ts        # ユーザーの管理可能サーバー一覧取得
          get-guild-detail.server.ts   # サーバー詳細 + Bot設定取得
        repository/
          discord-guild-api.server.ts  # Discord Guild API
          vspo-guild-api.server.ts     # vspo-server Guild config API
      pages/
        GuildList/
          container.tsx                # usecase → GuildSummary[] → presenter
          presenter.tsx                # Card grid (installed / not-installed sections)
      components/
        GuildCard/
          presenter.tsx                # Single guild card (pure)
        GuildHeader/
          presenter.tsx                # Server detail header (pure)
    channel/                           # チャンネル設定機能
      index.ts                         # 公開 API
      internal/
        domain/
          channel-config.ts            # ChannelConfig schema + companion object
          member-type.ts               # MemberType enum + companion object
        usecase/
          list-channels.server.ts      # チャンネル設定一覧取得
          update-channel.server.ts     # チャンネル設定更新
          toggle-channel.server.ts     # Bot 有効化/無効化
        repository/
          vspo-channel-api.server.ts   # vspo-server Channel API
      pages/
        GuildDetail/
          container.tsx                # usecase → channel list + form actions
          presenter.tsx                # Channel table + config panel layout
      components/
        ChannelTable/
          container.tsx                # toggle handler (useFetcher)
          presenter.tsx                # Table rendering
        ChannelConfigForm/
          container.tsx                # form validation, submit via usecase
          presenter.tsx                # Form UI (select, radio, checkbox)
        MemberSelector/
          container.tsx                # creator filtering logic
          presenter.tsx                # Checkbox list with avatars
        ChannelAddForm/
          container.tsx                # available channel filtering
          presenter.tsx                # Channel select + add button
    shared/                            # Feature 横断の共有コード
      index.ts                         # 公開 API
      internal/
        domain/
          creator.ts                   # Creator schema + companion object
          result.ts                    # Result type helpers
        repository/
          vspo-api-base.server.ts      # vspo-server API base client
      components/
        ui/                            # shadcn/ui base components (Button, Card, etc.)
        layout/
          Header/
            container.tsx
            presenter.tsx
          Sidebar/
            container.tsx
            presenter.tsx
          DashboardLayout.tsx           # layout shell (純粋な slot 配置)
  routes/
    _index.tsx                         # → auth.pages.Landing container
    auth.discord.tsx                   # loader → auth.usecase.login
    auth.callback.tsx                  # loader → auth.usecase.login (callback)
    auth.logout.tsx                    # action → auth.usecase.logout
    dashboard.tsx                      # layout → shared.components.layout + auth guard
    dashboard._index.tsx               # → guild.pages.GuildList container
    dashboard.$guildId.tsx             # → channel.pages.GuildDetail container
```

### Feature の公開 API パターン

各 feature の `index.ts` は usecase・pages・components のみを re-export する。
internal の domain/repository は外部に公開しない。

```typescript
// features/guild/index.ts
export { GuildListContainer } from "./pages/GuildList/container";
export { GuildCard } from "./components/GuildCard/presenter";
export { GuildHeader } from "./components/GuildHeader/presenter";
// usecase は server-only なので .server.ts suffix
export { listGuilds } from "./internal/usecase/list-guilds.server";
export { getGuildDetail } from "./internal/usecase/get-guild-detail.server";
```

### Feature 間の依存ルール

```
auth    → shared (共有型・ユーティリティのみ)
guild   → shared
channel → shared

routes  → features (index.ts 経由のみ)
feature/pages      → 同一 feature の usecase + components
feature/components → 同一 feature の usecase (container のみ)
feature/usecase    → 同一 feature の domain + repository
feature/domain     → 外部依存なし (pure)
feature/repository → 外部 API のみ

※ feature 間の直接依存は禁止
※ internal/ の直接 import は禁止 (index.ts 経由のみ)
```

## State Management

- **Server state**: Route の loader/action で取得 → Container に `useLoaderData` / `useActionData` で渡す
- **Form state**: Container が `<Form>` + `useNavigation` を管理し、Presenter に props で渡す
- **Optimistic UI**: Container 内で `useFetcher` を使い、Presenter には楽観的データを渡す
- **Client state**: Presenter は props のみ。Container 内で最小限の `useState` (モーダル open/close 等)

## UI Library Decision

**Tailwind CSS + shadcn/ui** を採用する。

理由:
- React Router v7 + Vite との相性が良い
- MUI は Next.js + Emotion に最適化されており、React Router では設定が煩雑
- shadcn/ui は copy-paste パターンでバンドルサイズが小さく、CF Workers に適している
- Tailwind は Vite のビルドパイプラインに自然に統合される

## Responsive Design

- **Desktop (>= 1024px)**: サイドバー常時表示 + コンテンツエリア
- **Tablet (768-1023px)**: サイドバー折りたたみ可能
- **Mobile (< 768px)**: Drawer ナビゲーション + フルワイドコンテンツ

## Error Handling

- loader/action のエラーは React Router の `ErrorBoundary` で処理
- API エラーは `@vspo-lab/error` の Result 型で統一
- 認証エラー → `/` にリダイレクト
- 権限エラー → 403 ページ表示
- ネットワークエラー → リトライ可能なエラー表示

## Accessibility

- shadcn/ui の Radix UI ベースコンポーネントで ARIA 対応
- キーボードナビゲーション対応
- Color contrast: WCAG AA 準拠

## Performance

- SSR (loader) でデータ取得し、初期描画を高速化
- `clientLoader` は不使用 (すべて server-side で処理)
- Code splitting: React Router の route-based splitting
- CF Workers Edge で低レイテンシ
