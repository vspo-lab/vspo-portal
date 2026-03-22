# 05: フロントエンド UI 仕様 — bot-dashboard UI 全面改善

## 1. 日本語翻訳の実装

### 1.1 `src/i18n/dict.ts` — ja 辞書の翻訳

現在の `ja` 辞書は全て英語テキスト。以下の日本語に置き換える:

```typescript
const ja = {
  // Common
  "app.name": "Spodule Bot",
  "app.title": "Spodule Bot ダッシュボード",

  // Login page
  "login.title": "ログイン",
  "login.description":
    "Discord Bot の配信通知設定を Web から簡単に管理。チャンネルごとの言語やメンバーフィルターを一目で確認・編集できます。",
  "login.button": "Discord でログイン",
  "login.feature.list": "一覧管理",
  "login.feature.list.desc": "サーバーやチャンネルの設定を一目で確認",
  "login.feature.filter": "メンバーフィルター",
  "login.feature.filter.desc":
    "JP・EN・カスタム設定で通知対象を細かく調整",
  "login.feature.realtime": "即時反映",
  "login.feature.realtime.desc":
    "Web からの変更がすぐに Bot に反映されます",

  // Dashboard
  "dashboard.servers": "サーバー一覧",
  "dashboard.servers.desc":
    "Bot が導入されているサーバーの設定を管理します。",
  "dashboard.installed": "Bot 導入済み",
  "dashboard.notInstalled": "Bot 未導入",
  "dashboard.noServers": "管理権限のあるサーバーがありません。",
  "dashboard.allServers": "すべてのサーバー",
  "dashboard.channelsEnabled": "{enabled}/{total} チャンネル有効",
  "dashboard.error": "エラー: {message}",

  // Guild
  "guild.serverTitle": "サーバー {guildId}",
  "guild.active": "導入済み",
  "guild.manageSettings": "設定を管理",
  "guild.addBot": "Bot を追加",

  // Channel table
  "channel.name": "チャンネル",
  "channel.enabled": "有効",
  "channel.language": "言語",
  "channel.members": "メンバー",
  "channel.actions": "操作",
  "channel.disable": "無効にする",
  "channel.enable": "有効にする",
  "channel.edit": "編集",
  "channel.delete": "削除",
  "channel.empty": "設定されたチャンネルはありません。",
  "channel.table": "チャンネル設定",
  "channel.deleteConfirm": "このチャンネルの設定を削除しますか？",

  // Channel config form
  "channelConfig.title": "#{channelName} の設定",
  "channelConfig.language": "言語",
  "channelConfig.language.ja": "日本語",
  "channelConfig.language.en": "英語",
  "channelConfig.memberType": "メンバータイプ",
  "channelConfig.customMembers": "カスタムメンバー",
  "channelConfig.close": "閉じる",
  "channelConfig.cancel": "キャンセル",
  "channelConfig.save": "保存",

  // Navigation
  "nav.sidebar": "サーバーナビゲーション",
  "nav.menu": "メニュー",

  // Member types
  "memberType.vspo_jp": "ぶいすぽっ! JP",
  "memberType.vspo_en": "ぶいすぽっ! EN",
  "memberType.all": "全メンバー",
  "memberType.custom": "カスタム",

  // Error
  "error.auth_failed": "Discord 認証に失敗しました。もう一度お試しください。",
  "error.no_code": "認証コードが見つかりません。もう一度お試しください。",
  "error.fetch_failed":
    "ユーザー情報の取得に失敗しました。もう一度お試しください。",
  "error.invalid_state": "無効な認証リクエストです。もう一度お試しください。",

  // Auth
  "auth.logout": "ログアウト",

  // Settings (new)
  "settings.theme": "テーマ",
  "settings.theme.light": "ライト",
  "settings.theme.dark": "ダーク",
  "settings.theme.system": "システム",
  "settings.language": "言語",
  "settings.language.ja": "日本語",
  "settings.language.en": "English",
} as const;
```

### 1.2 en 辞書の更新

`en` 辞書にも `channel.delete`, `channel.deleteConfirm`, `settings.*` キーを追加:

```typescript
// 追加キー
"channel.delete": "Delete",
"channel.deleteConfirm": "Are you sure you want to delete this channel's settings?",
"settings.theme": "Theme",
"settings.theme.light": "Light",
"settings.theme.dark": "Dark",
"settings.theme.system": "System",
"settings.language": "Language",
"settings.language.ja": "日本語",
"settings.language.en": "English",
```

---

## 2. ライトモード / ダークモード対応

### 2.1 `src/app.css` — テーマ CSS 変数

現在はダークモードの色しか定義されていない。ライトモード用 CSS 変数を追加し、
`dark` class の有無で切り替える。

```css
@import "tailwindcss";

@theme {
  /* === Brand Colors === */
  --color-vspo-purple: #7266cf;
  --color-discord: #5865f2;

  /* === Radius === */
  --radius: 12px;
  --radius-sm: 8px;

  /* === Shadows === */
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-action: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-hover: 0 8px 16px rgba(0, 0, 0, 0.12);
  --shadow-focus: 0 0 0 3px rgba(114, 102, 207, 0.6);

  /* === Typography === */
  --font-sans: "Noto Sans JP", "Hiragino Kaku Gothic Pro", system-ui, sans-serif;
  --font-heading: "M PLUS Rounded 1c", "Noto Sans JP", sans-serif;

  /* === Motion === */
  --duration-fast: 150ms;
  --ease-standard: cubic-bezier(0.2, 0.7, 0.2, 1);
}

/* === Light Mode (default) === */
:root {
  --color-background: #ffffff;
  --color-foreground: #1a1a1a;
  --color-card: #ffffff;
  --color-card-foreground: #1a1a1a;
  --color-primary: #7266cf;
  --color-primary-foreground: #ffffff;
  --color-secondary: #f5f5f5;
  --color-secondary-foreground: #1a1a1a;
  --color-muted: #f5f5f5;
  --color-muted-foreground: rgba(0, 0, 0, 0.6);
  --color-accent: #ececec;
  --color-accent-foreground: #1a1a1a;
  --color-destructive: #e53935;
  --color-destructive-foreground: #ffffff;
  --color-border: rgba(0, 0, 0, 0.12);
  --color-input: rgba(0, 0, 0, 0.08);
  --color-ring: #7266cf;
}

/* === Dark Mode === */
.dark {
  --color-background: #121212;
  --color-foreground: rgba(255, 255, 255, 0.87);
  --color-card: #242424;
  --color-card-foreground: rgba(255, 255, 255, 0.87);
  --color-primary: #7266cf;
  --color-primary-foreground: #ffffff;
  --color-secondary: #2d2d2d;
  --color-secondary-foreground: rgba(255, 255, 255, 0.87);
  --color-muted: #2d2d2d;
  --color-muted-foreground: rgba(255, 255, 255, 0.7);
  --color-accent: #363636;
  --color-accent-foreground: rgba(255, 255, 255, 0.87);
  --color-destructive: #e53935;
  --color-destructive-foreground: #ffffff;
  --color-border: rgba(255, 255, 255, 0.2);
  --color-input: rgba(255, 255, 255, 0.12);
  --color-ring: #7266cf;
}
```

### 2.2 テーマ管理

**方針:** クライアントサイド JS（インラインスクリプト）でテーマを管理。
localStorage に保存し、`<html>` タグの `class` を切り替える。

**`Base.astro` の変更:**
- `class="dark"` のハードコードを削除
- インラインスクリプトで localStorage / system preference を読んで class を設定
- FOUC（Flash of Unstyled Content）防止のため `<head>` 内でブロッキング実行

```html
<script is:inline>
  (function() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  })();
</script>
```

### 2.3 テーマトグル UI

**配置:** ヘッダー右側、UserMenu の左隣

**UI:** アイコンボタン（太陽 / 月アイコン）
- ライトモード時: 月アイコン表示（「ダークモードに切り替え」）
- ダークモード時: 太陽アイコン表示（「ライトモードに切り替え」）

**実装:** `src/components/ui/ThemeToggle.astro`
- インラインスクリプトで `localStorage.setItem('theme', ...)` + class 切り替え
- `<button>` 要素、JS のみで動作（サーバーリクエスト不要）

---

## 3. 言語切り替え UI

### 3.1 ヘッダーへの配置

**配置:** ヘッダー右側、テーマトグルの左隣

**UI:** セレクターまたはボタン
- 「日本語 / EN」のようなシンプルなトグル
- 現在の言語をハイライト

### 3.2 実装方針

**`src/components/ui/LanguageSelector.astro`:**
- `<form method="post" action={actions.changeLocale}>` でサーバーサイド処理
- セッションに locale を保存 → ページリロードで反映

**`src/actions/index.ts` に追加:**
```typescript
changeLocale: defineAction({
  accept: "form",
  input: z.object({
    locale: z.enum(["ja", "en"]),
  }),
  handler: async (input, context) => {
    requireAuth(context);
    context.session?.set("locale", input.locale);
  },
}),
```

### 3.3 ログイン前の言語切り替え

- ログインページにも言語切り替えを配置
- 未ログイン時はセッションに locale のみ保存（ユーザー情報不要）
- `middleware.ts` の `requireAuth` チェックを `changeLocale` Action では省略

---

## 4. サーバーカードのチャンネル情報表示

### 4.1 GuildCard の改善

**追加表示項目:**
- 有効チャンネル数 / 総チャンネル数（例: 「3/5 チャンネル有効」）
- 有効チャンネル名のリスト（最大3件表示、超過時は「+N 件」）

**データ取得:**
- `ListGuildsUsecase` の返り値に各ギルドのチャンネルサマリーを追加
- `GuildSummaryType` に `channelSummary?: { enabled: number; total: number; channels: string[] }` を追加

**UI:**
```
┌─────────────────────────────────┐
│ [icon] サーバー名               │
│        Bot 導入済み              │
│                                  │
│  3/5 チャンネル有効              │
│  #general  #announcements  ...  │
│                                  │
│  [     設定を管理     ]         │
└─────────────────────────────────┘
```

### 4.2 サーバー詳細ページの改善

**チャンネルテーブルに削除ボタン追加:**
- 各行の「操作」列に削除ボタン（ゴミ箱アイコン）を追加
- クリック時に確認ダイアログ表示
- 確認後、`actions.deleteChannel` を POST

---

## 5. 設定 UI の統合

### 5.1 ヘッダー設定メニュー

現在の `UserMenu.astro` を拡張して、設定項目を統合:

```
┌──────────────────────────────┐
│ [avatar] Display Name        │
│──────────────────────────────│
│ 🌐 言語: 日本語 ▼           │
│ 🌙 テーマ: ダーク ▼         │
│──────────────────────────────│
│ [ログアウト]                 │
└──────────────────────────────┘
```

**実装:** `UserMenu.astro` をドロップダウンメニューに拡張
- `<details>/<summary>` で JS 不要のドロップダウン
- 言語切り替え: `<form>` POST → セッション更新 → リロード
- テーマ切り替え: インライン JS → localStorage 更新 → class 切り替え
- ログアウト: 既存の `<form>` POST

### 5.2 ログインページの設定

ログインページではヘッダーがないため:
- ページ右上に言語 + テーマのトグルを配置
- `position: fixed` で画面右上に固定

---

## 6. チャンネル削除機能

### 6.1 削除 Action

**`src/actions/index.ts` に追加:**
```typescript
deleteChannel: defineAction({
  accept: "form",
  input: z.object({
    guildId: z.string(),
    channelId: z.string(),
  }),
  handler: async (input, context) => {
    requireAuth(context);
    const appWorker = (env as Record<string, Fetcher>).APP_WORKER;
    const result = await VspoChannelApiRepository.deleteChannel(
      appWorker,
      input.guildId,
      input.channelId,
    );
    if (result.err) {
      throw new ActionError({
        code: "INTERNAL_SERVER_ERROR",
        message: result.err.message,
      });
    }
  },
}),
```

### 6.2 リポジトリ追加

**`src/features/channel/repository/vspo-channel-api.ts` に追加:**
```typescript
deleteChannel(appWorker: Fetcher, guildId: string, channelId: string): Promise<Result<void, AppError>>
```

### 6.3 UI

**ChannelTable.astro の変更:**
- 操作列に削除ボタン（ゴミ箱アイコン + 赤色テキスト）追加
- 削除確認: `<dialog>` 要素で確認モーダル表示
- 確認モーダルは JS (`showModal()` / `close()`) で開閉

---

## 7. コンポーネント構成まとめ

### 新規コンポーネント

| コンポーネント | パス | 説明 |
|---|---|---|
| `ThemeToggle.astro` | `src/components/ui/ThemeToggle.astro` | テーマ切り替えボタン |
| `LanguageSelector.astro` | `src/components/ui/LanguageSelector.astro` | 言語切り替えセレクター |
| `DeleteChannelDialog.astro` | `src/components/channel/DeleteChannelDialog.astro` | チャンネル削除確認ダイアログ |

### 変更コンポーネント

| コンポーネント | 変更内容 |
|---|---|
| `Base.astro` | テーマ class 動的化、FOUC 防止スクリプト追加 |
| `Dashboard.astro` | ヘッダーにテーマ/言語切り替え配置 |
| `UserMenu.astro` | ドロップダウンメニュー化、設定項目統合 |
| `GuildCard.astro` | チャンネルサマリー表示追加 |
| `ChannelTable.astro` | 削除ボタン追加 |

---

## 8. ライトモードでのカラー設計

### ヘッダー
- ライトモード: `bg-vspo-purple` のまま（ブランドカラー固定）
- テキスト: `text-white`（どちらのモードでも白）

### カード
- ライトモード: `bg-white` + `border` + `shadow-card`
- ダークモード: `bg-card (#242424)` + `border-border`

### テーブル
- ライトモード: ヘッダー `bg-gray-50`, ボーダー `border-gray-200`
- ダークモード: ヘッダー `bg-muted (#2d2d2d)`, ボーダー `border-border`

### テキスト
- ライトモード: `text-gray-900` (foreground), `text-gray-500` (muted)
- ダークモード: `text-white/87` (foreground), `text-white/70` (muted)

→ 全て CSS 変数で管理するため、コンポーネント側の変更は不要。
  `bg-background`, `text-foreground`, `bg-card` 等のユーティリティクラスがそのまま機能する。
