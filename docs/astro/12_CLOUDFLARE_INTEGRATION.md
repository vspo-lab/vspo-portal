# Cloudflare Workers Integration Improvements

## Current State

- Using `@astrojs/cloudflare` adapter
- KV and D1 bindings configured in `wrangler.jsonc`
- Session management is a custom implementation

## Improvements

### 1. Migration to Astro Sessions API

**Current**: Custom session management (manually operating cookies / KV in middleware.ts)

**Improvement**: Use the built-in Sessions API from Astro 5.7+

```typescript
// Cloudflare adapter automatically uses KV as session storage
// No need to define KV binding in wrangler.jsonc (auto-provisioned)

// astro.config.ts
adapter: cloudflare({
  sessionKVBindingName: 'SESSION', // Default name, customizable
})
```

```typescript
// Usage in pages
const user = await Astro.session?.get('user');
Astro.session?.set('lastVisit', new Date());

// Usage in API endpoints
export async function POST({ session }: APIContext) {
  session.set('cart', updatedCart);
  return Response.json({ success: true });
}

// Usage in Actions
handler: async (input, context) => {
  const user = await context.session?.get('user');
  // ...
}

// Usage in Middleware
export const onRequest = defineMiddleware(async (context, next) => {
  context.session?.set('lastVisit', new Date());
  return next();
});
```

**Session operations**:

- `session.get(key)` — Retrieve data
- `session.set(key, value, { ttl })` — Save data with TTL
- `session.regenerate()` — Regenerate session ID (after authentication)
- `session.destroy()` — Destroy session (logout)

### 2. Type-safe Environment Variables (`astro:env`)

**Current**: No type safety with `import.meta.env.SECRET_*`

**Improvement**:

```typescript
// astro.config.ts
import { defineConfig, envField } from "astro/config";

export default defineConfig({
  env: {
    schema: {
      // Server secrets (not exposed to client)
      DISCORD_CLIENT_ID: envField.string({ context: "server", access: "secret" }),
      DISCORD_CLIENT_SECRET: envField.string({ context: "server", access: "secret" }),
      BOT_API_BASE_URL: envField.string({ context: "server", access: "public" }),
      // Client public (also available on client)
      PUBLIC_SITE_URL: envField.string({ context: "client", access: "public", optional: true }),
    },
  },
});
```

```typescript
// Usage: type-safe imports
import { DISCORD_CLIENT_ID, BOT_API_BASE_URL } from "astro:env/server";
import { PUBLIC_SITE_URL } from "astro:env/client";
```

**Cloudflare-specific environment variables**: Also accessible from the `env` object in `cloudflare:workers`:

```typescript
import { env } from 'cloudflare:workers';
const myKV = env.MY_KV;
```

### 3. Cloudflare Images Binding

**Current**: Images served as static files

**Improvement**: On-demand image transformation with Cloudflare Images Binding

```typescript
// astro.config.ts
adapter: cloudflare({
  imageService: 'cloudflare-binding', // Default
  // Local transformation at build time, Cloudflare Images at runtime
  imageService: { build: 'compile', runtime: 'cloudflare-binding' },
})
```

- Static images at build time are optimized with `compile`
- On-demand images on SSR pages are transformed with Cloudflare Images
- Bindings are auto-provisioned

### 4. Leveraging Execution Context

```typescript
// Execute async processing after the response with waitUntil
const cfContext = Astro.locals.cfContext;
cfContext.waitUntil(
  // Log shipping, cache updates, etc.
  sendAnalytics(request)
);
```

### 5. Region Information via the `cf` Object

```typescript
// Access request region information
const cf = Astro.request.cf;
const country = cf?.country; // "JP", "US", etc.
// Can be used for automatic locale detection
```

### 6. Simplifying Wrangler Configuration

With Astro 6 + `@astrojs/cloudflare` v13, a `wrangler.jsonc` with only basic settings is unnecessary:

```jsonc
// Minimal configuration — only needed when custom bindings exist
{
  "name": "bot-dashboard",
  // Only specify when KV, D1, etc. bindings are needed
  "kv_namespaces": [{ "binding": "SESSION", "id": "..." }],
  "d1_databases": [{ "binding": "DB", "database_id": "..." }]
}
```

### 7. Static Assets Caching

Assets built by Astro have hashed filenames, so long-term caching is automatically applied.

If custom headers are needed, use `public/_headers`:

```text
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

## Migration Checklist

- [ ] Migrate custom session management to Astro Sessions API
- [ ] Define environment variables in `astro:env` schema
- [ ] Verify Cloudflare Images Binding functionality
- [ ] Optimize background processing with `waitUntil()`
- [ ] Consider automatic locale detection using `cf.country`
- [ ] Remove unnecessary settings from wrangler.jsonc
