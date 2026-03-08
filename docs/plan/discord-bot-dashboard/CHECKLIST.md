# Implementation Checklist: discord-bot-dashboard

Spec: `docs/plan/discord-bot-dashboard/`

---

## Phase 1: Project Scaffolding
Status: Complete

### Goal
React Router v7 + Vite + Cloudflare Workers のプロジェクトを立ち上げ、モノレポに統合する。

### Checklist
- [x] `service/bot-dashboard/` に React Router v7 プロジェクトを作成
- [x] Cloudflare Workers adapter の設定 (worker.ts + entry.server.tsx)
- [x] Tailwind CSS v4 のセットアップ (shadcn/ui base components: Button, Card)
- [x] TypeScript 設定 (tsconfig.base.json の継承)
- [x] `@vspo-lab/error` パッケージの依存追加
- [x] Zod Schema + Companion Object パターンで全ドメインモデル作成
- [x] pnpm-workspace.yaml への追加確認 (service/** で自動認識)
- [x] Feature-based architecture + internal 層構造を構築
- [x] 全ルートファイル + Page/Component Container/Presenter スタブ作成
- [x] `tsc --noEmit` パス
- [x] `react-router build` 成功

### Testing
```bash
cd service/bot-dashboard && pnpm dev
```

### Session Notes
2026-03-08
- Done: プロジェクト scaffolding 完了。4 features (auth, guild, channel, shared) の internal/domain, pages, components を Container/Presenter パターンで構築。ビルド・型チェック通過。
- Next: Phase 2 (Discord OAuth2 認証)
- Risks/TODO: shadcn/ui CLI でのコンポーネント追加は手動コピー方式。components.json は未設定。

---

## Phase 2: Authentication
Status: Complete

### Goal
Discord OAuth2 によるログイン/ログアウトを実装する。

### Checklist
- [x] セッション管理の実装 (`auth/internal/repository/session-store.server.ts`)
  - Cookie-based session (署名付き、HttpOnly、Secure)
- [x] Discord OAuth2 フロー実装
  - `routes/auth.discord.tsx` → LoginUsecase.buildAuthorizationUrl
  - `routes/auth.callback.tsx` → LoginUsecase.handleCallback (code→token→user→session)
  - `routes/auth.logout.tsx` → LogoutUsecase.execute
- [x] Discord API クライアント (`auth/internal/repository/discord-api.server.ts`)
  - exchangeCode, refreshToken, getCurrentUser, getUserGuilds
- [x] Auth guard (dashboard.tsx loader で GetCurrentUserUsecase)
- [x] Landing page (`routes/_index.tsx`) 認証済みなら /dashboard にリダイレクト
- [x] server/client コード分割対応 (index.ts / index.server.ts 分離)
- [x] tsc --noEmit + react-router build パス

### Architecture
```
routes/auth.*.tsx → auth/index.server.ts → usecase → repository → Discord API
routes/dashboard.tsx → auth/index.server.ts → GetCurrentUserUsecase (auth guard)
routes/_index.tsx → auth/index.ts (client components) + auth/index.server.ts (loader)
```

### Testing
```bash
cd service/bot-dashboard && pnpm dev
# http://localhost:5173 → Discord ログイン → /dashboard
```

### Session Notes
2026-03-08
- Done: OAuth2 full flow (login/callback/logout), session store (cookie), auth guard, Discord API repository. Feature の server/client code splitting 対応完了。
- Next: Phase 3 (Dashboard Layout & Server List)
- Risks/TODO: セッション署名は簡易実装 (btoa)。本番では Web Crypto API の HMAC に置き換えるべき。トークンリフレッシュは未使用 (API は実装済み)。

---

## Phase 3: Dashboard Layout & Server List
Status: Complete

### Goal
ログイン後のダッシュボードレイアウトとサーバー一覧を実装する。

### Checklist
- [x] Dashboard layout (`routes/dashboard.tsx`)
  - Header (UserMenu), Sidebar, Content area (slot-based DashboardLayout)
  - loader: GetCurrentUserUsecase (auth guard) + ListGuildsUsecase
- [x] Server list page (`routes/dashboard._index.tsx`)
  - useRouteLoaderData で parent から guilds 取得
  - GuildListContainer → GuildListPresenter (installed / not-installed セクション)
  - GuildCardPresenter (icon, name, Bot 招待 or 設定管理)
- [x] Sidebar (desktop lg:block, サーバー NavLink 一覧)
- [x] UserMenu (avatar + displayName + ログアウト Form)
- [x] 空状態の UI (管理権限サーバーなし)

### Session Notes
2026-03-08
- Done: guild feature の repository/usecase/pages/components 実装。ダッシュボードレイアウト完成。
- Next: Phase 4
- Risks/TODO: VspoGuildApiRepository.getBotGuildIds は mock (空 Set)。Phase 5 で接続。

---

## Phase 4: Server Detail & Channel Config
Status: Complete

### Goal
サーバー詳細画面でチャンネル設定の閲覧・変更を実装する。

### Checklist
- [x] Server detail page (`routes/dashboard.$guildId.tsx`)
  - loader: ListChannelsUsecase (mock data: 3 channels)
  - action: intent ベース (update-channel, enable-channel, disable-channel)
- [x] ChannelTable (Container/Presenter)
  - Toggle switch with optimistic UI (useFetcher)
  - 言語/メンバータイプ表示
- [x] ChannelConfigForm (Container/Presenter)
  - Modal UI with 言語 select, memberType radio, カスタムメンバー checkbox
  - Zod validation via ChannelConfig.fromFormData
- [x] MemberSelector (Container/Presenter) — checkbox list with avatar
- [x] ChannelAddForm (Container/Presenter) — select + add button
- [x] ErrorBoundary (root.tsx)
- [x] channel feature の internal 層完成 (domain, repository, usecase)

### Session Notes
2026-03-08
- Done: channel feature 全層実装。CRUD action (update/enable/disable) 実装。全コンポーネント Container/Presenter 分離完了。
- Next: Phase 5/6
- Risks/TODO: VspoChannelApiRepository は全て mock。Toast notification は未実装。

---

## Phase 5: vspo-server API Integration
Status: Blocked (waiting for vspo-server API)

### Goal
Mock data を vspo-server の実際の API に置き換える。

### Checklist
- [x] Repository 層にインターフェース定義済み
  - VspoGuildApiRepository.getBotGuildIds
  - VspoChannelApiRepository.getGuildConfig / updateChannel / enableChannel / disableChannel
- [ ] vspo-server 側の API エンドポイント実装 (別リポジトリ)
- [ ] Repository の mock → 実 API 接続に差し替え
- [ ] Creator 一覧の取得 (カスタムメンバー用)
- [x] エラーハンドリングは Result 型で統一済み

### Session Notes
2026-03-08
- Done: Repository 層は mock 実装済み。API 契約 (型・メソッド) は確定。差し替えは Repository のみで完結する設計。
- Next: vspo-server 側の API 実装後に接続
- Risks/TODO: vspo-server 側の API 実装が必要。04_API_INTERFACE.md に必要なエンドポイントを記載済み。

---

## Phase 6: Polish & Deploy
Status: Complete (local build ready)

### Goal
本番デプロイとUI仕上げ。

### Checklist
- [x] Cloudflare Workers デプロイ設定 (wrangler.toml)
- [x] 環境変数の設定 (wrangler.toml [vars] に定義)
- [x] OG / メタデータ設定 (title, description)
- [x] Landing page UI 仕上げ (Discord icon, feature cards)
- [x] ErrorBoundary (404/500)
- [x] tsc --noEmit パス
- [x] react-router build 成功 (client + server)
- [ ] biome lint 対応 (monorepo root から実行)
- [ ] knip.json にワークスペース追加

### Session Notes
2026-03-08
- Done: 全フェーズ実装完了。ビルド成功。Feature-based + Clean Architecture + Container/Presenter パターンで全コンポーネント実装。
- Next: vspo-server API 実装後に Phase 5 を完了。biome/knip の monorepo 統合。
- Risks/TODO: セッション署名の HMAC 化。トークンリフレッシュの自動化。Drawer ナビゲーション (mobile) は未実装 (Sidebar は lg:block のみ)。
