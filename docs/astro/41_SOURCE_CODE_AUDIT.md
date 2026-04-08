# Source Code Audit — Line-Level Findings

## Purpose

This document provides a detailed, file-by-file audit of the bot-dashboard source code with specific line numbers, concrete code patterns, and actionable improvements. Unlike the topic-specific docs (01-40), this is a cross-cutting audit derived from reading every source file.

---

## Critical Findings

### 1. Missing HTTP 404 Status Code

**File**: `src/pages/404.astro` (line 9)

```astro
<!-- Current: renders 404 page content but returns HTTP 200 -->
<Base title="404" noindex>
```

**Fix**: Add `Astro.response.status = 404` in the frontmatter:

```astro
---
Astro.response.status = 404;
---
<Base title="404" noindex>
```

**Impact**: Search engines index the 404 page as a valid page, harming SEO. Monitoring tools report false positives.

---

### 2. Missing CSRF Protection (`checkOrigin`)

**File**: `astro.config.ts` (line 7)

The config has no `security` block. Astro's built-in CSRF protection via `checkOrigin` is not enabled.

```typescript
// Current
export default defineConfig({
  site: "https://discord.vspo-schedule.com",
  output: "server",
  // ...no security config
});
```

**Fix**:

```typescript
export default defineConfig({
  site: "https://discord.vspo-schedule.com",
  output: "server",
  security: {
    checkOrigin: true,
  },
  // ...
});
```

**Impact**: Server endpoints and Actions are vulnerable to CSRF attacks from cross-origin sites. The middleware comment (line 55-58) notes Actions have built-in CSRF via `_astroAction` hidden field, but `checkOrigin` adds Origin header validation as defense-in-depth.

---

### 3. Missing Snowflake Validation in Actions

**File**: `src/actions/index.ts` (lines 32-35, 53-56, 80-83, 101-104)

All four actions (`addChannel`, `updateChannel`, `resetChannel`, `deleteChannel`) use bare `z.string()` for `guildId` and `channelId`:

```typescript
input: z.object({
  guildId: z.string(),   // No format validation
  channelId: z.string(), // No format validation
}),
```

**Fix**: Add Discord Snowflake regex validation:

```typescript
const snowflake = z.string().regex(/^\d{17,20}$/, "Invalid Discord Snowflake ID");

input: z.object({
  guildId: snowflake,
  channelId: snowflake,
}),
```

**Impact**: Without validation, arbitrary strings can be passed to the Discord API, potentially causing unexpected errors or enabling injection into downstream API calls.

---

### 4. API Endpoint Uses `new Response(JSON.stringify(...))` Instead of `Response.json()`

**File**: `src/pages/api/guilds/[guildId]/channels.ts` (lines 14-15, 22-23, 34-35, 40-41)

Four instances of verbose response construction:

```typescript
// Line 14-15 — Current
return new Response(JSON.stringify({ error: "Unauthorized" }), {
  status: 401,
  headers: { "Content-Type": "application/json" },
});
```

**Fix**: Use `Response.json()` (available in all modern runtimes):

```typescript
return Response.json({ error: "Unauthorized" }, { status: 401 });
```

**Impact**: Code clarity. `Response.json()` automatically sets `Content-Type: application/json`.

---

### 5. Missing `trailingSlash` Configuration

**File**: `astro.config.ts`

No `trailingSlash` setting. Astro defaults to `"ignore"`, which means both `/dashboard` and `/dashboard/` resolve to the same page, creating duplicate content for search engines.

**Fix**:

```typescript
export default defineConfig({
  trailingSlash: "never",
  // ...
});
```

---

## Security Findings

### 6. OAuth State Not Cleaned on Logout

**File**: `src/pages/auth/logout.ts` (lines 3-6)

```typescript
export const POST: APIRoute = async (context) => {
  context.session?.destroy();
  return context.redirect("/");
};
```

`session.destroy()` should clear all session data including `oauth_state`. However, if the session driver doesn't fully purge, stale OAuth state could remain. This is likely fine since `destroy()` deletes the entire session, but worth verifying with the Cloudflare KV session driver.

### 7. OAuth Callback State Consumption Is Soft

**File**: `src/pages/auth/callback.ts` (line 18)

```typescript
// Consume state to prevent replay
context.session?.set("oauth_state", "");
```

Setting to empty string rather than deleting. A more robust approach:

```typescript
context.session?.set("oauth_state", undefined);
// or
context.session?.delete?.("oauth_state");
```

### 8. CSP Is Hardcoded String

**File**: `src/middleware.ts` (lines 24-32)

The CSP header is a long hardcoded string, making it error-prone to maintain:

```typescript
const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  [
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
  ],
  // ...
];
```

**Recommendation**: When migrating to Astro 6's `security.csp`, this will be managed declaratively. For now, consider building the CSP programmatically:

```typescript
const cspDirectives = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "img-src": ["'self'", "https://cdn.discordapp.com", "data:"],
  "connect-src": ["'self'", "https://discord.com"],
  "frame-ancestors": ["'none'"],
};
const csp = Object.entries(cspDirectives)
  .map(([key, values]) => `${key} ${values.join(" ")}`)
  .join("; ");
```

### 9. Middleware Auth Uses Optional Chaining on Session Everywhere

**File**: `src/middleware.ts` (lines 74-84, 101-123)

Every `context.session` access uses `?.`, meaning if the session is undefined, operations silently fail:

```typescript
context.session?.set("locale", locale);      // line 84 — silently skipped
context.session?.destroy();                   // line 103 — silently skipped
context.session?.set("accessToken", ...);     // line 121 — silently skipped
```

This is likely intentional (session may not be available in all contexts), but worth documenting as a known pattern. If session is expected to always exist, these should throw.

---

## Performance Findings

### 10. Announcements Page Does Full Guild Fetch (No Session Cache)

**File**: `src/pages/dashboard/[guildId]/announcements.astro` (lines 18-23)

```typescript
const guildsResult = await ListGuildsUsecase.execute({
  accessToken,
  userId: user.id,
  appWorker: env.APP_WORKER,
  includeChannelSummary: false,
});
```

Unlike `[guildId].astro` (which uses session-cached `guildSummaries`), the announcements page always makes the full guild list API call just to get the current guild name for the sidebar.

**Fix**: Use the same session cache pattern as `[guildId].astro`:

```typescript
const cachedGuilds = await Astro.session?.get("guildSummaries");
const cachedGuild = cachedGuilds?.find((g) => g.id === guildId);

const guildsResult = cachedGuild
  ? null
  : await ListGuildsUsecase.execute({ ... });
```

### 11. Landing Page Stats Block Entire Page TTFB

**File**: `src/pages/index.astro` (line 21)

```typescript
const statsResult = await VspoGuildApiRepository.getBotStats(env.APP_WORKER);
```

This API call blocks the entire page render. Since stats are non-critical, this is a prime candidate for `server:defer` (Server Islands).

### 12. Google Fonts Loaded on All Pages

**File**: `src/layouts/Base.astro` (lines 91-103)

Two font families (`M PLUS Rounded 1c` and `Noto Sans JP`) are preloaded on every page, including dashboard pages that may not use the heading font. Consider conditionally loading heading fonts only on LP.

---

## Code Quality Findings

### 13. Duplicate Announcement Rendering Code

**Files**: `src/pages/dashboard/announcements.astro` (lines 30-70) and `src/pages/dashboard/[guildId]/announcements.astro` (lines 48-96)

These two files contain nearly identical announcement rendering code (~40 lines). The only difference is the guild context for the sidebar.

**Fix**: Extract `AnnouncementList.astro`:

```astro
---
// AnnouncementList.astro
interface Props { locale: string; }
const { locale } = Astro.props;
---
{announcements.map((item) => (
  <article class="rounded-xl bg-surface-container-low p-6">
    <!-- shared rendering -->
  </article>
))}
```

### 14. `interface Props` Used Instead of Zod Schema

**Files**: Multiple components use `interface Props` directly:

| File | Line | Current |
|------|------|---------|
| `Base.astro` | 7-11 | `interface Props { title: string; ... }` |
| `Dashboard.astro` | 9-15 | `type Props = { title: string; ... }` |
| `ChannelConfigForm.astro` | 9-15 | `interface Props { ... }` |
| `ChannelTable.astro` | 9-12 | `interface Props { ... }` |
| `ChannelAddModal.astro` | 7-9 | `interface Props { ... }` |
| `DeleteChannelDialog.astro` | 7-9 | `interface Props { ... }` |
| `ErrorAlert.astro` | 2-6 | `interface Props { ... }` |
| `FlashMessage.astro` | 8-11 | `interface Props { ... }` |
| `GuildCard.astro` | 9-12 | `interface Props { ... }` |

**Note**: Astro components infer Props from the frontmatter `interface Props` or `type Props`. Migrating to Zod schemas is a project convention but may add unnecessary complexity for simple component props. Prioritize Zod schemas for API-facing types (Actions, endpoints) over component props.

### 15. FlashMessage Uses Global querySelector

**File**: `src/features/shared/components/FlashMessage.astro` (line 63)

```typescript
document.querySelectorAll<HTMLElement>(".flash-message").forEach((el) => {
```

This queries the entire DOM rather than scoping to a specific instance. Multiple FlashMessage components on the same page would all share the same listener behavior (not a bug since `animationend` is per-element, but not ideal).

**Fix**: Migrate to custom element pattern (interim) or React island.

### 16. Creator Avatar Images Missing `width`/`height`

**Files**: Multiple locations render creator avatar `<img>` tags without explicit dimensions:

| File | Line | Tag |
|------|------|-----|
| `ChannelConfigForm.astro` | 183-185 | `<img src={creator.thumbnailUrl} ... loading="lazy" />` |
| `ChannelTable.astro` | 91-95 | `<img src={creator.thumbnailUrl} ... loading="lazy" />` |

Both are missing `width` and `height` attributes, causing CLS (Cumulative Layout Shift).

**Fix**: Add explicit dimensions:

```html
<img src={creator.thumbnailUrl} alt="" width="24" height="24" class="h-6 w-6 ..." loading="lazy" />
```

### 17. ChannelConfigForm Has 100ms Search Debounce

**File**: `src/features/channel/components/ChannelConfigForm.astro` (line 542)

```typescript
searchTimer = setTimeout(() => { ... }, 100);
```

100ms is too aggressive — it fires on nearly every keystroke. Standard debounce for search is 200-300ms.

**Fix**: Change to 250ms:

```typescript
searchTimer = setTimeout(() => { ... }, 250);
```

Same issue in `ChannelAddModal.astro` (line 141): `setTimeout(() => { ... }, 100)`.

---

## Accessibility Findings

### 18. Dashboard Sidebar Has Good a11y Already

**File**: `src/layouts/Dashboard.astro` (lines 51-65)

The sidebar navigation already has:

- `<nav>` with `aria-label`
- `aria-current="page"` on active links
- Proper heading hierarchy with `<h2>` for guild name
- `focus-visible` styles

**Remaining issue**: The mobile sidebar `<details>` element (line 81) uses a non-standard pattern for navigation. Consider migrating to a proper mobile navigation pattern with `aria-expanded`.

### 19. Delete Dialog Missing `aria-describedby`

**File**: `src/features/channel/components/DeleteChannelDialog.astro` (line 14-19)

```html
<dialog id="delete-channel-modal" aria-labelledby="delete-channel-heading" aria-modal="true">
```

Has `aria-labelledby` but missing `aria-describedby` for the description paragraph (line 52).

**Fix**: Add `id` to the description and `aria-describedby` to the dialog:

```html
<dialog aria-labelledby="delete-channel-heading" aria-describedby="delete-channel-desc">
  <!-- ... -->
  <p id="delete-channel-desc" class="mt-1 text-sm text-on-surface-variant">
```

### 20. ChannelTable Action Buttons Have Good `aria-label`

**File**: `src/features/channel/components/ChannelTable.astro` (lines 132-143)

Both edit and delete buttons already have proper `aria-label` attributes:

```html
<IconButton data-action-edit={ch.channelId} aria-label={`${t(locale, "channel.edit")} #${ch.channelName}`}>
<IconButton variant="destructive" data-action-delete={ch.channelId} aria-label={`${t(locale, "channel.delete")} #${ch.channelName}`}>
```

This is already well-implemented.

### 21. ChannelAddModal Has `role="listbox"` Already

**File**: `src/features/channel/components/ChannelAddModal.astro` (line 62)

```html
<div ... role="listbox" aria-label={t(locale, "channel.add")} data-channel-list>
```

Already implemented. The template items (line 71) use `role="option"` and `aria-selected`.

---

## i18n Findings

### 22. Locale Type Not Strongly Typed

**File**: `src/pages/dashboard/announcements.astro` (line 61)

```typescript
{item.title[locale as keyof typeof item.title] ?? item.title.ja}
```

The `locale as keyof` cast suggests the locale type isn't narrowed to `"ja" | "en"`. The `Astro.locals.locale` type should be `"ja" | "en"`, not `string`.

### 23. `change-locale.ts` Already Validates Locale

**File**: `src/pages/api/change-locale.ts` (line 8)

```typescript
if (locale === "ja" || locale === "en") {
  context.session?.set("locale", locale);
}
```

Good — already validates allowed locales. Migration to Astro Action would use `z.enum(["ja", "en"])`.

---

## Architecture Findings

### 24. Session Data Shape Is Implicit

The session stores multiple untyped keys:

- `locale` (string)
- `user` (object)
- `accessToken` (string)
- `refreshToken` (string)
- `expiresAt` (number)
- `oauth_state` (string)
- `guildSummaries` (array)

None of these are type-checked. Consider defining a typed session schema:

```typescript
const SessionSchema = z.object({
  locale: z.enum(["ja", "en"]).optional(),
  user: DiscordUserSchema.optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(),
  oauth_state: z.string().optional(),
  guildSummaries: z.array(GuildSummarySchema).optional(),
});
```

### 25. Landing Page Has Inline `onclick` Handler

**File**: `src/pages/index.astro` (line 91)

```html
<button ... onclick="this.closest('[role=alert]')?.remove()">
```

This inline `onclick` works but violates the CSP `script-src 'self' 'unsafe-inline'` dependency. If CSP is tightened, this will break. Consider using `data-action-dismiss` with an event listener instead.

### 26. View Transition Dialog Cleanup Is Good

**File**: `src/pages/dashboard/[guildId].astro` (lines 172-179)

```typescript
document.addEventListener("astro:before-preparation", () => {
  for (const d of document.querySelectorAll("dialog[open]")) (d as HTMLDialogElement).close();
});
```

This handles the known issue of `<dialog>` elements persisting in the top layer during View Transitions. Well-implemented.

---

## Summary Priority Matrix

| Priority | Finding | Effort |
|----------|---------|--------|
| **Critical** | #1 Missing 404 status code | 1 line |
| **Critical** | #2 Missing `checkOrigin` CSRF protection | 3 lines |
| **Critical** | #3 Missing Snowflake validation in Actions | 10 lines |
| **High** | #4 Use `Response.json()` in channels API | 4 edits |
| **High** | #5 Missing `trailingSlash` config | 1 line |
| **High** | #10 Announcements page missing session cache | 10 lines |
| **High** | #16 Creator images missing dimensions | 4 edits |
| **Medium** | #8 CSP as hardcoded string | Refactor |
| **Medium** | #13 Duplicate announcement rendering | Extract component |
| **Medium** | #17 Search debounce too aggressive | 2 edits |
| **Low** | #7 OAuth state soft consumption | 1 line |
| **Low** | #12 Fonts on all pages | Conditional loading |
| **Low** | #25 Inline onclick handler | Event delegation |

---

## Checklist

- [ ] Add `Astro.response.status = 404` to `404.astro`
- [ ] Add `security: { checkOrigin: true }` to `astro.config.ts`
- [ ] Add `trailingSlash: "never"` to `astro.config.ts`
- [ ] Add Snowflake regex validation to all Action inputs
- [ ] Replace `new Response(JSON.stringify(...))` with `Response.json()` in channels API
- [ ] Add `width`/`height` to all avatar `<img>` elements
- [ ] Use session cache in `[guildId]/announcements.astro`
- [ ] Extract shared `AnnouncementList.astro` component
- [ ] Increase search debounce to 250ms in ChannelConfigForm and ChannelAddModal
- [ ] Add `aria-describedby` to DeleteChannelDialog
- [ ] Build CSP programmatically in middleware
- [ ] Replace inline `onclick` on error dismiss button with event listener

## Cross-References

- [03_PAGE_IMPROVEMENTS.md](./03_PAGE_IMPROVEMENTS.md) — Page-level improvements
- [04_COMPONENT_IMPROVEMENTS.md](./04_COMPONENT_IMPROVEMENTS.md) — Component-level improvements
- [09_SECURITY.md](./09_SECURITY.md) — Security hardening details
- [35_ROUTING_PATTERNS.md](./35_ROUTING_PATTERNS.md) — Routing and error pages
- [39_COOKIES_AND_ENDPOINTS.md](./39_COOKIES_AND_ENDPOINTS.md) — Endpoint patterns
- [40_MIGRATION_PRIORITY_MATRIX.md](./40_MIGRATION_PRIORITY_MATRIX.md) — Priority matrix
