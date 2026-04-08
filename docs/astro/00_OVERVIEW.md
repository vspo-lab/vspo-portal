# bot-dashboard Improvement Plan Overview

## Current Architecture

| Item | Status | Version / Notes |
|------|--------|-----------------|
| Framework | Astro (SSR, `output: "server"`) | All pages server-rendered by default; use `export const prerender = true` for static pages |
| Deployment | Cloudflare Workers (`@astrojs/cloudflare`) | Adapter v13+ required for Astro 6 |
| CSS | Tailwind CSS v4 (`@tailwindcss/vite`) | CSS-first config via `@theme` directives (no `tailwind.config.js`) |
| i18n | Astro built-in (`defaultLocale: "ja"`, `locales: ["ja", "en"]`) + custom dictionary (`dict.ts`) | |
| Page Transitions | `<ClientRouter />` (View Transitions) + `prefetch: "viewport"` | `<ClientRouter />` introduced in astro@5.0.0 (renamed from `<ViewTransitions />`); prefetch enabled by default when using ClientRouter |
| Authentication | Discord OAuth2 (middleware + session) | |
| Session Management | Astro Sessions API | astro@5.7.0+; driver configured via `sessionDrivers.cloudflareKV()` function form (Astro 6) |
| Server Actions | Astro Actions (`defineAction`, `accept: "form"`) | `defineAction()` supports `accept: "form"` or `accept: "json"` |
| Client JS | **Hybrid** — React Islands for new components, vanilla JS (`<script>` tags, AbortController pattern) for unmigrated ones | |
| State Management | None (DOM-based for vanilla JS components) | |
| Testing | vitest + @testing-library/react (150 tests passing) | |
| React Integration | `@astrojs/react` installed and configured | Via `@astrojs/react` integration |
| Environment Variables | `astro:env` | astro@5.0.0; type-safe environment variable access |

## Progress Status

### Completed

- **Phase 1: Foundation Setup** — `@astrojs/react`, `react`, `react-dom` installed; `astro.config.ts` and `vitest.config.ts` configured with `react()` integration; `vitest.setup.ts` extended with happy-dom globals for React DOM rendering
- **Phase 2 (partial): ThemeToggle React Island** — First React Island in the project. `ThemeToggle.tsx` replaces `ThemeToggle.astro`, used with `client:load` in `Header.astro`. 6 unit tests passing.

### Pending Cleanup

- `ThemeToggle.astro` — no longer imported, can be deleted
- `theme.ts` — no longer imported, can be deleted

## Directory Structure (feature-based)

```text
src/
  actions/index.ts          # Astro Actions (addChannel, updateChannel, etc.)
  features/
    auth/                   # Discord OAuth
      components/UserMenu.astro
      domain/discord-user.ts
      repository/discord-api.ts
      usecase/login.ts
    channel/                # Channel config CRUD
      components/ChannelTable.astro, ChannelConfigForm.astro,
                 ChannelAddModal.astro, DeleteChannelDialog.astro
      domain/channel-config.ts, member-type.ts
      repository/vspo-channel-api.ts
      usecase/add-channel.ts, delete-channel.ts
    guild/                  # Server list
      components/GuildCard.astro
      domain/guild.ts
      repository/vspo-guild-api.ts
      usecase/list-guilds.ts
    shared/                 # Shared UI
      components/Button.astro, Card.astro, Header.astro, Footer.astro,
                 FlashMessage.astro, ErrorAlert.astro,
                 ThemeToggle.tsx (React Island),
                 ThemeToggle.astro (deprecated),
                 LanguageSelector.astro, MenuItem.astro, IconButton.astro,
                 AvatarFallback.astro, dialog-helpers.ts,
                 close-on-outside-click.ts, theme.ts (deprecated)
      domain/creator.ts
    landing/                # Landing page
      components/FeaturePopup.astro, DigitRoll.astro, ScrollReveal.astro
    announcement/           # Announcements
      data/announcements.ts
  i18n/dict.ts              # ja/en dictionary + t() helper
  layouts/Base.astro, Dashboard.astro
  middleware.ts             # Security headers + auth + token refresh
  pages/                    # Routing
    index.astro             # LP (unauthenticated) / redirect (authenticated)
    404.astro
    auth/discord.ts, callback.ts, logout.ts
    api/change-locale.ts, guilds/[guildId]/channels.ts
    dashboard/index.astro, [guildId].astro, announcements.astro,
              [guildId]/announcements.astro
```

## Improvement Strategy

1. **Maintain feature-based structure** — Current `features/` directory design follows Clean Architecture; keep it
2. **Adopt Islands Architecture in parallel** — Convert interactive parts to React Islands only
3. **Incrementally replace vanilla JS with React components** — Use `client:load` / `client:idle` / `client:visible` directives
4. **Share state across islands with Nano Stores** — Use `@nanostores/react`
5. **Align with Astro best practices** — CSP, Server Islands, Content Layer, etc.
6. **Leverage Astro built-in features** — Sessions API, `astro:env` type-safe env vars, `<Image>` / `<Picture>` optimization, Cloudflare bindings

## Astro 6 Key Changes

Summary of breaking changes relevant to this project:

| Change | Detail |
|--------|--------|
| `sessionDrivers` function form | Session drivers use function syntax (e.g. `sessionDrivers.cloudflareKV()`) instead of string-based config |
| `ActionAPIContext.rewrite()` removed | Rewrite calls inside Actions are no longer supported |
| Container API environment | Container API requires `node` environment in Vitest config |
| Cloudflare adapter entrypoint | Changed to `@astrojs/cloudflare/entrypoints/server` |
| `Astro.locals.runtime` removed | Use `cloudflare:workers` module instead for accessing Cloudflare bindings |
| Built-in CSP | Configure via `security.csp` in `astro.config.ts` |
| `clientAddress` in middleware | `clientAddress` is now available directly in middleware context |
| `serverIslandMappings` config | New config option for controlling Server Island behavior |

## Astro 6 Stabilized Features

The following features graduated from experimental to stable in Astro 6:

| Feature | Experimental Flag | Astro 6 Stable Config | Doc Reference |
|---------|------------------|----------------------|---------------|
| Content Security Policy | `experimental.csp` | `security.csp` | [19_CSP_BUILTIN.md](./19_CSP_BUILTIN.md) |
| Fonts API | `experimental.fonts` | `fonts` (top-level) | [13_FONTS_OPTIMIZATION.md](./13_FONTS_OPTIMIZATION.md) |
| Live Content Collections | `experimental.liveContentCollections` | Built-in | [14_CONTENT_COLLECTIONS.md](./14_CONTENT_COLLECTIONS.md) |
| Script Order | `experimental.preserveScriptOrder` | Default behavior | [16_ADVANCED_FEATURES.md](./16_ADVANCED_FEATURES.md) |
| Static import.meta.env | `experimental.staticImportMetaEnv` | Default behavior | [28_ASTRO_ENV.md](./28_ASTRO_ENV.md) |
| Heading ID Compat | `experimental.headingIdCompat` | Default behavior | — |
| Prerender Conflict | `experimental.failOnPrerenderConflict` | `prerenderConflictBehavior` | — |

Current experimental features (Astro 6):

- `experimental.rustCompiler` — Faster Rust-based compiler
- `experimental.queuedRendering` — Queue-based rendering (more memory efficient)
- `experimental.clientPrerender` — Client-side prerendering via Speculation Rules API
- `experimental.svgo` — SVG optimization via SVGO

## Document Cross-References

Quick guide on which docs to consult for common tasks:

| Task | Relevant Documents |
|------|--------------------|
| Adding a new page | [03_PAGE_IMPROVEMENTS](./03_PAGE_IMPROVEMENTS.md), [06_PERFORMANCE](./06_PERFORMANCE.md), [24_SEO_META](./24_SEO_META.md) |
| Adding a React Island | [01_ISLANDS_ARCHITECTURE](./01_ISLANDS_ARCHITECTURE.md), [02_REACT_MIGRATION](./02_REACT_MIGRATION.md), [05_STATE_MANAGEMENT](./05_STATE_MANAGEMENT.md) |
| Security hardening | [09_SECURITY](./09_SECURITY.md), [15_MIDDLEWARE_PATTERNS](./15_MIDDLEWARE_PATTERNS.md), [19_CSP_BUILTIN](./19_CSP_BUILTIN.md), [20_API_ROUTES](./20_API_ROUTES.md) |
| Performance optimization | [06_PERFORMANCE](./06_PERFORMANCE.md), [13_FONTS_OPTIMIZATION](./13_FONTS_OPTIMIZATION.md), [25_IMAGE_OPTIMIZATION](./25_IMAGE_OPTIMIZATION.md), [33_SERVER_ISLANDS](./33_SERVER_ISLANDS.md) |
| Testing | [10_TESTING](./10_TESTING.md), [34_CONTAINER_API](./34_CONTAINER_API.md) |

## Document Index

| File | Contents |
|------|---------|
| [01_ISLANDS_ARCHITECTURE.md](./01_ISLANDS_ARCHITECTURE.md) | Islands Architecture migration plan |
| [02_REACT_MIGRATION.md](./02_REACT_MIGRATION.md) | Vanilla JS to React migration details for all components |
| [03_PAGE_IMPROVEMENTS.md](./03_PAGE_IMPROVEMENTS.md) | Per-page improvement points |
| [04_COMPONENT_IMPROVEMENTS.md](./04_COMPONENT_IMPROVEMENTS.md) | Per-component improvement points |
| [05_STATE_MANAGEMENT.md](./05_STATE_MANAGEMENT.md) | Nano Stores state management design |
| [06_PERFORMANCE.md](./06_PERFORMANCE.md) | Performance optimization |
| [07_I18N.md](./07_I18N.md) | i18n improvements |
| [08_ACCESSIBILITY.md](./08_ACCESSIBILITY.md) | Accessibility improvements |
| [09_SECURITY.md](./09_SECURITY.md) | Security improvements |
| [10_TESTING.md](./10_TESTING.md) | Test strategy |
| [11_IMPLEMENTATION_PLAN.md](./11_IMPLEMENTATION_PLAN.md) | Implementation order and dependencies |
| [12_CLOUDFLARE_INTEGRATION.md](./12_CLOUDFLARE_INTEGRATION.md) | Cloudflare Workers integration improvements |
| [13_FONTS_OPTIMIZATION.md](./13_FONTS_OPTIMIZATION.md) | Font optimization + Astro 6 Fonts API |
| [14_CONTENT_COLLECTIONS.md](./14_CONTENT_COLLECTIONS.md) | Content Collections migration |
| [15_MIDDLEWARE_PATTERNS.md](./15_MIDDLEWARE_PATTERNS.md) | Middleware pattern improvements |
| [16_ADVANCED_FEATURES.md](./16_ADVANCED_FEATURES.md) | Advanced features + experimental flags |
| [17_ACTIONS_PATTERNS.md](./17_ACTIONS_PATTERNS.md) | Astro Actions pattern improvements |
| [18_SESSION_MANAGEMENT.md](./18_SESSION_MANAGEMENT.md) | Session management improvements |
| [19_CSP_BUILTIN.md](./19_CSP_BUILTIN.md) | Built-in CSP (Astro 6 stable) |
| [20_API_ROUTES.md](./20_API_ROUTES.md) | API route security and migration to Actions |
| [21_ERROR_HANDLING.md](./21_ERROR_HANDLING.md) | Error handling across all layers |
| [22_DATA_LAYER.md](./22_DATA_LAYER.md) | Repository, UseCase, and domain model improvements |
| [23_DEV_TOOLING.md](./23_DEV_TOOLING.md) | Testing, Storybook, dev mock, and CI improvements |
| [24_SEO_META.md](./24_SEO_META.md) | SEO, meta tags, JSON-LD, sitemap, and robots.txt |
| [25_IMAGE_OPTIMIZATION.md](./25_IMAGE_OPTIMIZATION.md) | Image optimization with Astro `<Image>`, Discord CDN, CLS prevention |
| [26_FORM_UX.md](./26_FORM_UX.md) | Form UX, HTML5 validation, loading states, input errors |
| [27_RESPONSIVE_DESIGN.md](./27_RESPONSIVE_DESIGN.md) | Responsive layout, mobile sidebar, touch targets, dark mode transitions |
| [28_ASTRO_ENV.md](./28_ASTRO_ENV.md) | `astro:env` type-safe environment variables migration |
| [29_VIEW_TRANSITIONS.md](./29_VIEW_TRANSITIONS.md) | View Transitions, `<ClientRouter />`, lifecycle events, prefetch |
| [30_DESIGN_SYSTEM.md](./30_DESIGN_SYSTEM.md) | Design tokens, component library, spacing scale, dark mode audit |
| [31_TYPE_SAFETY.md](./31_TYPE_SAFETY.md) | End-to-end type safety, RPC types, locale types, `any` elimination |
| [32_MONITORING.md](./32_MONITORING.md) | Monitoring, logging, error reporting, Web Vitals, health check |
| [33_SERVER_ISLANDS.md](./33_SERVER_ISLANDS.md) | Server Islands (`server:defer`), deferred rendering, caching, `ASTRO_KEY` |
| [34_CONTAINER_API.md](./34_CONTAINER_API.md) | Container API for Astro component testing, `locals`, React renderer, test utils |
| [35_ROUTING_PATTERNS.md](./35_ROUTING_PATTERNS.md) | Route priority, dynamic param validation, redirects, error pages, trailing slash |
| [36_SCRIPTS_AND_STYLES.md](./36_SCRIPTS_AND_STYLES.md) | Script directives, custom elements, style scoping, `define:vars`, Tailwind v4 |
| [37_SLOTS_AND_COMPOSITION.md](./37_SLOTS_AND_COMPOSITION.md) | Named slots, fallback content, slot transfer, React slot-to-prop conversion |
| [38_DEV_TOOLBAR.md](./38_DEV_TOOLBAR.md) | Dev Toolbar apps, custom inspector, component library, i18n checker |
| [39_COOKIES_AND_ENDPOINTS.md](./39_COOKIES_AND_ENDPOINTS.md) | Cookies API, security defaults, server endpoints, Action migration |
| [40_MIGRATION_PRIORITY_MATRIX.md](./40_MIGRATION_PRIORITY_MATRIX.md) | Cross-cutting priority matrix, dependency graph, Astro 6 readiness |
| [41_SOURCE_CODE_AUDIT.md](./41_SOURCE_CODE_AUDIT.md) | Line-level source code audit: 26 findings across security, performance, a11y, i18n, architecture |

## Migration Checklist

- [ ] Verify all Astro 6 breaking changes are addressed before upgrading
- [ ] Update `@astrojs/cloudflare` to v13+ when migrating to Astro 6
- [ ] Review `sessionDrivers` function form for session configuration
- [ ] Audit `output: "server"` vs selective `prerender` for each page
- [ ] Remove all stabilized experimental flags from astro.config.ts when upgrading to Astro 6
- [ ] Migrate `experimental.csp` to `security.csp`
- [ ] Migrate `experimental.fonts` to top-level `fonts` config
- [ ] Evaluate remaining experimental features (Rust compiler, queued rendering, client prerender, SVGO)
