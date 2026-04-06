# Cloudflare Workers 統合改善

## 現状

- `@astrojs/cloudflare` adapter 使用
- `wrangler.jsonc` で KV, D1 バインディング設定
- セッション管理は自前実装

## 改善項目

### 1. Astro Sessions API への移行

**現状**: 自前のセッション管理 (middleware.ts 内で手動に cookie / KV を操作)

**改善**: Astro 5.7+ の組み込み Sessions API を使用

```typescript
// Cloudflare adapter は自動で KV をセッションストレージとして使用
// wrangler.jsonc に KV バインディング定義不要 (自動プロビジョニング)

// astro.config.ts
adapter: cloudflare({
  sessionKVBindingName: 'SESSION', // デフォルト名、カスタマイズ可能
})
```

```typescript
// ページ内での使用
const user = await Astro.session?.get('user');
Astro.session?.set('lastVisit', new Date());

// API endpoint 内での使用
export async function POST({ session }: APIContext) {
  session.set('cart', updatedCart);
  return Response.json({ success: true });
}

// Actions 内での使用
handler: async (input, context) => {
  const user = await context.session?.get('user');
  // ...
}

// Middleware 内での使用
export const onRequest = defineMiddleware(async (context, next) => {
  context.session?.set('lastVisit', new Date());
  return next();
});
```

**セッション操作**:

- `session.get(key)` — データ取得
- `session.set(key, value, { ttl })` — TTL 付きデータ保存
- `session.regenerate()` — セッション ID 再生成 (認証後)
- `session.destroy()` — セッション破棄 (ログアウト)

### 2. 環境変数の型安全化 (`astro:env`)

**現状**: `import.meta.env.SECRET_*` で型安全性なし

**改善**:

```typescript
// astro.config.ts
import { defineConfig, envField } from "astro/config";

export default defineConfig({
  env: {
    schema: {
      // Server secrets (クライアントに露出しない)
      DISCORD_CLIENT_ID: envField.string({ context: "server", access: "secret" }),
      DISCORD_CLIENT_SECRET: envField.string({ context: "server", access: "secret" }),
      BOT_API_BASE_URL: envField.string({ context: "server", access: "public" }),
      // Client public (クライアントでも使用可能)
      PUBLIC_SITE_URL: envField.string({ context: "client", access: "public", optional: true }),
    },
  },
});
```

```typescript
// 使用: 型安全なインポート
import { DISCORD_CLIENT_ID, BOT_API_BASE_URL } from "astro:env/server";
import { PUBLIC_SITE_URL } from "astro:env/client";
```

**Cloudflare 固有の環境変数**: `cloudflare:workers` の `env` オブジェクトからもアクセス可能:

```typescript
import { env } from 'cloudflare:workers';
const myKV = env.MY_KV;
```

### 3. Cloudflare Images Binding

**現状**: 画像は静的ファイルとして配信

**改善**: Cloudflare Images Binding でオンデマンド画像変換

```typescript
// astro.config.ts
adapter: cloudflare({
  imageService: 'cloudflare-binding', // デフォルト
  // ビルド時はローカル変換、ランタイムは Cloudflare Images
  imageService: { build: 'compile', runtime: 'cloudflare-binding' },
})
```

- ビルド時の静的画像は `compile` で最適化
- SSR ページのオンデマンド画像は Cloudflare Images で変換
- バインディングは自動プロビジョニング

### 4. Execution Context の活用

```typescript
// waitUntil でレスポンス後に非同期処理を実行
const cfContext = Astro.locals.cfContext;
cfContext.waitUntil(
  // ログ送信やキャッシュ更新など
  sendAnalytics(request)
);
```

### 5. `cf` オブジェクトによる地域情報

```typescript
// リクエストの地域情報にアクセス
const cf = Astro.request.cf;
const country = cf?.country; // "JP", "US" 等
// ロケール自動検出に活用可能
```

### 6. Wrangler 設定の簡素化

Astro 6 + `@astrojs/cloudflare` v13 では、基本設定のみの `wrangler.jsonc` は不要:

```jsonc
// 最小構成 — カスタムバインディングがある場合のみ必要
{
  "name": "bot-dashboard",
  // KV, D1 等のバインディングがある場合のみ記述
  "kv_namespaces": [{ "binding": "SESSION", "id": "..." }],
  "d1_databases": [{ "binding": "DB", "database_id": "..." }]
}
```

### 7. Static Assets のキャッシュ

Astro がビルドしたアセットはハッシュ付きファイル名のため、長期キャッシュが自動適用。

カスタムヘッダーが必要な場合は `public/_headers`:

```text
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

## 移行チェックリスト

- [ ] 自前セッション管理 → Astro Sessions API に移行
- [ ] 環境変数を `astro:env` スキーマに定義
- [ ] Cloudflare Images Binding の動作確認
- [ ] `waitUntil()` でバックグラウンド処理を最適化
- [ ] `cf.country` を活用したロケール自動検出の検討
- [ ] wrangler.jsonc の不要設定を削除
