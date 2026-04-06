# セキュリティ改善

## 現状の実装

### middleware.ts のセキュリティヘッダー
```typescript
// securityHeaders middleware
const headers = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; img-src 'self' https://cdn.discordapp.com data:; " +
    "connect-src 'self'; font-src 'self' https://fonts.gstatic.com; " +
    "frame-ancestors 'none'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
```

### 認証
- Discord OAuth2 (authorization code flow)
- セッションベース (Cloudflare KV or D1)
- ミドルウェアで認証チェック + トークンリフレッシュ (5分バッファ)
- dev 環境ではモックユーザー

### Astro Actions
- `accept: "form"` — Astro が自動 CSRF 保護
- `requireAuth()` ヘルパーで認証確認
- Zod バリデーション

## 課題と改善

### 1. CSP の `unsafe-inline` 問題

→ **詳細な移行ガイド**: [19_CSP_BUILTIN.md](./19_CSP_BUILTIN.md) (Astro 6 ビルトイン CSP 設定、`security.csp` / `security.checkOrigin` / `security.allowedDomains` の完全ガイド)

**現状**: `script-src 'self' 'unsafe-inline'` — XSS リスクの緩和が不十���

**原因**:
- Base.astro のテーマ初期化 `<script is:inline>` が `unsafe-inline` を要求
- `<ClientRouter />` (View Transitions) が Astro 6 の built-in CSP と非互換

**改善案**:

#### 短期: nonce ベース CSP

```typescript
// middleware.ts
const nonce = crypto.randomUUID();
const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; ...`;

// Astro.locals に nonce を設定
Astro.locals.cspNonce = nonce;
```

```astro
<!-- Base.astro -->
<script is:inline nonce={Astro.locals.cspNonce}>
  // テーマ初期化
</script>
```

**注意**: Astro が生成する inline script には自動で nonce が付与されないため、手動設定が必要。

#### 長期: MPA View Transitions + built-in CSP (Astro MCP 検証済み)

Astro 6 の `security.csp` は `<meta>` タグに SHA-256 ハッシュを使用する方式。**`<ClientRouter />` と非互換**（確認済み）。

`security.csp` 有効時、Astro は自動的に:
- inline script の SHA-256 ハッシュを `<meta>` タグに含める
- `unsafe-inline` が指定されていてもハッシュが存在すれば自動で無視される
- Runtime API `Astro.csp?.insertDirective()` で動的にディレクティブ追加可能

将来的に:
1. `<ClientRouter />` を削除
2. ネイティブブラウザの MPA view transitions (`@view-transition`) に移行
3. Astro built-in CSP を有効化

```typescript
// 将来の astro.config.ts
export default defineConfig({
  security: {
    csp: {
      directives: {
        "default-src": ["self"],
        "script-src": ["self"],
        "style-src": ["self", "unsafe-inline"], // Tailwind のため
        "img-src": ["self", "https://cdn.discordapp.com", "data:"],
        "font-src": ["self"],
        "frame-ancestors": ["none"],
      },
    },
  },
});
```

### 2. CSRF 保護

→ **Actions パターン詳細**: [17_ACTIONS_PATTERNS.md](./17_ACTIONS_PATTERNS.md) (getActionContext() 認証ゲーティング、エラーコード、入力バリデーション)

**現状**: Astro Actions の `accept: "form"` が自動 CSRF 保護を提供。

**改善点**:
- `change-locale` API エンドポイントが Astro Actions ではなく生の POST endpoint → CSRF 保護なし
- `guilds/[guildId]/channels.ts` GET endpoint は CSRF 不要だが、認証チェック要確認

**改善案**:
```typescript
// change-locale を Astro Action に移行
export const server = {
  changeLocale: defineAction({
    accept: "form",
    input: z.object({
      locale: z.enum(["ja", "en"]),
    }),
    handler: async (input, context) => {
      const session = context.locals.session;
      session.set("locale", input.locale);
      // Astro Action の CSRF 保護が自動で効く
    },
  }),
};
```

### 3. OAuth セキュリティ

**現状の確認事項**:
- [ ] state パラメータが `crypto.randomUUID()` で生成されている
- [ ] state がセッションに保存され、callback で検証されている
- [ ] access token がクライアントに露出していない
- [ ] refresh token の保存場所が安全

**改善案**:

#### PKCE (Proof Key for Code Exchange) 対応

```typescript
// auth/discord.ts
import { generateCodeVerifier, generateCodeChallenge } from "./pkce";

const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);

session.set("oauth_code_verifier", codeVerifier);

const authUrl = new URL("https://discord.com/api/oauth2/authorize");
authUrl.searchParams.set("code_challenge", codeChallenge);
authUrl.searchParams.set("code_challenge_method", "S256");
```

```typescript
// PKCE ヘルパー
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64url(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64url(new Uint8Array(digest));
}
```

### 4. API エンドポイントの認証

**改善点**:
- `guilds/[guildId]/channels.ts` — ユーザーがそのギルドのメンバーかどうかの検証
- レート制限の実装

```typescript
// API エンドポイントの認証パターン
export const GET: APIRoute = async (context) => {
  const session = context.locals.session;
  const user = session.get("user");

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const guildId = context.params.guildId;

  // ユーザーのギルドメンバーシップを検証
  const guilds = session.get("guildSummaries") ?? [];
  const hasAccess = guilds.some(g => g.id === guildId);

  if (!hasAccess) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  // ... チャンネル一覧取得
};
```

### 5. セッションセキュリティ — Astro 組み込み Sessions API (Astro MCP 検証済み)

→ **セッション管理詳細**: [18_SESSION_MANAGEMENT.md](./18_SESSION_MANAGEMENT.md) (Cookie 設定、TTL、アイドルタイムアウト、トークンリフレッシュ競合防止)

**Astro 5.7+ で `session` API が組み込み**。Cloudflare adapter は KV を自動プロビジョニング。

**現在の自前セッション管理 → Astro Sessions API に移行**:

```typescript
// astro.config.ts — Cloudflare adapter は自動でセッションドライバーを設定
// sessionKVBindingName のカスタマイズも可能
adapter: cloudflare({
  sessionKVBindingName: 'SESSION', // デフォルト
})
```

```typescript
// 使用例: ページ内
const user = await Astro.session?.get('user');
Astro.session?.set('locale', 'ja');

// API endpoint 内
export async function POST({ session }: APIContext) {
  const cart = await session.get('cart');
  session.set('cart', [...cart, newItem]);
}

// Actions 内
handler: async (input, context) => {
  await context.session?.set('preference', input.value);
}
```

**セキュリティ機能**:
- `session.regenerate()` — セッション ID 再生成（セッション固定攻撃対策）
- `session.destroy()` — セッション破棄（ログアウト時）
- `session.set(key, value, { ttl: seconds })` — TTL 付きデータ保存
- Cookie には session ID のみ格納、データはサーバーサイド (KV) に保存

```typescript
// callback.ts — OAuth 成功後
Astro.session?.regenerate(); // セッション固定攻撃対策
Astro.session?.set("user", discordUser);
Astro.session?.set("accessToken", tokens.access_token, { ttl: 3600 });
```

```typescript
// logout.ts
Astro.session?.destroy();
return Astro.redirect('/');
```

### 6. エラーメッセージの安全性

**現状**: Action のエラーメッセージがそのままクライアントに表示される可能性

**改善案**:
```typescript
// エラーメッセージのサニタイズ
function safeErrorMessage(error: unknown): string {
  if (error instanceof ActionError) {
    // ActionError は意図的に作成されたメッセージなので安全
    return error.message;
  }
  // 予期しないエラーは汎用メッセージ
  console.error("Unexpected error:", error);
  return "An unexpected error occurred. Please try again.";
}
```

### 7. 入力バリデーションの強化

**現状の Zod スキーマ**:
```typescript
// actions/index.ts の既存バリデーション
input: z.object({
  guildId: z.string(),
  channelId: z.string(),
  language: z.string(),
  memberType: z.string(),
  customMemberIds: z.string().optional(),
})
```

**改善案**: より厳密なバリデーション
```typescript
input: z.object({
  guildId: z.string().regex(/^\d{17,20}$/, "Invalid guild ID"), // Discord snowflake
  channelId: z.string().regex(/^\d{17,20}$/, "Invalid channel ID"),
  language: z.enum(["ja", "en"]),
  memberType: z.enum(["all", "custom", "none"]),
  customMemberIds: z.string()
    .transform(s => s ? s.split(",") : [])
    .pipe(z.array(z.string().regex(/^\d{17,20}$/))),
})
```

### 8. 環境変数の型安全性 — `astro:env` API (Astro MCP 検証済み)

**現状**: `import.meta.env.SECRET_*` で環境変数にアクセス、型安全性なし。

**改善案**: `astro:env` スキーマで型安全 + バリデーション

```typescript
// astro.config.ts
import { defineConfig, envField } from "astro/config";

export default defineConfig({
  env: {
    schema: {
      DISCORD_CLIENT_ID: envField.string({ context: "server", access: "secret" }),
      DISCORD_CLIENT_SECRET: envField.string({ context: "server", access: "secret" }),
      DISCORD_REDIRECT_URI: envField.string({ context: "server", access: "public" }),
      BOT_API_BASE_URL: envField.string({ context: "server", access: "public" }),
      PUBLIC_SITE_URL: envField.string({ context: "client", access: "public" }),
    },
  },
});
```

```typescript
// 使用例
import { DISCORD_CLIENT_ID } from "astro:env/server";
import { PUBLIC_SITE_URL } from "astro:env/client";
```

**Cloudflare Workers との互換性**: `cloudflare:workers` の `env` オブジェクトと `astro:env` API の両方で環境変数にアクセス可能。

## セキュリティチェックリスト

- [ ] CSP ヘッダーから `unsafe-inline` を削除 (nonce ベースに移行)
- [ ] 全 API エンドポイントに認証チェック
- [ ] CSRF 保護が全フォームで有効
- [ ] OAuth に PKCE 追加
- [ ] Astro Sessions API に移行 + `session.regenerate()` でセッション固定対策
- [ ] エラーメッセージがサーバー内部情報を漏洩しない
- [ ] 入力バリデーションが Discord snowflake 形式を検証
- [ ] レート制限の実装
- [ ] `Permissions-Policy` ヘッダーの見直し
- [ ] `Strict-Transport-Security` (HSTS) ヘッダーの追加
- [ ] `astro:env` スキーマで環境変数の型安全性を確保
- [ ] セッションデータの TTL 設定 (access token 等)
