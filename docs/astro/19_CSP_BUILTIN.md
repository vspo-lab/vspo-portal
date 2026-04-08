# Astro 6 Built-in CSP

## Current State

### Manual CSP Header (`middleware.ts`)

```typescript
const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  [
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://cdn.discordapp.com data:; connect-src 'self' https://discord.com; frame-ancestors 'none'",
  ],
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
];
```

### Issues

1. **Use of `'unsafe-inline'`**: Allows `'unsafe-inline'` for scripts and styles — XSS attack risk
2. **Cumbersome manual management**: CSP string is edited directly. Adding new scripts requires manual hash calculation
3. **External font domains**: Requires allowing `fonts.googleapis.com` / `fonts.gstatic.com`
4. **Incompatibility with View Transitions**: Inline scripts from `<ClientRouter />` are difficult to accommodate in CSP
5. **No per-page CSP**: The same CSP is applied to all pages

## Improvement: Astro 6 security.csp

### Overview

Astro 6's built-in CSP automatically computes hashes for scripts and styles at build time and inserts them as `<meta http-equiv="content-security-policy">` tags into each page.

### Key Features

1. **Hash-based**: Eliminates the need for `'unsafe-inline'` — the browser only executes scripts whose hashes match
2. **Automatic computation**: Astro auto-generates hashes for bundled scripts/styles
3. **Per-page**: Only the necessary hashes are included for each page
4. **Algorithm selection**: SHA-256 (default), SHA-384, SHA-512

### Configuration

```typescript
// astro.config.ts
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  security: {
    checkOrigin: true, // Default: true — CSRF protection
    csp: {
      algorithm: "SHA-256",
      directives: [
        "default-src 'self'",
        "img-src 'self' https://cdn.discordapp.com data:",
        "connect-src 'self' https://discord.com",
        "frame-ancestors 'none'",
        // font-src will be 'self' only after fonts migration
        "font-src 'self'",
      ],
      // script-src and style-src are managed automatically by Astro
      // → Hashes are auto-generated, so manual configuration is unnecessary
    },
    // Request body size limit for Actions
    actionBodySizeLimit: 1048576, // 1 MB (default)
  },
});
```

### Generated `<meta>` Tag

```html
<head>
  <meta
    http-equiv="content-security-policy"
    content="
      default-src 'self';
      img-src 'self' https://cdn.discordapp.com data:;
      connect-src 'self' https://discord.com;
      frame-ancestors 'none';
      font-src 'self';
      script-src 'self' 'sha256-abc123...' 'sha256-def456...';
      style-src 'self' 'sha256-ghi789...';
    "
  >
</head>
```

## Detailed Configuration

### scriptDirective

Add external scripts or custom hashes:

```typescript
security: {
  csp: {
    scriptDirective: {
      // Add external script sources
      resources: ["'self'", "https://analytics.example.com"],
      // Custom hashes (for external scripts)
      hashes: ["sha256-externalScriptHash"],
      // Allow dynamic script injection (if Server Islands use it internally)
      strictDynamic: false,
    },
  },
}
```

### styleDirective

Add external styles or custom hashes:

```typescript
security: {
  csp: {
    styleDirective: {
      resources: ["'self'"],
      // Custom hashes for Tailwind inline styles, etc.
      hashes: [],
    },
  },
}
```

## security.checkOrigin — CSRF Protection

### Overview

Introduced in Astro 4.9+. Automatically validates the `Origin` header to prevent CSRF attacks.

```typescript
security: {
  checkOrigin: true, // Default: true
}
```

### Behavior

- Validates the `Origin` header on `POST`, `PATCH`, `DELETE`, `PUT` requests
- Returns 403 on mismatch
- Applies when `content-type` is `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`
- Astro Actions (`accept: "form"`) are automatically protected

### Comparison with Current State

| Item | Before (manual) | After (checkOrigin) |
|------|-----------------|---------------------|
| CSRF protection | Actions `_astroAction` field only | Origin header validation + Actions |
| Scope | Form submissions only | All POST/PATCH/DELETE/PUT |
| Configuration | Not required (automatic) | Not required (enabled by default) |

## security.allowedDomains — Host Header Validation

### Usage with Cloudflare Workers

```typescript
security: {
  allowedDomains: [
    {
      hostname: "discord.vspo-schedule.com",
      protocol: "https",
    },
    {
      hostname: "dev-discord.vspo-schedule.com",
      protocol: "https",
    },
  ],
}
```

### Effects

- Prevents `X-Forwarded-Host` header spoofing
- Guarantees that `Astro.url` returns the correct hostname
- Prevents host header injection attacks behind Cloudflare Workers

## security.actionBodySizeLimit

### Default

```typescript
security: {
  actionBodySizeLimit: 1048576, // 1 MB
}
```

### Customization

Increase when there are Actions that involve file uploads:

```typescript
security: {
  actionBodySizeLimit: 10 * 1024 * 1024, // 10 MB
}
```

The current project does not require file uploads, so the default is sufficient.

## Migration from Middleware CSP

### Migration Steps

1. **Add `security.csp` to `astro.config.ts`**
2. **Remove CSP header from middleware.ts**:

```typescript
// Before: Manual CSP
const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  ["Content-Security-Policy", "..."],  // ← Remove
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
];

// After: Headers other than CSP only
const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  // CSP is managed by Astro via <meta> tag
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
];
```

1. **Confirm removal of `'unsafe-inline'`**: Since Astro CSP is hash-based, `'unsafe-inline'` is unnecessary. `is:inline` scripts also have their hashes automatically computed.

### Constraints

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| `<ClientRouter />` not supported | View Transitions SPA mode | Use the browser-native View Transition API |
| Shiki not supported | Code highlighting | Use Prism (not applicable to this project) |
| Disabled in `dev` mode | Cannot test during development | Test with `build` + `preview` |
| External scripts | Not included in automatic hash computation | Manually add via `scriptDirective.hashes` |

### CSP Header vs `<meta>` Tag

| Approach | Astro CSP (meta) | middleware (header) |
|----------|------------------|---------------------|
| `frame-ancestors` | Ineffective in `<meta>` | Effective in header |
| `report-uri` | Ineffective in `<meta>` | Effective in header |
| Dynamic policies | Per-page | Per-request |

**Important**: `frame-ancestors` is ineffective in `<meta>` tags. Continue setting `X-Frame-Options: DENY` in middleware, or add `frame-ancestors 'none'` via Cloudflare Workers response headers.

## Migration Checklist

- [ ] Add `security.csp` configuration to `astro.config.ts`
- [ ] Set `default-src`, `img-src`, `connect-src`, `font-src` in `security.csp.directives`
- [ ] Remove `Content-Security-Policy` header from middleware.ts
- [ ] Confirm `'unsafe-inline'` is no longer needed (migrated to hash-based)
- [ ] Keep `X-Frame-Options: DENY` in middleware (`frame-ancestors` is ineffective in `<meta>`)
- [ ] Set prod/dev domains in `security.allowedDomains`
- [ ] Confirm `security.checkOrigin: true` is enabled by default
- [ ] Test CSP behavior with `astro build && astro preview`
- [ ] Verify no CSP violations in browser developer tools
- [ ] After fonts migration (13_FONTS_OPTIMIZATION.md) is complete, remove external domains from `font-src`
