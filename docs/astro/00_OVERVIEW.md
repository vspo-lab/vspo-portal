# bot-dashboard Improvement Plan Overview

## Current Architecture

| Item | Status |
|------|--------|
| Framework | Astro (SSR, `output: "server"`) |
| Deployment | Cloudflare Workers (`@astrojs/cloudflare`) |
| CSS | Tailwind CSS v4 (`@tailwindcss/vite`) |
| i18n | Astro built-in (`defaultLocale: "ja"`, `locales: ["ja", "en"]`) + custom dictionary (`dict.ts`) |
| Page Transitions | `<ClientRouter />` (View Transitions) + `prefetch: "viewport"` |
| Authentication | Discord OAuth2 (middleware + session) |
| Server Actions | Astro Actions (`defineAction`, `accept: "form"`) |
| Client JS | **Hybrid** — React Islands for new components, vanilla JS (`<script>` tags, AbortController pattern) for unmigrated ones |
| State Management | None (DOM-based for vanilla JS components) |
| Testing | vitest + @testing-library/react (150 tests passing) |
| React Integration | `@astrojs/react` installed and configured |

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
| [13_FONTS_OPTIMIZATION.md](./13_FONTS_OPTIMIZATION.md) | Font optimization (Astro 6 fonts) |
| [14_CONTENT_COLLECTIONS.md](./14_CONTENT_COLLECTIONS.md) | Content Collections migration |
| [15_MIDDLEWARE_PATTERNS.md](./15_MIDDLEWARE_PATTERNS.md) | Middleware pattern improvements |
| [16_ADVANCED_FEATURES.md](./16_ADVANCED_FEATURES.md) | Advanced Astro feature adoption |
| [17_ACTIONS_PATTERNS.md](./17_ACTIONS_PATTERNS.md) | Astro Actions pattern improvements |
| [18_SESSION_MANAGEMENT.md](./18_SESSION_MANAGEMENT.md) | Session management improvements |
| [19_CSP_BUILTIN.md](./19_CSP_BUILTIN.md) | Astro 6 built-in CSP |
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
