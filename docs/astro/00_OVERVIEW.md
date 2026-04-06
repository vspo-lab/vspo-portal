# bot-dashboard 改善計画 Overview

## 現状のアーキテクチャ

| 項目 | 現状 |
|------|------|
| フレームワーク | Astro (SSR, `output: "server"`) |
| デプロイ先 | Cloudflare Workers (`@astrojs/cloudflare`) |
| CSS | Tailwind CSS v4 (`@tailwindcss/vite`) |
| i18n | Astro built-in (`defaultLocale: "ja"`, `locales: ["ja", "en"]`) + 自前辞書 (`dict.ts`) |
| ページ遷移 | `<ClientRouter />` (View Transitions) + `prefetch: "viewport"` |
| 認証 | Discord OAuth2 (middleware + session) |
| サーバーアクション | Astro Actions (`defineAction`, `accept: "form"`) |
| クライアント JS | **vanilla JS** (`<script>` タグ内、AbortController パターン) |
| 状態管理 | なし (DOM 操作で完結) |
| テスト | vitest (設定あり、テスト未確認) |

## ディレクトリ構造 (feature-based)

```
src/
  actions/index.ts          # Astro Actions (addChannel, updateChannel, etc.)
  features/
    auth/                   # Discord OAuth
      components/UserMenu.astro
      domain/discord-user.ts
      repository/discord-api.ts
      usecase/login.ts
    channel/                # チャンネル設定 CRUD
      components/ChannelTable.astro, ChannelConfigForm.astro,
                 ChannelAddModal.astro, DeleteChannelDialog.astro
      domain/channel-config.ts, member-type.ts
      repository/vspo-channel-api.ts
      usecase/add-channel.ts, delete-channel.ts
    guild/                  # サーバー一覧
      components/GuildCard.astro
      domain/guild.ts
      repository/vspo-guild-api.ts
      usecase/list-guilds.ts
    shared/                 # 共通 UI
      components/Button.astro, Card.astro, Header.astro, Footer.astro,
                 FlashMessage.astro, ErrorAlert.astro, ThemeToggle.astro,
                 LanguageSelector.astro, MenuItem.astro, IconButton.astro,
                 AvatarFallback.astro, dialog-helpers.ts,
                 close-on-outside-click.ts, theme.ts
      domain/creator.ts
    landing/                # LP 専用
      components/FeaturePopup.astro, DigitRoll.astro, ScrollReveal.astro
    announcement/           # お知らせデータ
      data/announcements.ts
  i18n/dict.ts              # ja/en 辞書 + t() ヘルパー
  layouts/Base.astro, Dashboard.astro
  middleware.ts             # セキュリティヘッダー + 認証 + トークンリフレッシュ
  pages/                    # ルーティング
    index.astro             # LP (未認証) / リダイレクト (認証済み)
    404.astro
    auth/discord.ts, callback.ts, logout.ts
    api/change-locale.ts, guilds/[guildId]/channels.ts
    dashboard/index.astro, [guildId].astro, announcements.astro,
              [guildId]/announcements.astro
```

## 改善の方針

1. **Feature-based 構造は維持** — 現在の `features/` ディレクトリ設計は Clean Architecture に沿っており良好
2. **Islands Architecture を並行導入** — インタラクティブ部分のみ React Island 化
3. **vanilla JS を React コンポーネントに段階的に置換** — `client:load` / `client:idle` / `client:visible` ディレクティブ活用
4. **Nano Stores で island 間状態共有** — `@nanostores/react` 併用
5. **Astro ベストプラクティスへの準拠** — CSP, Server Islands, Content Layer 等
6. **Astro 組み込み機能の活用** — Sessions API, `astro:env` 型安全環境変数, `<Image>` / `<Picture>` 最適化, Cloudflare bindings

## ドキュメント一覧

| ファイル | 内容 |
|---------|------|
| [01_ISLANDS_ARCHITECTURE.md](./01_ISLANDS_ARCHITECTURE.md) | Islands Architecture 移行計画 |
| [02_REACT_MIGRATION.md](./02_REACT_MIGRATION.md) | vanilla JS → React 移行の全コンポーネント詳細 |
| [03_PAGE_IMPROVEMENTS.md](./03_PAGE_IMPROVEMENTS.md) | 全ページごとの改善点 |
| [04_COMPONENT_IMPROVEMENTS.md](./04_COMPONENT_IMPROVEMENTS.md) | 全コンポーネントの改善点 |
| [05_STATE_MANAGEMENT.md](./05_STATE_MANAGEMENT.md) | Nano Stores による状態管理設計 |
| [06_PERFORMANCE.md](./06_PERFORMANCE.md) | パフォーマンス最適化 |
| [07_I18N.md](./07_I18N.md) | i18n 改善 |
| [08_ACCESSIBILITY.md](./08_ACCESSIBILITY.md) | アクセシビリティ改善 |
| [09_SECURITY.md](./09_SECURITY.md) | セキュリティ改善 |
| [10_TESTING.md](./10_TESTING.md) | テスト戦略 |
| [11_IMPLEMENTATION_PLAN.md](./11_IMPLEMENTATION_PLAN.md) | 実装順序と依存関係 |
| [12_CLOUDFLARE_INTEGRATION.md](./12_CLOUDFLARE_INTEGRATION.md) | Cloudflare Workers 統合改善 |
| [13_FONTS_OPTIMIZATION.md](./13_FONTS_OPTIMIZATION.md) | フォント最適化 (Astro 6 fonts) |
| [14_CONTENT_COLLECTIONS.md](./14_CONTENT_COLLECTIONS.md) | Content Collections 移行 |
| [15_MIDDLEWARE_PATTERNS.md](./15_MIDDLEWARE_PATTERNS.md) | Middleware パターン改善 |
| [16_ADVANCED_FEATURES.md](./16_ADVANCED_FEATURES.md) | 高度な Astro 機能の活用 |
| [17_ACTIONS_PATTERNS.md](./17_ACTIONS_PATTERNS.md) | Astro Actions パターン改善 |
| [18_SESSION_MANAGEMENT.md](./18_SESSION_MANAGEMENT.md) | セッション管理の改善 |
| [19_CSP_BUILTIN.md](./19_CSP_BUILTIN.md) | Astro 6 ビルトイン CSP |
