# セッション管理の改善

## 現状

### セッション設定

`astro.config.ts` にセッション設定が**未定義**。Cloudflare adapter がデフォルトのセッションドライバー (KV) を自動提供。

```typescript
// astro.config.ts — session 設定なし
export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  // session: { ... } ← 未設定
});
```

### セッションデータ構造 (`env.d.ts`)

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

### セッション利用 (`middleware.ts`)

```typescript
// 並列読み取りで KV ラウンドトリップ削減
const [sessionLocale, user, expiresAt, accessToken] = await Promise.all([
  context.session?.get("locale"),
  context.session?.get("user"),
  context.session?.get("expiresAt"),
  context.session?.get("accessToken"),
]);
```

### 課題

1. **セッション設定が暗黙的**: デフォルトドライバーの動作が明示されていない
2. **Cookie 設定が未明示**: `httpOnly`, `secure`, `sameSite` がデフォルト任せ
3. **TTL 未設定**: セッションの有効期限がトークン失効時のみ。アイドルタイムアウトなし
4. **トークンリフレッシュの競合**: 並行リクエスト時に複数回リフレッシュが発生する可能性
5. **ギルドサマリーキャッシュの失効**: セッション内キャッシュに TTL なし、古いデータが残る
6. **OAuth state の残存**: 認証完了後も `oauth_state` がセッションに残る

## 改善 1: 明示的なセッション設定

### 推奨設定

```typescript
// astro.config.ts
export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  session: {
    // Cloudflare adapter はデフォルトで KV ドライバーを使用
    // 明示的に設定することで動作を文書化
    cookie: {
      name: "vspo-dash-session",
      sameSite: "lax",
      httpOnly: true,
      secure: true,
      // path: "/" はデフォルト
    },
    ttl: 86400, // 24時間 — セッション全体の最大寿命
  },
});
```

### Cookie 設定の詳細

| 属性 | デフォルト | 推奨 | 理由 |
|------|-----------|------|------|
| `name` | `"astro-session"` | `"vspo-dash-session"` | アプリ固有の名前で競合回避 |
| `sameSite` | `"lax"` | `"lax"` | OAuth リダイレクトとの互換性を維持 |
| `httpOnly` | `true` | `true` | JS からのアクセスを禁止 |
| `secure` | `true` | `true` | HTTPS のみ |

### セッションドライバーの選択肢

| ドライバー | 用途 | 備考 |
|-----------|------|------|
| Cloudflare KV (デフォルト) | 現在の本番環境 | adapter が自動設定 |
| Redis (`sessionDrivers.redis()`) | 高スループット | 別途 Redis インスタンスが必要 |
| Memory | 開発環境 | ワーカー再起動で消失 |

## 改善 2: セッション TTL とアイドルタイムアウト

### 現状の問題

セッションの寿命がトークン失効 (Discord OAuth の `expires_in`) にのみ依存:

```typescript
// middleware.ts — トークン失効チェック
if (now >= (expiresAt ?? 0) - REFRESH_BUFFER_MS) {
  // リフレッシュ or 破棄
}
```

→ リフレッシュが成功し続ける限り、セッションは無期限に存続する。

### 改善: TTL + アイドルタイムアウト

```typescript
// astro.config.ts
session: {
  ttl: 86400, // 24時間 — セッション全体の最大寿命
}
```

加えて、ミドルウェアでアイドルタイムアウトを実装:

```typescript
const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2時間

const sessionTimeout = defineMiddleware(async (context, next) => {
  const lastActivity = await context.session?.get("lastActivity");
  const now = Date.now();

  if (lastActivity && now - lastActivity > SESSION_IDLE_TIMEOUT_MS) {
    context.session?.destroy();
    return context.redirect("/?error=session_expired");
  }

  // アクティビティを記録
  context.session?.set("lastActivity", now);
  return next();
});
```

### TTL の効果

| 項目 | Before | After |
|------|--------|-------|
| セッション最大寿命 | 無期限 (リフレッシュ成功時) | 24 時間 |
| アイドルタイムアウト | なし | 2 時間 |
| ストレージ消費 | 際限なく増加 | TTL で自動削除 |

## 改善 3: トークンリフレッシュの競合防止

### 現状の問題

並行リクエスト (ページロード + Server Island + Action) が同時にリフレッシュを実行:

```yaml
Request A: expiresAt < now → refresh → new tokens → session.set(...)
Request B: expiresAt < now → refresh → old refresh token → FAIL (token already used)
```

### 改善: リフレッシュロック

```typescript
const REFRESH_LOCK_KEY = "tokenRefreshLock";
const REFRESH_LOCK_TTL_MS = 10_000; // 10秒

const refreshTokenIfNeeded = async (context: APIContext) => {
  const [expiresAt, accessToken] = await Promise.all([
    context.session?.get("expiresAt"),
    context.session?.get("accessToken"),
  ]);

  const now = getCurrentUTCDate().getTime();
  if (now < (expiresAt ?? 0) - REFRESH_BUFFER_MS) {
    context.locals.accessToken = accessToken ?? null;
    return;
  }

  // ロックを確認 — 他のリクエストがリフレッシュ中なら現在のトークンを使う
  const lock = await context.session?.get(REFRESH_LOCK_KEY);
  if (lock && now - lock < REFRESH_LOCK_TTL_MS) {
    context.locals.accessToken = accessToken ?? null;
    return;
  }

  // ロックを取得
  context.session?.set(REFRESH_LOCK_KEY, now);

  const refreshToken = await context.session?.get("refreshToken");
  if (!refreshToken) {
    context.session?.destroy();
    return;
  }

  const refreshResult = await DiscordApiRepository.refreshToken({ ... });

  if (refreshResult.err) {
    context.session?.destroy();
    return;
  }

  const tokens = refreshResult.val;
  context.session?.set("accessToken", tokens.access_token);
  context.session?.set("refreshToken", tokens.refresh_token);
  context.session?.set("expiresAt", now + tokens.expires_in * 1000);
  context.session?.set(REFRESH_LOCK_KEY, null); // ロック解除
  context.locals.accessToken = tokens.access_token;
};
```

### 注意点

- Cloudflare KV がトランザクションをサポートしないため、分散ロック機構の完全性は保証されません
- 競合ウィンドウは狭い (同一セッションの並行リクエストかつトークン期限切れ時のみ)
- 最悪のケースでも、リフレッシュトークンの無効化で `session.destroy()` されるため安全

## 改善 4: ギルドサマリーキャッシュの TTL

### 現状の問題

```typescript
// SessionData に guildSummaries をキャッシュ
guildSummaries: Array<{ id: string; name: string; ... }>;
```

キャッシュ期限がないため、ギルド名変更やBot追加/削除が反映されない。

### 改善: キャッシュメタデータの追加

```typescript
interface SessionData {
  guildSummaries: Array<{ id: string; name: string; icon: string | null; isAdmin: boolean; botInstalled: boolean }>;
  guildSummariesCachedAt: number; // キャッシュ時刻
}

const GUILD_CACHE_TTL_MS = 5 * 60 * 1000; // 5分

const getGuildSummaries = async (context: APIContext) => {
  const [cached, cachedAt] = await Promise.all([
    context.session?.get("guildSummaries"),
    context.session?.get("guildSummariesCachedAt"),
  ]);

  const now = Date.now();
  if (cached && cachedAt && now - cachedAt < GUILD_CACHE_TTL_MS) {
    return cached;
  }

  // キャッシュ失効 — 再取得
  const guilds = await fetchGuildSummaries(context.locals.accessToken);
  context.session?.set("guildSummaries", guilds);
  context.session?.set("guildSummariesCachedAt", now);
  return guilds;
};
```

## 改善 5: OAuth State のクリーンアップ

### 現状

`oauth_state` が認証完了後もセッションに残存する。

### 改善

```typescript
// pages/auth/callback.astro
const oauthState = await Astro.session?.get("oauth_state");
// ... state 検証 ...

// 検証後に削除
Astro.session?.set("oauth_state", undefined);
```

## 改善 6: セッションデータの型安全性強化

### 現状

`context.session?.get("key")` の戻り値は `SessionData[key]` だが、`session?` の optional chaining により常に `undefined` の可能性がある。

### 改善: セッションの存在保証

```typescript
const auth = defineMiddleware(async (context, next) => {
  // session が undefined の場合のガード
  if (!context.session) {
    // Cloudflare adapter ではありえないが型安全のため
    return context.redirect("/?error=session_unavailable");
  }

  // ここ以降は session が確実に存在
  const user = await context.session.get("user");
  // ...
});
```

## セッションフロー図

```text
ブラウザ → Cloudflare Worker
  ↓
middleware (securityHeaders)
  ↓
middleware (locale)
  ├── session.get("locale") → KV
  └── locals.locale = locale
  ↓
middleware (auth)
  ├── session.get("user", "expiresAt", "accessToken") → KV (並列)
  ├── DEV: mock auth → skip
  ├── !user: redirect to "/"
  ├── token expired: refresh + session.set(...) → KV
  └── locals.user = user, locals.accessToken = token
  ↓
middleware (actionAuth) [NEW]
  ├── getActionContext()
  ├── !action: skip
  └── !user: setActionError(UNAUTHORIZED)
  ↓
Page / Action rendering
  ↓
Response + Security Headers
```

## 移行チェックリスト

- [ ] `astro.config.ts` に `session` 設定 (cookie, ttl) を追加
- [ ] セッション Cookie 名を `"vspo-dash-session"` に変更
- [ ] セッション TTL を 24 時間に設定
- [ ] アイドルタイムアウトミドルウェアを追加 (2 時間)
- [ ] トークンリフレッシュのロック機構を実装
- [ ] ギルドサマリーキャッシュに TTL メタデータを追加
- [ ] OAuth state の認証完了後クリーンアップを追加
- [ ] `lastActivity` タイムスタンプの記録を追加
- [ ] セッション設定の動作を開発環境で検証
