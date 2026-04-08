# All Page Improvements

## 1. `pages/index.astro` — Landing Page

### Current State (266 lines)

- Authenticated users are redirected to `/dashboard`
- Hero section, Bot Stats (DigitRoll), Feature Cards (dialog popup), CTA
- 30-line `<script>` for feature popup trigger (AbortController pattern)

### Improvements

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Islands** | Feature popup uses vanilla JS | Migrate to `FeatureShowcase` React island (`client:visible`) |
| **Server Islands** | Bot Stats API call delays overall page TTFB | Lazy render with `<BotStats server:defer>` |
| **Performance** | Google Fonts preload is in Base.astro | Preload LP-only fonts in LP. Not needed in Dashboard |
| **SEO** | No structured data | Add WebApplication schema via `application/ld+json` |
| **a11y** | Feature card dialog trigger is a `<div>` | Change to `<button>`, add `aria-haspopup="dialog"` |
| **a11y** | DigitRoll has no `aria-live` | Add `aria-live="polite"` + hidden text for screen readers |
| **i18n** | Hero text is in dict.ts but SEO meta is not translated | Add `<html lang>` + alternateLinks + hreflang |
| **Code quality** | AbortController pattern in feature popup script | Becomes unnecessary with React migration |

### Structure After Migration

```astro
---
// server-side
const stats = null; // defer to Server Island
const features = getFeatures(locale);
---

<Base>
  <Hero />
  <BotStats server:defer>
    <StatsPlaceholder slot="fallback" />
  </BotStats>
  <FeatureShowcase client:visible features={features} />
  <CTA />
</Base>
```

---

## 2. `pages/404.astro` — Not Found Page

### Current State

- Simple static page using the Button component

### Improvements

| Category | Problem | Improvement |
|----------|---------|-------------|
| **a11y** | Page title does not include "404" | `<title>404 - Page Not Found</title>` |
| **UX** | Only a back button | Also add a "Return to Dashboard" link |
| **i18n** | Verify text is translated | Add 404 text to dict.ts |
| **SEO** | Missing `<meta name="robots" content="noindex">` | Add it |

---

## 3. `pages/dashboard/index.astro` — Server List Page

### Current State

- Fetches guild list via `ListGuildsUsecase.execute()`
- Caches guild summary in session
- Displays GuildCards in installed / not-installed sections

### Improvements

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Server Islands** | Channel count per guild is fetched during main rendering | Lazy-load channel count display with `server:defer` |
| **Performance** | Session cache has no expiration | TTL-based cache or stale-while-revalidate pattern |
| **UX** | Poor empty state when there are 0 guilds | Illustration + "Invite Bot" CTA button |
| **UX** | No loading state | Skeleton UI for guild cards |
| **a11y** | Section heading hierarchy may be incorrect | `<h2>` installed / `<h2>` not-installed |
| **Error handling** | UX when Discord API errors occur | ErrorAlert + retry button |

### Structure After Migration

```astro
---
const guilds = await ListGuildsUsecase.execute(session);
---

<Dashboard>
  <h1>{t("dashboard.servers")}</h1>
  {guilds.length === 0 ? (
    <EmptyState />
  ) : (
    <>
      <section>
        <h2>{t("dashboard.installed")}</h2>
        {installedGuilds.map(g => (
          <GuildCard guild={g}>
            <ChannelCount server:defer guildId={g.id}>
              <Skeleton slot="fallback" />
            </ChannelCount>
          </GuildCard>
        ))}
      </section>
      <section>
        <h2>{t("dashboard.notInstalled")}</h2>
        {/* ... */}
      </section>
    </>
  )}
</Dashboard>
```

---

## 4. `pages/dashboard/[guildId].astro` — Guild Detail Page (Channel Settings)

### Current State (181 lines)

- The most complex page. Cached guild summary, parallel data fetching, Astro Action results processing
- Contains ChannelTable, ChannelConfigForm, DeleteChannelDialog, ChannelAddModal
- 8-line `<script>` for dialog close handling during View Transitions

### Improvements

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Islands** | All dialogs/forms use vanilla JS | Migrate to React islands (see 02_REACT_MIGRATION.md) |
| **Islands** | Dialog close script is a View Transitions workaround | Automatic cleanup on unmount with React, making this unnecessary |
| **State management** | Page reloads via PRG after channel addition | Nano Store + optimistic UI updates |
| **State management** | Action result (flash message) goes through session | Manage via Nano Store's `$flashMessage` |
| **Performance** | Parallel data fetching is good, but no partial render on error | `Promise.allSettled` + ErrorAlert only for failed parts |
| **UX** | Empty state when there are 0 channels | Empty state with "Add Channel" button |
| **UX** | Feedback after saving settings is only a flash after PRG | Optimistic UI + inline success indicator |
| **a11y** | Dialog focus management is manual JS | Automatic focus trap via React useDialog hook |
| **Security** | Action result error messages displayed as-is | Sanitize error messages |

### Structure After Migration

```astro
---
const [channels, members] = await Promise.allSettled([
  fetchChannels(guildId),
  fetchMembers(guildId),
]);
---

<Dashboard>
  <ChannelTable channels={channels} />
  <ChannelConfigPanel
    client:load
    channels={channels}
    members={members}
    guildId={guildId}
  />
  <!-- ConfigModal, DeleteDialog, AddModal are integrated within ChannelConfigPanel -->
</Dashboard>
```

---

## 5. `pages/dashboard/announcements.astro` — Global Announcements

### Current State

- Fetches all announcement data from `announcements.ts`
- No guild context

### Improvements

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Duplication** | Nearly identical to `[guildId]/announcements.astro` | Extract into a shared `AnnouncementList` component |
| **Performance** | Renders all items | Pagination or virtual scrolling |
| **UX** | No filtering or search | Filter by type, date range |
| **i18n** | Verify date formatting is locale-aware | Specify locale with `Intl.DateTimeFormat` |
| **a11y** | Announcement card semantics | `<article>` + `<time datetime>` |

---

## 6. `pages/dashboard/[guildId]/announcements.astro` — Guild-Specific Announcements

### Current State

- Fetches guild data for the sidebar
- Otherwise nearly identical to `announcements.astro`

### Improvements

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Duplication** | Duplicates the global version | Extract into a shared `AnnouncementList.astro` component |
| **Data** | No guild-specific announcement filter | Show only announcements related to the guild |
| **Navigation** | No breadcrumbs | Add `Guild Name > Announcements` breadcrumb |

---

## 7. `pages/auth/discord.ts` — OAuth Start Endpoint

### Current State

- Builds OAuth URL, saves state to session, 302 redirect

### Improvements

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Security** | Verify state parameter generation method | Confirm `crypto.randomUUID()` is used |
| **Security** | Possibly missing PKCE (Proof Key for Code Exchange) support | Add PKCE support |
| **Error** | Timeout when Discord is unresponsive | Strengthen validation when building redirect URL |

---

## 8. `pages/api/guilds/[guildId]/channels.ts` — Channel List API

### Current State

- GET endpoint. Returns Discord channels for a guild
- Called via fetch from ChannelAddModal

### Improvements

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Security** | Guild permission check | Verify the user is a member of the guild |
| **Performance** | No response caching | `Cache-Control` header (short TTL) |
| **Type safety** | Response type not explicit | Define response type with Zod schema |
| **Error** | Discord API error handling | Appropriate HTTP status codes + error messages |

---

## 9. `pages/api/change-locale.ts` — Locale Change API

### Current State

- POST endpoint. Saves locale to session, redirects

### Improvements

| Category | Problem | Improvement |
|----------|---------|-------------|
| **UX** | Causes a page reload | Migrate to URL-based locale switching using Astro's i18n routing |
| **Security** | Verify CSRF protection | Migrating to Astro Actions provides automatic CSRF protection |
| **Validation** | Locale value validation | Accept only allowed locales |
