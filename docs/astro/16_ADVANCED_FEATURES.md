# 高度な Astro 機能の活用

## 1. 実験的ルートキャッシング (Astro 6)

### 概要

Astro 6 の `experimental.routeCache` はサーバーレンダリングされたページのレスポンスをキャッシュし、同一リクエストへの再レンダリングを回避する。

### 現状の課題

- ダッシュボードページは毎リクエスト SSR — ギルド一覧やチャンネル設定は頻繁に変わらない
- Cloudflare Workers の CPU 時間制限内で効率よくレスポンスを返したい
- Bot API (Service Binding) への不要な呼び出しを削減したい

### 設定

```typescript
// astro.config.ts
import { defineConfig } from "astro/config";

export default defineConfig({
  experimental: {
    routeCache: true,
  },
});
```

### ページでのキャッシュ設定

```astro
---
// pages/dashboard/guilds.astro
const cache = Astro.routeCache;

// 5分キャッシュ + 1時間の stale-while-revalidate
cache.set({
  maxAge: 300,        // 5 minutes
  swr: 3600,          // 1 hour stale-while-revalidate
  tags: ["guilds", `user:${Astro.locals.user?.id}`],
});

const guilds = await fetchGuilds();
---
```

### キャッシュ無効化

```typescript
// Action でチャンネル追加後にキャッシュを無効化
import { cacheInvalidate } from "astro:cache";

handler: async (input, context) => {
  await addChannel(input);
  // ギルド関連のキャッシュを全て無効化
  await cacheInvalidate({ tags: [`guild:${input.guildId}`] });
  return { success: true };
}
```

### 適用候補

| ページ | キャッシュ戦略 | 理由 |
|--------|--------------|------|
| `/` (LP) | `maxAge: 3600` | 静的コンテンツ、変更頻度低 |
| `/announcements` | `maxAge: 1800` | お知らせは頻繁に変わらない |
| `/dashboard/guilds` | `maxAge: 300, swr: 3600` | ギルド一覧は短めキャッシュ |
| `/dashboard/[guildId]` | `maxAge: 60, swr: 300` | チャンネル設定は更新頻度が高い |

### 注意点

- **実験的機能**: API が変更される可能性あり
- **認証との整合性**: ユーザー別にキャッシュキーを分ける必要あり (`tags: ["user:xxx"]`)
- **Cloudflare Workers**: `memoryCache()` はワーカーのライフサイクルに依存。KV や Cache API との併用を検討

## 2. Page Partials

### 概要

`export const partial = true` を設定したページは `<html>` / `<head>` / `<body>` を含まない HTML フラグメントを返す。htmx や fetch ベースの部分更新に最適。

### 現状の課題

- チャンネル追加・削除後にフルページリロードしている
- React Islands で部分更新しているが、SSR されたテーブルの再取得は MPA リロード

### 活用パターン: テーブル部分更新

```astro
---
// pages/partials/channel-table.astro
export const partial = true;

const guildId = Astro.url.searchParams.get("guildId");
const channels = await fetchChannels(guildId);
---
<table>
  {channels.map(ch => (
    <tr>
      <td>{ch.name}</td>
      <td>{ch.language}</td>
    </tr>
  ))}
</table>
```

### クライアント側 (React コンポーネント)

```tsx
// features/channel/components/ChannelTableRefresher.tsx
const refreshTable = async (guildId: string) => {
  const res = await fetch(`/partials/channel-table?guildId=${guildId}`);
  const html = await res.text();
  document.getElementById("channel-table")!.innerHTML = html;
};
```

### Partial vs React Island の使い分け

| 方法 | データ取得 | 状態管理 | 適用場面 |
|------|-----------|---------|---------|
| Page Partial | サーバー (SSR) | なし | テーブル再描画、リスト更新 |
| React Island | クライアント | React state | フォーム、モーダル、リアルタイム UI |
| MPA リロード | サーバー (SSR) | なし | ページ遷移、フォーム送信後 |

### メリット

- サーバーサイドのデータ取得ロジックを再利用できる
- クライアントに JSON API を別途用意する必要がない
- SEO 不要なダッシュボード内で特に有効

## 3. カスタムエラーページ

### 現状

- `404.astro` は存在する (ランディングページへの誘導ボタン付き)
- `500.astro` は未実装

### 500.astro の追加

```astro
---
// src/pages/500.astro
import Base from "~/layouts/Base.astro";
import Header from "~/features/shared/components/Header.astro";
import Footer from "~/features/shared/components/Footer.astro";

const { error } = Astro.props;
const locale = Astro.locals.locale ?? "ja";
const t = {
  ja: { title: "サーバーエラー", message: "申し訳ありません。問題が発生しました。", back: "トップへ戻る" },
  en: { title: "Server Error", message: "Sorry, something went wrong.", back: "Back to Home" },
};
---
<Base title={t[locale].title}>
  <Header />
  <main>
    <h1>{t[locale].title}</h1>
    <p>{t[locale].message}</p>
    {import.meta.env.DEV && error && <pre>{error.message}</pre>}
    <a href="/">{t[locale].back}</a>
  </main>
  <Footer />
</Base>
```

### error prop (Astro 4.11+)

- `Astro.props.error` はサーバーエラーの `Error` オブジェクト
- 本番環境ではユーザーにスタックトレースを表示しない
- `Astro.locals` はミドルウェアで設定済みの値が利用可能 (ロケール等)

## 4. Astro.rewrite() パターン

### 概要

`Astro.rewrite()` はページコンポーネント内でリクエストを別ルートに書き換える。URL は変わらない。

### 活用パターン 1: 条件付き 404 フォールバック

```astro
---
// pages/dashboard/[guildId].astro
const guild = await fetchGuild(guildId);
if (!guild) {
  return Astro.rewrite("/404");
}
---
```

### 活用パターン 2: 機能フラグによる出し分け

```astro
---
// pages/dashboard/settings.astro
const hasNewSettings = featureFlags.get("new-settings-ui");
if (hasNewSettings) {
  return Astro.rewrite("/dashboard/settings-v2");
}
---
<!-- 旧 UI -->
```

### middleware の rewrite との違い

| 方法 | 実行タイミング | 用途 |
|------|--------------|------|
| `context.rewrite()` (middleware) | ページ処理前 | ルーティング変更、認証フォールバック |
| `Astro.rewrite()` (ページ) | ページ処理中 | データ取得結果による分岐 |

## 5. Astro 6 Breaking Changes 対策

### 把握すべき主要変更

| 変更 | 影響 | 対応 |
|------|------|------|
| `squoosh` → `sharp` | 画像最適化ライブラリ変更 | `sharp` がデフォルト、Cloudflare では `passthroughImageService` |
| Legacy content collections 削除 | `src/content/` の古い API | 本プロジェクトは未使用 → 影響なし |
| `astro:env` が安定版 | 実験的フラグ不要 | `experimental.env` を削除可能 |
| Markdown 設定リネーム | `markdown.remarkPlugins` → 変更なし | 本プロジェクトは Markdown 未使用 |
| Cookie encoding | 一部の cookie 値のエンコーディング変更 | セッション cookie の互換性確認 |

### Cloudflare Workers 固有の注意

```typescript
// astro.config.ts
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    imageService: "passthroughImageService",
    // Astro 6: platformProxy の設定変更を確認
    platformProxy: {
      enabled: true,
    },
  }),
});
```

### アップグレードチェックリスト

- [ ] `astro@6` へのアップグレード
- [ ] `@astrojs/cloudflare` の対応バージョン確認
- [ ] 実験的フラグの整理 (`astro:env` → 安定版)
- [ ] Cookie エンコーディングの互換性テスト
- [ ] `sharp` vs `passthroughImageService` の動作確認

## 6. View Transitions の強化

### 現状

`10_VIEW_TRANSITIONS.md` で MPA ページ遷移の高速化を扱っている。追加で検討すべき点:

### ページ遷移中のローディング状態

```astro
<script>
  document.addEventListener("astro:before-preparation", () => {
    document.getElementById("loading-bar")?.classList.add("active");
  });
  document.addEventListener("astro:after-swap", () => {
    document.getElementById("loading-bar")?.classList.remove("active");
  });
</script>
```

### フォーム送信後の遷移

Astro Actions (`accept: "form"`) の送信後、MPA リロードが発生する。View Transitions と組み合わせることでスムーズな遷移を実現:

```astro
<form method="POST" action={actions.addChannel} data-astro-reload>
  <!-- data-astro-reload: View Transitions をスキップしてフルリロード -->
  <!-- フォーム送信ではデータ整合性のためリロードを優先 -->
</form>
```

## 移行チェックリスト

### ルートキャッシング

- [ ] `experimental.routeCache` の有効化を検討
- [ ] ページごとのキャッシュ戦略を定義
- [ ] ユーザー別キャッシュキーの設計
- [ ] Action 後のキャッシュ無効化パターンの実装

### Page Partials

- [ ] チャンネルテーブルの部分更新 Partial を作成
- [ ] React コンポーネントからの Partial fetch ヘルパーを作成
- [ ] MPA リロードから Partial 更新への段階的移行

### エラーページ

- [ ] `src/pages/500.astro` の作成
- [ ] i18n 対応 (locale を `Astro.locals` から取得)
- [ ] 開発環境でのエラー詳細表示

### Astro 6 対応

- [ ] Breaking changes の影響評価
- [ ] Cloudflare adapter の互換性確認
- [ ] Cookie エンコーディングのテスト
- [ ] 実験的フラグの棚卸し
