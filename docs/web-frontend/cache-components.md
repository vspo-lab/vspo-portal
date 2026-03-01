# Cache Components Guidelines (Next.js 16)

## Prerequisites

In this template's `services/web/next.config.ts`, the following are enabled by default:

- `reactCompiler: true`
- `cacheComponents: true`

Under these settings, App Router design is based on "Server Components + Cache Components + Suspense boundaries."

## Design Principles

1. **Make cacheable operations explicit**
   - Add `'use cache'` to Server Components / functions that should be cached.
   - Specify cache update strategies explicitly with `cacheLife` and `cacheTag`.
2. **Define dynamic data boundaries first**
   - Treat locations that read request-dependent data such as `cookies()`, `headers()`, `searchParams` as dynamic boundaries.
   - Place `<Suspense>` below dynamic boundaries to return the static shell first.
3. **Separate personalization from shared cache**
   - Use `'use cache: private'` for user-specific data.
   - Use regular `'use cache'` for shareable data.
4. **Apply `'use cache'` at small units of responsibility**
   - Do not cache an entire page at once; apply it at meaningful subtree/function granularity.
   - Separate into reusable "data function + Presenter" units.

## Recommended Patterns

### 1. Separate Cacheable Read Functions

```tsx
import { cacheLife, cacheTag } from "next/cache";

export async function getCatalog() {
  "use cache";
  cacheTag("catalog");
  cacheLife({ stale: 300 });

  const response = await fetch("https://example.com/catalog");
  return response.json();
}
```

### 2. Fetch Dynamic Data in a Non-Cached Layer and Pass It Down

```tsx
import { cookies } from "next/headers";

async function ProfileContent() {
  const sessionId = (await cookies()).get("session-id")?.value ?? "guest";
  return <CachedProfile sessionId={sessionId} />;
}

async function CachedProfile({ sessionId }: { sessionId: string }) {
  "use cache";
  const profile = await getProfile(sessionId);
  return <ProfilePresenter profile={profile} />;
}
```

### 3. Use Private Cache for User-Specific Information

```tsx
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";

async function getRecommendations(productId: string) {
  "use cache: private";
  cacheTag(`recommendations:${productId}`);
  cacheLife({ stale: 60 });

  const sessionId = (await cookies()).get("session-id")?.value ?? "guest";
  return fetchRecommendations(productId, sessionId);
}
```

## Implementations to Avoid

- Placing a shared cache on the same function that reads `cookies()` or `headers()`
- Using `'use cache'` alone without defining cache update conditions (`cacheTag` / `cacheLife`)
- Falling back to dynamic rendering for an entire large page without cache boundaries

## References

- Next.js `cacheComponents`: https://nextjs.org/docs/app/getting-started/cache-components
- Next.js `'use cache'`: https://nextjs.org/docs/app/api-reference/directives/use-cache
- Next.js `'use cache: private'`: https://nextjs.org/docs/app/api-reference/directives/use-cache-private
