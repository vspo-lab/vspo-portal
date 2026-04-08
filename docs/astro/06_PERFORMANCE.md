# Performance Optimization

## Current Issues

1. **LP TTFB** — Bot Stats API call blocks page rendering
2. **JS bundle size** — vanilla JS is not module-split. React migration enables automatic code splitting
3. **Font loading** — Google Fonts preload occurs on every page
4. **Image optimization** — Direct `<img>` tag usage, Astro's `<Image>` not used
5. **View Transitions** — prefetch may be too aggressive across the entire viewport

## Deferred Rendering with Server Islands

### Bot Stats (LP)

```astro
<!-- Before: Affects TTFB of entire page -->
---
const stats = await fetchBotStats(); // blocking
---
<DigitRoll value={stats.serverCount} />

<!-- After: Deferred with Server Island -->
<BotStats server:defer>
  <div slot="fallback" class="animate-pulse h-16 w-32 bg-gray-200 rounded" />
</BotStats>
```

**Effect**: Improves LP TTFB by 200-500ms (equivalent to API response time)

### GuildCard Channel Count

```astro
<!-- Before: Channel count for all guilds fetched when retrieving guild list -->
<GuildCard guild={guild} channelCount={counts[guild.id]} />

<!-- After: Only channel count is deferred -->
<GuildCard guild={guild}>
  <ChannelCount server:defer guildId={guild.id}>
    <span slot="fallback" class="animate-pulse">...</span>
  </ChannelCount>
</GuildCard>
```

### Server Islands Constraints and Behavior (Verified via Astro MCP)

- Props of `server:defer` components must be serializable
- Props are encrypted and included in the query string (GET request)
  - If the URL exceeds 2048 bytes, it automatically falls back to POST
  - The `ASTRO_KEY` environment variable controls the encryption key during rolling deploys
- Each Server Island is processed as an independent request — beware of N+1 problems
- `Astro.locals` and `Astro.request` are not accessible — pass auth info via props
  - `Astro.url` returns the island's request URL. The original page URL can be obtained from the `Referer` header
- Cloudflare adapter natively supports Server Islands

## Hydration Directive Optimization

```yaml
client:load    → Immediate hydration. Interactive elements where CLS should be avoided
client:idle    → After requestIdleCallback. Low-priority UI
client:visible → IntersectionObserver. Elements below the fold
client:only    → No SSR. Elements that don't need SSR, such as theme toggle
client:media   → Conditional on media query. Mobile-only UI
```

### Recommended Directive Mapping

| Component | Directive | Reason |
|-----------|-----------|--------|
| ChannelConfigModal | `client:load` | User may interact immediately |
| ChannelAddModal | `client:load` | Displayed immediately on button click |
| DeleteChannelDialog | `client:load` | Displayed immediately on button click |
| ThemeToggle | `client:load` | Prevents FOUC. Shows correct icon right after page display |
| FlashMessage | `client:idle` | Sufficient to display after page load |
| UserMenu | `client:idle` | Rarely interacted with immediately |
| LanguageSelector | `client:idle` | Rarely interacted with immediately |
| FeatureShowcase (LP) | `client:visible` | When below the fold |
| DigitRoll (LP) | `client:visible` | When below the fold |

## Prefetch Optimization

### Current State

```typescript
// astro.config.ts
prefetch: {
  prefetchAll: false,
  defaultStrategy: "viewport",
}
```

### Proposed Improvement

```typescript
prefetch: {
  prefetchAll: false,
  defaultStrategy: "hover", // Changed from viewport to hover (Astro's default is also "hover")
}
```

**Reason**: `viewport` prefetches all links visible on screen, increasing data consumption on mobile. `hover` only prefetches when there is user intent. Astro officially recommends `hover` as the default.

**Note**: When using `<ClientRouter />`, `prefetchAll: true` becomes the default. Explicitly set `prefetchAll: false`.

For important navigation (dashboard sidebar links), specify `data-astro-prefetch="viewport"` individually:

```astro
<a href={`/dashboard/${guildId}`} data-astro-prefetch="viewport">
  Channels
</a>
```

### Speculation Rules API (Future)

Enabling `experimental.clientPrerender` for Chrome makes the `eagerness` option available in the `prefetch()` API. Browser-native prerendering via `<script type="speculationrules">` becomes possible:

```tsx
import { prefetch } from 'astro:prefetch';
// Prerender important pages immediately
prefetch('/dashboard', { eagerness: 'immediate' });
// Be conservative with resource-heavy pages
prefetch('/dashboard/settings', { eagerness: 'conservative' });
```

## Route Caching (Experimental)

Astro 6's `experimental.routeCache` caches server-rendered results to avoid re-rendering identical requests.

### Per-Page Cache Strategy

| Page | maxAge | swr | Reason |
|------|--------|-----|--------|
| `/` (LP) | 3600s | - | Static content |
| `/announcements` | 1800s | - | Low update frequency |
| `/dashboard/guilds` | 300s | 3600s | Guild list |
| `/dashboard/[guildId]` | 60s | 300s | Channel settings (high update frequency) |

### Cache Invalidation After Actions

After executing Actions such as channel add/delete, invalidate cache using `tags`. Maintain consistency with authentication using per-user cache keys (`user:xxx`).

-> Details: [16_ADVANCED_FEATURES.md](./16_ADVANCED_FEATURES.md#1-実験的ルートキャッシング-astro-6)

## Font Optimization

-> Details: [13_FONTS_OPTIMIZATION.md](./13_FONTS_OPTIMIZATION.md)

Use Astro 6's `fonts` configuration to download Google Fonts at build time and self-host. `optimizedFallbacks` automatically reduces CLS. External font domains can be removed from CSP.

## Image Optimization

### Leveraging Astro Image

```astro
---
import { Image } from "astro:assets";
import botLogo from "../assets/bot-logo.png";
---

<!-- Before -->
<img src="/bot-logo.png" alt="Bot Logo" />

<!-- After: Automatic optimization with <Image> -->
<Image src={botLogo} alt="Bot Logo" width={200} height={200} format="webp" />
```

**Effects**:

- Automatic WebP/AVIF conversion
- Resizing to appropriate dimensions
- CLS prevention with `width`/`height` attributes
- Lazy loading by default (`loading="lazy"`, `decoding="async"`)

### Leveraging the `<Picture>` Component

When multiple format support is needed:

```astro
---
import { Picture } from "astro:assets";
import heroImage from "../assets/hero.png";
---
<Picture src={heroImage} formats={['avif', 'webp']} alt="Hero" />
<!-- Output: <picture> tag with <source> for avif, webp + <img> fallback -->
```

### Cloudflare Images Binding

With the Cloudflare adapter, `imageService: 'cloudflare-binding'` is the default. On-demand transformation via Cloudflare Images:

```typescript
// astro.config.ts
adapter: cloudflare({
  imageService: 'cloudflare-binding', // Default, no need to specify explicitly
})
```

### Avatar Images

Discord avatar URLs are external images. Runtime transformation is possible via Cloudflare Images Binding, but for simplicity, handle with HTML attributes:

- `loading="lazy"` attribute
- `width`/`height` attributes for CLS prevention
- `decoding="async"` attribute

```astro
<img
  src={avatarUrl}
  alt={`${username}'s avatar`}
  width={32}
  height={32}
  loading="lazy"
  decoding="async"
/>
```

### SVG Optimization (Astro 5.16+)

```typescript
// astro.config.ts
experimental: {
  svgo: true, // Automatic optimization of SVG components
}
```

## React Island Bundle Optimization

### Code Splitting

Astro automatically bundles each island as a separate chunk. No additional configuration needed.

### Shared Dependencies

When multiple islands use the same dependencies, Astro extracts them as shared chunks:

- `react`, `react-dom` — shared across all islands
- `nanostores`, `@nanostores/react` — shared across all islands
- `zod` — shared across islands that use validation

### Dynamic Import

Lazy load heavy components with dynamic import:

```tsx
import { lazy, Suspense } from "react";

const MemberPicker = lazy(() => import("./CustomMemberPicker"));

function ChannelConfigModal() {
  return (
    <dialog>
      <Suspense fallback={<Skeleton />}>
        <MemberPicker />
      </Suspense>
    </dialog>
  );
}
```

## Core Web Vitals Targets

| Metric | Target | Current Issue |
|--------|--------|--------------|
| LCP | < 2.5s | Bot Stats API is blocking -> Resolved with Server Islands |
| FID/INP | < 200ms | Large vanilla JS scripts cause parse blocking -> Resolved with React island code splitting |
| CLS | < 0.1 | Font FOUT -> font-display: swap + size specification |
| TTFB | < 800ms | Cloudflare Workers is fast. No issues |

## Measurement Tools

```bash
# Lighthouse CI
pnpm add -D @lhci/cli

# Add to astro.config.ts
import { defineConfig } from "astro/config";
// Runtime measurement is limited on Cloudflare Workers,
// so Lighthouse CI on a staging environment is recommended
```
