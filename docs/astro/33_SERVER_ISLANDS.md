# Server Islands (`server:defer`)

## What Are Server Islands?

Server islands allow on-demand rendering of dynamic or personalized components individually, without blocking the rest of the page. The page shell renders immediately with fallback content, then each island's content is fetched via a separate request and swapped in when ready.

```astro
---
import Avatar from '../components/Avatar.astro';
---
<Avatar server:defer>
  <div slot="fallback" class="h-8 w-8 rounded-full bg-surface-container animate-pulse" />
</Avatar>
```

### How It Works

1. At build time, Astro replaces `server:defer` components with a small script + fallback content
2. The page loads immediately with fallback placeholders
3. Each island makes a `GET` request to a special `/_server-islands/<ComponentName>` endpoint
4. The endpoint renders the component server-side and returns HTML
5. The script swaps in the real content

Each island loads independently and in parallel.

### Requirements

- An SSR adapter must be installed (the project already uses `@astrojs/cloudflare`)
- Props must be serializable (no functions, no circular references)
- Supported prop types: plain objects, `number`, `string`, `Array`, `Map`, `Set`, `RegExp`, `Date`, `BigInt`, `URL`, `Uint8Array/16/32`

## Current State

The bot-dashboard does **not** use `server:defer` anywhere. All components render synchronously during page SSR. This means:

1. **Slow components block the entire page**: If `UserMenu.astro` takes 200ms to fetch the user avatar, the whole page waits
2. **No caching of static page shells**: The page body changes with every user, so Cloudflare can't cache it
3. **All-or-nothing auth**: Every component in the page sees the same auth context; there's no way to render a cached public shell with personalized islands

### Components That Access `Astro.locals` or `Astro.cookies`

These 17 files access per-request data and are candidates for server island extraction:

| Component | Accesses | Server Island Candidate? |
|-----------|----------|--------------------------|
| `UserMenu.astro` | `Astro.locals.user` | **HIGH** — User avatar/name is personalized |
| `Header.astro` | `Astro.locals` (via UserMenu) | MEDIUM — Contains UserMenu; could wrap just that |
| `Footer.astro` | `Astro.locals.locale` | LOW — Only locale, fast |
| `GuildCard.astro` | `Astro.locals.locale` | LOW — Only locale |
| `Dashboard.astro` (layout) | `Astro.locals.user`, `Astro.locals.guilds` | LOW — Layout, not a leaf component |
| `ChannelTable.astro` | `Astro.locals.locale` | LOW — Only locale |
| `ChannelConfigForm.astro` | `Astro.locals.locale` | LOW — Only locale |
| `ChannelAddModal.astro` | `Astro.locals.locale` | LOW — Only locale |
| `DeleteChannelDialog.astro` | `Astro.locals.locale` | LOW — Only locale |

## Issue 1: UserMenu as a Server Island

### Problem

`UserMenu.astro` fetches and displays the authenticated user's avatar and name. It's included in every dashboard page via `Header.astro`. This personalized content prevents caching the page shell.

### Proposed

Convert `UserMenu.astro` to a server island:

```astro
<!-- Header.astro -->
---
import UserMenu from '../../auth/components/UserMenu.astro';
---
<header>
  <nav><!-- static nav items --></nav>
  <UserMenu server:defer>
    <div slot="fallback" class="flex items-center gap-2">
      <div class="h-8 w-8 rounded-full bg-surface-container animate-pulse" />
      <div class="h-4 w-20 rounded bg-surface-container animate-pulse" />
    </div>
  </UserMenu>
</header>
```

Benefits:
- The header renders instantly with a skeleton placeholder
- `UserMenu` loads in parallel without blocking the page
- The rest of the page can potentially be edge-cached

### Caveat: `Astro.url` in Server Islands

Inside a server island, `Astro.url` returns `/_server-islands/UserMenu`, not the actual page URL. If the component needs the page URL (e.g., for "active" link highlighting), use the `Referer` header:

```astro
---
const referer = Astro.request.headers.get('Referer');
const pageUrl = referer ? new URL(referer) : null;
---
```

## Issue 2: Guild-Specific Content on Dashboard Pages

### Problem

On `[guildId].astro`, guild data (channels, config) is fetched via RPC during SSR. This is the slowest part of the page — multiple RPC calls to `APP_WORKER`. The sidebar and header are the same across all guild pages.

### Proposed: Defer Guild Content

```astro
<!-- pages/dashboard/[guildId].astro -->
---
import GuildContent from '../../features/guild/components/GuildContent.astro';
---
<Dashboard>
  <GuildContent server:defer guildId={guildId}>
    <div slot="fallback" class="space-y-4 p-6">
      <div class="h-8 w-48 rounded bg-surface-container animate-pulse" />
      <div class="h-64 rounded-xl bg-surface-container animate-pulse" />
    </div>
  </GuildContent>
</Dashboard>
```

This would require extracting the guild-specific content into a separate `.astro` component. The `guildId` prop is serializable (string).

### Trade-off

Server islands add an extra HTTP request per island. For the `[guildId]` page, if the guild content is already the main purpose of the page, deferring it means the user sees only a skeleton initially. This may or may not be preferable to waiting for the full page. Consider this based on actual RPC latency — if RPC calls typically complete in <200ms, the extra round-trip may not be worth it.

## Issue 3: Fallback Content Design

### Problem

Server islands require meaningful fallback content to avoid layout shift (CLS). Without proper fallback, the page jumps when island content loads.

### Proposed: Skeleton Patterns

Create reusable skeleton components for common patterns:

```astro
<!-- features/shared/components/Skeleton.astro -->
---
interface Props {
  variant: 'avatar' | 'text' | 'card' | 'table-row';
  class?: string;
}
const { variant, class: className } = Astro.props;

const variantClasses = {
  avatar: 'h-8 w-8 rounded-full',
  text: 'h-4 w-full rounded',
  card: 'h-32 w-full rounded-xl',
  'table-row': 'h-12 w-full rounded',
};
---
<div
  class:list={[
    'animate-pulse bg-surface-container',
    variantClasses[variant],
    className,
  ]}
  aria-hidden="true"
/>
```

Usage in fallback slots:

```astro
<UserMenu server:defer>
  <div slot="fallback" class="flex items-center gap-2">
    <Skeleton variant="avatar" />
    <Skeleton variant="text" class="w-20" />
  </div>
</UserMenu>
```

## Issue 4: Caching Server Islands on Cloudflare

### Problem

Server island responses are fetched via `GET` requests, making them cacheable with `Cache-Control` headers. On Cloudflare Workers, this means island responses can be cached at the edge, dramatically reducing latency for subsequent visits.

### Proposed: Cache-Control for Semi-Static Islands

For islands whose content changes infrequently (e.g., guild metadata, announcement count), add cache headers:

```astro
---
// GuildSidebar.astro (used as server island)
Astro.response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
---
```

For user-specific islands (e.g., UserMenu with avatar), use private caching:

```astro
---
Astro.response.headers.set('Cache-Control', 'private, max-age=300');
---
```

### Caveat: Props Size and POST Fallback

If props are too large (URL exceeds 2048 bytes), Astro sends a `POST` request instead of `GET`. POST requests are NOT cached by browsers or CDNs. Keep props minimal — pass only IDs and let the island fetch its own data.

## Issue 5: `ASTRO_KEY` for Cloudflare Workers

### Problem

Astro encrypts props passed to server islands. A new encryption key is generated on each build. In rolling deployments or multi-region setups, the frontend (which encrypted the props) and the backend (which decrypts them) may use different keys temporarily.

### Proposed

For Cloudflare Workers deployments, generate and set a stable `ASTRO_KEY`:

```bash
# Generate once
astro create-key
# Output: ASTRO_KEY=base64encodedkey...

# Set in wrangler.jsonc or Cloudflare dashboard
```

Add to `wrangler.jsonc`:

```jsonc
{
  "vars": {
    // ... existing vars
  }
  // ASTRO_KEY should be set as a secret, not in vars:
  // wrangler secret put ASTRO_KEY
}
```

This ensures encryption/decryption stays in sync across deployments.

## Issue 6: Server Islands + View Transitions

### Consideration

When using `<ClientRouter />` (View Transitions), server islands interact with the transition lifecycle:

1. **Initial page load**: Islands load normally via their injected scripts
2. **Client-side navigation**: The new page HTML includes the island scripts, which fire after `astro:after-swap`
3. **Fallback content**: During transition, the fallback shows briefly before island content loads

This means on client-side navigation, users may see:
1. Old page → transition → new page with fallback → island content fills in

This is generally acceptable and even desirable (fast perceived navigation). But for islands that are the primary content of a page, consider whether the double-flash (transition + island load) is a good UX.

### Mitigation

For critical-path islands, use `transition:persist` on the island wrapper if the content doesn't change between pages:

```astro
<div transition:persist="user-menu">
  <UserMenu server:defer>
    <Skeleton slot="fallback" variant="avatar" />
  </UserMenu>
</div>
```

## Migration Checklist

- [ ] Evaluate `UserMenu.astro` as first server island candidate
- [ ] Create `Skeleton.astro` component for fallback content
- [ ] Extract guild-specific content from `[guildId].astro` into a separate component (if deferring)
- [ ] Test server islands with `@astrojs/cloudflare` adapter in dev and production
- [ ] Generate `ASTRO_KEY` and configure in Cloudflare secrets
- [ ] Add `Cache-Control` headers to semi-static server islands
- [ ] Test interaction between server islands and View Transitions (`<ClientRouter />`)
- [ ] Ensure fallback content matches final layout dimensions (prevent CLS)
- [ ] Document which components are server islands in the component inventory
