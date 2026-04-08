# Security Improvements

## Current Implementation

### Security Headers in middleware.ts

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

### Authentication

- Discord OAuth2 (authorization code flow)
- Session-based (Cloudflare KV or D1)
- Auth check + token refresh (5-minute buffer) in middleware
- Mock user in dev environment

### Astro Actions

- `accept: "form"` — Astro provides automatic CSRF protection
- `requireAuth()` helper for auth verification
- Zod validation

## Issues and Improvements

### 1. CSP `unsafe-inline` Problem

-> **Detailed migration guide**: [19_CSP_BUILTIN.md](./19_CSP_BUILTIN.md) (Astro 6 built-in CSP configuration, complete guide for `security.csp` / `security.checkOrigin` / `security.allowedDomains`)

**Current state**: `script-src 'self' 'unsafe-inline'` — Insufficient XSS risk mitigation

**Cause**:

- Theme initialization `<script is:inline>` in Base.astro requires `unsafe-inline`
- `<ClientRouter />` (View Transitions) is incompatible with Astro 6's built-in CSP

**Proposed improvements**:

#### Short-term: Nonce-based CSP

```typescript
// middleware.ts
const nonce = crypto.randomUUID();
const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; ...`;

// Set nonce in Astro.locals
Astro.locals.cspNonce = nonce;
```

```astro
<!-- Base.astro -->
<script is:inline nonce={Astro.locals.cspNonce}>
  // Theme initialization
</script>
```

**Note**: Astro does not automatically add nonces to generated inline scripts, so manual configuration is required.

#### Long-term: MPA View Transitions + built-in CSP (Verified via Astro MCP)

Astro 6's `security.csp` uses SHA-256 hashes in `<meta>` tags. **Incompatible with `<ClientRouter />`** (confirmed).

When `security.csp` is enabled, Astro automatically:

- Includes SHA-256 hashes of inline scripts in `<meta>` tags
- Automatically ignores `unsafe-inline` when hashes are present
- Allows dynamic directive addition via the Runtime API `Astro.csp?.insertDirective()`

In the future:

1. Remove `<ClientRouter />`
2. Migrate to native browser MPA view transitions (`@view-transition`)
3. Enable Astro built-in CSP

```typescript
// Future astro.config.ts
export default defineConfig({
  security: {
    csp: {
      directives: {
        "default-src": ["self"],
        "script-src": ["self"],
        "style-src": ["self", "unsafe-inline"], // For Tailwind
        "img-src": ["self", "https://cdn.discordapp.com", "data:"],
        "font-src": ["self"],
        "frame-ancestors": ["none"],
      },
    },
  },
});
```

### 2. CSRF Protection

-> **Actions pattern details**: [17_ACTIONS_PATTERNS.md](./17_ACTIONS_PATTERNS.md) (getActionContext() auth gating, error codes, input validation)

**Current state**: Astro Actions' `accept: "form"` provides automatic CSRF protection.

**Areas for improvement**:

- The `change-locale` API endpoint is a raw POST endpoint, not an Astro Action -> No CSRF protection
- The `guilds/[guildId]/channels.ts` GET endpoint doesn't need CSRF, but auth check should be verified

**Proposed improvement**:

```typescript
// Migrate change-locale to an Astro Action
export const server = {
  changeLocale: defineAction({
    accept: "form",
    input: z.object({
      locale: z.enum(["ja", "en"]),
    }),
    handler: async (input, context) => {
      const session = context.locals.session;
      session.set("locale", input.locale);
      // Astro Action's CSRF protection is automatically applied
    },
  }),
};
```

### 3. OAuth Security

**Current verification items**:

- [ ] state parameter is generated with `crypto.randomUUID()`
- [ ] state is stored in session and verified at callback
- [ ] access token is not exposed to the client
- [ ] refresh token storage location is secure

**Proposed improvement**:

#### PKCE (Proof Key for Code Exchange) Support

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
// PKCE helpers
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

### 4. API Endpoint Authentication

**Areas for improvement**:

- `guilds/[guildId]/channels.ts` — Verify that the user is a member of that guild
- Implement rate limiting

```typescript
// API endpoint authentication pattern
export const GET: APIRoute = async (context) => {
  const session = context.locals.session;
  const user = session.get("user");

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const guildId = context.params.guildId;

  // Verify user's guild membership
  const guilds = session.get("guildSummaries") ?? [];
  const hasAccess = guilds.some(g => g.id === guildId);

  if (!hasAccess) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  // ... fetch channel list
};
```

### 5. Session Security — Astro Built-in Sessions API (Verified via Astro MCP)

-> **Session management details**: [18_SESSION_MANAGEMENT.md](./18_SESSION_MANAGEMENT.md) (Cookie configuration, TTL, idle timeout, token refresh race condition prevention)

**Astro 5.7+ includes a built-in `session` API**. The Cloudflare adapter auto-provisions KV.

**Migrate from custom session management to Astro Sessions API**:

```typescript
// astro.config.ts — Cloudflare adapter automatically configures the session driver
// sessionKVBindingName can also be customized
adapter: cloudflare({
  sessionKVBindingName: 'SESSION', // Default
})
```

```typescript
// Usage example: within a page
const user = await Astro.session?.get('user');
Astro.session?.set('locale', 'ja');

// Within an API endpoint
export async function POST({ session }: APIContext) {
  const cart = await session.get('cart');
  session.set('cart', [...cart, newItem]);
}

// Within Actions
handler: async (input, context) => {
  await context.session?.set('preference', input.value);
}
```

**Security features**:

- `session.regenerate()` — Regenerate session ID (session fixation attack prevention)
- `session.destroy()` — Destroy session (on logout)
- `session.set(key, value, { ttl: seconds })` — Store data with TTL
- Only the session ID is stored in the cookie; data is stored server-side (KV)

```typescript
// callback.ts — After successful OAuth
Astro.session?.regenerate(); // Session fixation attack prevention
Astro.session?.set("user", discordUser);
Astro.session?.set("accessToken", tokens.access_token, { ttl: 3600 });
```

```typescript
// logout.ts
Astro.session?.destroy();
return Astro.redirect('/');
```

### 6. Error Message Safety

**Current state**: Action error messages may be displayed directly to the client

**Proposed improvement**:

```typescript
// Error message sanitization
function safeErrorMessage(error: unknown): string {
  if (error instanceof ActionError) {
    // ActionError messages are intentionally crafted, so they are safe
    return error.message;
  }
  // Use a generic message for unexpected errors
  console.error("Unexpected error:", error);
  return "An unexpected error occurred. Please try again.";
}
```

### 7. Strengthening Input Validation

**Current Zod schema**:

```typescript
// Existing validation in actions/index.ts
input: z.object({
  guildId: z.string(),
  channelId: z.string(),
  language: z.string(),
  memberType: z.string(),
  customMemberIds: z.string().optional(),
})
```

**Proposed improvement**: Stricter validation

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

### 8. Type Safety for Environment Variables — `astro:env` API (Verified via Astro MCP)

**Current state**: Environment variables accessed via `import.meta.env.SECRET_*`, with no type safety.

**Proposed improvement**: Type safety + validation via `astro:env` schema

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
// Usage example
import { DISCORD_CLIENT_ID } from "astro:env/server";
import { PUBLIC_SITE_URL } from "astro:env/client";
```

**Cloudflare Workers compatibility**: Environment variables are accessible via both the `cloudflare:workers` `env` object and the `astro:env` API.

## Security Checklist

- [ ] Remove `unsafe-inline` from CSP header (migrate to nonce-based)
- [ ] Auth checks on all API endpoints
- [ ] CSRF protection enabled on all forms
- [ ] Add PKCE to OAuth
- [ ] Migrate to Astro Sessions API + session fixation prevention with `session.regenerate()`
- [ ] Error messages do not leak server internals
- [ ] Input validation verifies Discord snowflake format
- [ ] Implement rate limiting
- [ ] Review `Permissions-Policy` header
- [ ] Add `Strict-Transport-Security` (HSTS) header
- [ ] Ensure type safety for environment variables with `astro:env` schema
- [ ] Set TTL on session data (access tokens, etc.)
