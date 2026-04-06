# Middleware パターン改善

## 現状

### middleware.ts の構成

`src/middleware.ts` で 2 つのミドルウェアを `sequence()` で合成:

```typescript
export const onRequest = sequence(securityHeaders, auth);
```

1. **securityHeaders**: 全レスポンスに CSP / X-Frame-Options 等を付与
2. **auth**: セッション読み取り → ロケール設定 → 認証チェック → トークンリフレッシュ

### 型付き Locals

`src/env.d.ts` で `App.Locals` と `App.SessionData` を型定義:

```typescript
declare namespace App {
  interface SessionData {
    user: { id: string; username: string; displayName: string; avatar: string | null };
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    oauth_state: string;
    locale: Locale;
    guildSummaries: Array<{ id: string; name: string; icon: string | null; isAdmin: boolean; botInstalled: boolean }>;
  }
  interface Locals {
    user: SessionData["user"] | null;
    accessToken: string | null;
    locale: Locale;
  }
}
```

### 課題

1. **auth ミドルウェアの責務過多**: ロケール設定 + 認証 + トークンリフレッシュが 1 関数に混在
2. **セキュリティヘッダーのハードコード**: CSP が文字列リテラルで管理困難
3. **Actions の認証重複**: `actions/index.ts` で `requireAuth()` を各アクションで手動呼び出し
4. **エラーページ連携不足**: 500 エラーページでの middleware 動作が未考慮
5. **rewrite パターン未活用**: ロケール切替やフォールバック表示に `context.rewrite()` が使えていない

## 改善 1: ミドルウェア分割

### 責務の分離

```typescript
// src/middleware.ts
import { defineMiddleware, sequence } from "astro:middleware";

const securityHeaders = defineMiddleware(async (_ctx, next) => {
  const response = await next();
  applySecurityHeaders(response);
  return response;
});

const locale = defineMiddleware(async (context, next) => {
  const sessionLocale = await context.session?.get("locale");
  context.locals.locale = sessionLocale ?? "ja";
  if (!sessionLocale) {
    context.session?.set("locale", "ja");
  }
  return next();
});

const auth = defineMiddleware(async (context, next) => {
  // 認証 + トークンリフレッシュのみ
  // ロケール処理は locale ミドルウェアに委譲
  const user = await context.session?.get("user");
  context.locals.user = user ?? null;

  if (!user) {
    context.locals.accessToken = null;
    if (context.url.pathname.startsWith("/dashboard")) {
      return context.redirect("/");
    }
    return next();
  }

  await refreshTokenIfNeeded(context);
  return next();
});

export const onRequest = sequence(securityHeaders, locale, auth);
```

### メリット

| 項目 | Before | After |
|------|--------|-------|
| auth の行数 | ~70 行 (ロケール含む) | ~30 行 (認証のみ) |
| テスタビリティ | ロケールと認証が絡む | 各ミドルウェア独立テスト可 |
| 再利用性 | auth 無しでロケールだけ使えない | locale のみ適用可能 |

## 改善 2: CSP ヘッダーのビルダーパターン

### 現状の問題

```typescript
// 1 行の長い文字列 — 変更箇所が見つけにくい
"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ..."
```

### 改善: オブジェクト構造で管理

```typescript
const CSP_DIRECTIVES: Record<string, readonly string[]> = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  // fonts 移行後: https://fonts.googleapis.com を削除
  "font-src": ["'self'"],
  // fonts 移行後: https://fonts.gstatic.com を削除
  "img-src": ["'self'", "https://cdn.discordapp.com", "data:"],
  "connect-src": ["'self'", "https://discord.com"],
  "frame-ancestors": ["'none'"],
} as const;

const buildCsp = (directives: Record<string, readonly string[]>): string =>
  Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
```

### メリット

- ディレクティブ単位で追加・削除が明確
- `13_FONTS_OPTIMIZATION.md` のフォント移行後、`style-src` / `font-src` から外部ドメインを削除するだけで完了
- レビュー時に差分が読みやすい

## 改善 3: Actions 認証の middleware ゲーティング

### 現状の問題

```typescript
// actions/index.ts — 全アクションで requireAuth() を手動呼び出し
handler: async (input, context) => {
  requireAuth(context);  // 忘れるとセキュリティホール
  // ...
}
```

### 改善: getActionContext() による事前検証

Astro の `getActionContext()` を middleware 内で使用し、アクション実行前に認証を強制:

```typescript
import { getActionContext } from "astro:actions";

const actionAuth = defineMiddleware(async (context, next) => {
  const actionCtx = getActionContext(context);

  // Action リクエストでない場合はスキップ
  if (!actionCtx.action) {
    return next();
  }

  // 全 Action に認証を要求
  if (!context.locals.user) {
    actionCtx.setActionError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
    return next();
  }

  return next();
});

export const onRequest = sequence(securityHeaders, locale, auth, actionAuth);
```

### Actions 側の変更

```typescript
// Before: 各 handler で requireAuth()
handler: async (input, context) => {
  requireAuth(context);
  // ...
}

// After: middleware で認証済み — requireAuth() 不要
handler: async (input, _context) => {
  // 認証は middleware で保証済み
  // ...
}
```

### メリット

- 認証漏れのリスクを排除
- アクションハンドラが純粋なビジネスロジックに集中
- テスト時に middleware を差し替えるだけで認証スキップ可能

## 改善 4: context.rewrite() の活用

### ユースケース 1: 未認証ユーザーのフォールバック

```typescript
// 現状: redirect でランディングページへ
if (!user && context.url.pathname.startsWith("/dashboard")) {
  return context.redirect("/");
}

// 改善: rewrite で URL を変えずにランディングページを表示
// ユーザーに「リダイレクトされた」感を与えない
if (!user && context.url.pathname.startsWith("/dashboard")) {
  return context.rewrite("/");
}
```

### ユースケース 2: ロケールベースの rewrite

将来的にパスベースのロケーティング (`/en/dashboard`, `/ja/dashboard`) を導入する場合:

```typescript
const locale = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // /en/* → ロケール設定して /en を除去した path の内容を返す
  if (pathname.startsWith("/en/")) {
    context.locals.locale = "en";
    return context.rewrite(pathname.replace("/en", ""));
  }

  context.locals.locale = "ja";
  return next();
});
```

### redirect vs rewrite の使い分け

| 方法 | URL 変更 | HTTP コード | 用途 |
|------|---------|------------|------|
| `context.redirect()` | あり | 302/301 | 認証失敗 → ログインへ |
| `context.rewrite()` | なし | 200 | フォールバック、ロケール |
| `Astro.rewrite()` | なし | 200 | ページ内条件分岐 |

## 改善 5: エラーページとの連携

### 500.astro の追加

Astro 4.11+ では `src/pages/500.astro` にカスタムエラーページを設置可能:

```astro
---
// src/pages/500.astro
const error = Astro.props.error;
---
<Layout>
  <h1>{Astro.locals.locale === "ja" ? "サーバーエラー" : "Server Error"}</h1>
  {import.meta.env.DEV && <pre>{error?.message}</pre>}
</Layout>
```

### ミドルウェアの注意点

- ミドルウェアは 500 エラーページの**レンダリング前**にも実行される
- `Astro.locals` はミドルウェアで設定済みの値がエラーページでも利用可能
- ただしエラーの原因がミドルウェア自体にある場合は 500.astro も失敗する → ミドルウェアでの例外ハンドリングが重要

```typescript
const securityHeaders = defineMiddleware(async (_context, next) => {
  // ミドルウェア自体がエラーを起こさないよう防御的に実装
  const response = await next();
  applySecurityHeaders(response);
  return response;
});
```

## 改善 6: セッション並列読み取りの最適化

### 現状 (良い実装)

```typescript
// すでに Promise.all で並列化されている — 維持
const [sessionLocale, user, expiresAt, accessToken] = await Promise.all([
  context.session?.get("locale"),
  context.session?.get("user"),
  context.session?.get("expiresAt"),
  context.session?.get("accessToken"),
]);
```

### 注意: ミドルウェア分割時

ロケールと認証を分割すると、KV アクセスが分散する。Astro Sessions はセッションデータをキャッシュするため、同一リクエスト内での重複アクセスは最適化されるが、パフォーマンス計測で確認すべき。

## 移行チェックリスト

- [ ] auth ミドルウェアからロケール処理を `locale` ミドルウェアに分離
- [ ] CSP ヘッダーをオブジェクト構造に変更
- [ ] `getActionContext()` による認証ゲーティングを追加
- [ ] `actions/index.ts` から `requireAuth()` の手動呼び出しを削除
- [ ] `src/pages/500.astro` カスタムエラーページを追加
- [ ] redirect → rewrite 変更を検討 (未認証フォールバック)
- [ ] ミドルウェア分割後のセッション KV アクセスパフォーマンスを計測
- [ ] 各ミドルウェアの単体テストを作成
