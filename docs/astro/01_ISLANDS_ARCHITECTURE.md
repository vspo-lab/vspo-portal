# Islands Architecture Migration Plan

## Current Issues

The current bot-dashboard renders all pages with SSR (`output: "server"`), and all client-side interactivity is implemented with vanilla JS (`<script>` tags).

### Problems

1. **JS is a large monolith** — The `<script>` in ChannelConfigForm.astro exceeds 300 lines. Difficult to test, impossible to reuse
2. **Manual DOM manipulation** — Overuse of `querySelector`, `classList.toggle`, `addEventListener`. State and UI easily fall out of sync
3. **Poor compatibility with View Transitions** — Requires re-initialization on every `astro:page-load`. Potential for AbortController leaks
4. **No state sharing between components** — e.g., table updates after channel addition rely on PRG (Post-Redirect-Get)

## What Is Islands Architecture

Astro Islands is a pattern of "floating interactive islands in a sea of static HTML."

```text
┌─────────────────────────────────────────┐
│         Static HTML (Server)            │
│  ┌──────────┐    ┌─────────────────┐    │
│  │ React    │    │ React           │    │
│  │ Island   │    │ Island          │    │
│  │ (hydrate)│    │ (hydrate)       │    │
│  └──────────┘    └─────────────────┘    │
│                                         │
│         Static HTML continues...        │
└─────────────────────────────────────────┘
```

## Migration Target Classification

### Components to Convert to Islands (client-side interactivity required)

| Component | Reason | Directive |
|-----------|--------|-----------|
| `ChannelConfigForm` | Form state, dropdowns, checkbox coordination | `client:load` |
| `ChannelAddModal` | Fetches channel list via fetch API, search filter | `client:load` |
| `DeleteChannelDialog` | Dynamic text replacement in confirmation dialog | `client:load` |
| `ThemeToggle` | localStorage integration | `client:load` |
| `LanguageSelector` (header variant) | `<details>` open/close | `client:idle` |
| `UserMenu` | `<details>` open/close | `client:idle` |
| `FeaturePopup` (LP) | dialog open/close | `client:visible` |
| `FlashMessage` | auto-dismiss timer | `client:idle` |
| Landing page feature cards | dialog trigger | `client:visible` |
| `DigitRoll` | Animation (possible with CSS-only, but may convert to React for state coordination) | `client:visible` |

### Components to Keep as Astro Components (server-only)

| Component | Reason |
|-----------|--------|
| `Header` | Static structure. Only receives islands via slots |
| `Footer` | Completely static |
| `Button` | Generic UI. Sufficient as Astro component |
| `IconButton` | Same as above |
| `Card` | Same as above |
| `GuildCard` | Fully server-side |
| `ChannelTable` | Table rendering is SSR. Only action buttons become islands |
| `ErrorAlert` | Static display |
| `AvatarFallback` | Static display |
| `ScrollReveal` | CSS-only animation |
| `MenuItem` | Static |
| `Dashboard` layout | Static structure |
| `Base` layout | Static structure |

## Server Islands Candidates

Using Astro's `server:defer`, parts of a page can be lazily rendered.

| Candidate | Effect |
|-----------|--------|
| Channel count display in `GuildCard` | Faster first paint for the guild list |
| Bot Stats (LP) | Improve LP TTFB, defer stats API call |

```astro
<!-- Example: Lazy-load Bot stats with Server Island -->
<BotStats server:defer>
  <StatsPlaceholder slot="fallback" />
</BotStats>
```

## React Integration Setup

### 1. Add Dependencies

```bash
pnpm add @astrojs/react react react-dom
pnpm add -D @types/react @types/react-dom
```

### 2. Update astro.config.ts

```typescript
import react from "@astrojs/react";

export default defineConfig({
  // ...existing config
  integrations: [
    react(),  // Add this
    sitemap({ ... }),
  ],
});
```

### 3. Update tsconfig.json

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

## Rules for Data Passing Between Islands

1. **Props must be serializable only** — Only JSON-serializable values can be passed to React islands
2. **Children are passed via `<slot />`** — Child elements of Astro components are passed through slots inside `client:*` islands
3. **Inter-island communication uses Nano Stores** — See 05_STATE_MANAGEMENT.md
4. **Server data is fetched in Astro page frontmatter** and passed to islands via props

```astro
---
// Fetch data server-side
const channels = await fetchChannels(guildId);
---

<!-- Pass data to React Island via props -->
<ChannelConfigForm
  client:load
  channels={channels}
  guildId={guildId}
/>
```

## Migration Steps

> **Note**: This is a 5-phase overview specific to the Islands Architecture migration.
> For the complete 7-phase implementation plan including security, font optimization, CSP, etc., see [`11_IMPLEMENTATION_PLAN.md`](./11_IMPLEMENTATION_PLAN.md).

### Phase 1: Foundation Setup

1. Add `@astrojs/react` integration
2. Add `nanostores` + `@nanostores/react`
3. Create shared React hooks directory

### Phase 2: Start with Small Islands

1. `ThemeToggle` → React (`client:load`)
2. `FlashMessage` → React (`client:idle`)
3. `FeaturePopup` dialog → React (`client:visible`)

### Phase 3: Large Form Components

1. `ChannelConfigForm` → React (`client:load`)
2. `ChannelAddModal` → React (`client:load`)
3. `DeleteChannelDialog` → React (`client:load`)

### Phase 4: State Management Integration

1. Share channel data via Nano Stores
2. Transition from PRG pattern to optimistic UI

### Phase 5: Cleanup

1. Delete vanilla JS files (`dialog-helpers.ts`, `close-on-outside-click.ts`, `theme.ts`)
2. Remove `astro:page-load` event handlers
3. Clean up `<script>` tags
