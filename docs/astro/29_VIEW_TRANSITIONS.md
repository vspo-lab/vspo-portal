# View Transitions & Client Router Improvements

## Current State

### Configuration

```typescript
// astro.config.ts
prefetch: {
  prefetchAll: false,
  defaultStrategy: "viewport",
},
```

### `<ClientRouter />` Usage

The `<ClientRouter />` component is included in `Base.astro`, enabling client-side navigation for all pages:

```astro
<!-- layouts/Base.astro -->
<ClientRouter />
```

This means ALL page navigations use the View Transitions API (or its polyfill on unsupported browsers).

### Current Lifecycle Event Usage

The project uses View Transitions lifecycle events in several places for re-initializing vanilla JS after page swaps:

| Event | Location | Purpose |
|-------|----------|---------|
| `astro:page-load` | `ChannelTable.astro` | Re-initialize search filter, keyboard handlers |
| `astro:page-load` | `ChannelAddModal.astro:213` | Re-initialize dialog open/close handlers |
| `astro:page-load` | `DeleteChannelDialog.astro:109` | Re-initialize delete confirmation handlers |
| `astro:page-load` | `ChannelConfigForm.astro:599` | Re-initialize form change tracking, unsaved warning |
| `astro:page-load` | `pages/index.astro:295` | Feature popup initialization |
| `astro:page-load` | `ThemeToggle.tsx:26` | Theme sync on page load |
| `astro:page-load` | `close-on-outside-click.ts:27` | Outside-click listener |
| `astro:after-swap` | `Base.astro:84` | Theme class reapplication |
| `astro:after-swap` | `[guildId].astro:177` | Dialog re-initialization |
| `astro:after-swap` | `app.css:290-300` | CSS transition definitions |
| `astro:before-swap` | **Not used** | No preparation-phase hooks |
| `astro:before-preparation` | **Not used** | No loading indicator hooks |

### The `AbortController` Pattern

Several components use the `AbortController` pattern for cleanup during navigation:

```typescript
document.addEventListener("astro:page-load", () => {
  const controller = new AbortController();
  const { signal } = controller;

  // Attach event listeners with signal
  element.addEventListener("click", handler, { signal });

  // Cleanup on next navigation
  document.addEventListener("astro:before-swap", () => controller.abort(), {
    once: true,
  });
});
```

## Issue 1: Redundant Event Listener Re-Initialization

### Problem

Every component with vanilla JS uses the `astro:page-load` + `AbortController` pattern to manage its lifecycle. This creates:

1. **Boilerplate in every component**: Each component repeats the same setup/teardown pattern
2. **Race conditions**: If `astro:before-swap` fires before all event listeners are attached, cleanup may be incomplete
3. **Memory concerns**: Multiple `AbortController` instances are created on each navigation

### Impact After React Migration

When components are migrated to React Islands:

- React Islands automatically handle lifecycle via `useEffect` cleanup
- The `astro:page-load` + `AbortController` pattern becomes unnecessary
- React's `client:load` / `client:idle` directives handle mounting automatically

### Proposed: Transition Helper (Pre-Migration)

For components not yet migrated to React, extract the pattern:

```typescript
// features/shared/lib/page-lifecycle.ts

/**
 * Register a setup function that runs on every page load
 * and automatically cleans up on page swap.
 */
export const onPageLoad = (setup: (signal: AbortSignal) => void): void => {
  document.addEventListener("astro:page-load", () => {
    const controller = new AbortController();
    setup(controller.signal);
    document.addEventListener(
      "astro:before-swap",
      () => controller.abort(),
      { once: true },
    );
  });
};
```

Usage:

```typescript
import { onPageLoad } from "~/features/shared/lib/page-lifecycle";

onPageLoad((signal) => {
  document.querySelector("#search")?.addEventListener(
    "input",
    handleSearch,
    { signal },
  );
});
```

### Post-Migration State

After full React migration, this helper can be deleted. React Islands handle their own lifecycle.

## Issue 2: Theme Persistence Across Transitions

### Current State

`ThemeToggle.tsx` listens to `astro:before-swap` to persist the dark mode class:

```typescript
document.addEventListener("astro:before-swap", (event) => {
  const newDocument = (event as TransitionBeforeSwapEvent).newDocument;
  const theme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  if (theme === "dark") {
    newDocument.documentElement.classList.add("dark");
  }
});
```

### Issue

This listener is registered inside a React Island. If the Island hasn't hydrated yet when a fast navigation occurs, the theme class may not be carried over — resulting in a flash of wrong theme.

### Proposed: Inline Script for Theme Persistence

Move theme persistence to an inline script in `Base.astro` that doesn't depend on React hydration:

```astro
<!-- layouts/Base.astro <head> -->
<script is:inline>
  // Persist theme across View Transitions (must be inline, not module)
  document.addEventListener("astro:before-swap", (event) => {
    const theme = localStorage.getItem("theme") ??
      (document.documentElement.classList.contains("dark") ? "dark" : "light");
    if (theme === "dark") {
      event.newDocument.documentElement.classList.add("dark");
    } else {
      event.newDocument.documentElement.classList.remove("dark");
    }
  });
</script>
```

Using `is:inline` ensures the script runs immediately without bundling, so it's always available regardless of hydration state.

## Issue 3: No Loading Indicator During Navigation

### Current State

When navigating between pages (e.g., guild list → guild detail), there is no visual feedback that a new page is loading. The old page stays visible until the new page is ready.

### Problem

For slow navigations (RPC calls to fetch guild data), users may think the click didn't register.

### Proposed: Navigation Progress Indicator

Using `astro:before-preparation` and `astro:after-preparation`:

```astro
<!-- layouts/Base.astro -->
<div
  id="nav-progress"
  class="fixed top-0 left-0 z-50 h-0.5 bg-primary transition-all duration-300"
  style="width: 0%; opacity: 0;"
  aria-hidden="true"
></div>

<script is:inline>
  let progressBar;

  document.addEventListener("astro:before-preparation", () => {
    progressBar = document.getElementById("nav-progress");
    if (progressBar) {
      progressBar.style.opacity = "1";
      progressBar.style.width = "70%";
    }
  });

  document.addEventListener("astro:after-preparation", () => {
    if (progressBar) {
      progressBar.style.width = "100%";
      setTimeout(() => {
        progressBar.style.opacity = "0";
        progressBar.style.width = "0%";
      }, 200);
    }
  });
</script>
```

## Issue 4: Prefetch Strategy Optimization

### Current State

```typescript
prefetch: {
  prefetchAll: false,
  defaultStrategy: "viewport",
},
```

The `viewport` strategy prefetches links when they enter the viewport. This is generally good but has considerations:

### Issues

1. **Dashboard pages are data-heavy**: Prefetching guild detail pages triggers SSR on the server, which includes RPC calls. On the dashboard index with many guild cards, this could trigger multiple unnecessary RPC requests.
2. **Auth-required pages**: Prefetched pages go through auth middleware. If the session is about to expire, prefetch requests may trigger unnecessary token refreshes.
3. **No per-link override**: Some links should use `hover` strategy (faster but less predictive) or `tap` strategy (most conservative).

### Proposed: Selective Prefetch Strategy

```astro
<!-- Guild cards: use hover strategy (avoid premature RPC) -->
<a href={`/dashboard/${guild.id}`} data-astro-prefetch="hover">
  {guild.name}
</a>

<!-- Static pages: use viewport strategy (fast, no server cost) -->
<a href="/dashboard/announcements" data-astro-prefetch="viewport">
  Announcements
</a>

<!-- Destructive action pages: no prefetch -->
<a href="/auth/logout" data-astro-prefetch="false">
  Logout
</a>
```

## Issue 5: Transition Animations

### Current State

The project uses the default View Transitions animation (cross-fade). No custom `transition:animate` directives are used.

### Proposed: Semantic Transition Animations

```astro
---
import { fade, slide } from "astro:transitions";
---

<!-- Main content area: cross-fade (default) -->
<main transition:animate="fade">
  <slot />
</main>

<!-- Sidebar: persist across navigations -->
<aside transition:persist>
  <!-- Guild sidebar content -->
</aside>

<!-- Page title: slide in -->
<h1 transition:animate={slide({ duration: "0.2s" })}>
  {title}
</h1>
```

### `transition:persist` for Shared UI

Elements that should survive page transitions:

| Element | Reason |
|---------|--------|
| Sidebar navigation | Same on all dashboard pages |
| Header | Same on all pages |
| Theme state | Already handled via `astro:before-swap` |
| Audio/video players | If added in future |

```astro
<!-- Dashboard sidebar: persists across guild navigations -->
<aside transition:persist="sidebar">
  <GuildList guilds={guilds} />
</aside>
```

## Issue 6: Form Submission and View Transitions

### Current State

Form submissions (add/update/delete channel) use standard HTML form POST, which triggers a full page navigation. With `<ClientRouter />`, this should be intercepted by the View Transitions router.

### Consideration

Astro's View Transitions router handles form submissions (POST) since v4. The `astro:before-preparation` event includes `formData` for form navigations. However:

1. **POST + Redirect (PRG)**: The current PRG pattern (POST → redirect → GET) works with View Transitions, but the transition animates twice (once for POST, once for redirect)
2. **Error display**: If the POST fails and returns the same page with an error, the transition may look like a page change when it's actually the same page

### Proposed: Disable Transition for Form Submissions

```astro
<form method="POST" data-astro-transition="false">
  <!-- Form submissions skip the view transition animation -->
</form>
```

Or target specific forms that shouldn't transition:

```astro
<!-- Delete forms: no transition (stays on same page) -->
<form method="POST" data-astro-reload>
  <!-- Forces a full page reload instead of client-side transition -->
</form>
```

## Issue 7: Deprecated API Usage

### Current State

Astro v6 deprecated several View Transitions constants:

| Deprecated | Replacement |
|-----------|-------------|
| `TRANSITION_BEFORE_PREPARATION` | `"astro:before-preparation"` string literal |
| `TRANSITION_AFTER_PREPARATION` | `"astro:after-preparation"` string literal |
| `TRANSITION_BEFORE_SWAP` | `"astro:before-swap"` string literal |
| `TRANSITION_AFTER_SWAP` | `"astro:after-swap"` string literal |
| `TRANSITION_PAGE_LOAD` | `"astro:page-load"` string literal |

### Action

Verify the project doesn't import these deprecated constants. If it does, replace with string literals. These will be removed in Astro v7.

## Issue 8: Custom Swap Function via `swapFunctions`

### Overview

Astro 4.15+ provides `swapFunctions` — a set of utility functions from `astro:transitions/client` that compose into the default swap behavior. You can use these to build custom swap logic when the default DOM replacement doesn't work for your use case.

### Available Functions

| Function | Description |
|----------|-------------|
| `deselectScripts(doc)` | Marks scripts in the new document that shouldn't re-execute (already present and not flagged `data-astro-rerun`) |
| `swapRootAttributes(doc)` | Swaps `<html>` attributes (e.g., `lang`, `data-astro-transition`). **Must be called** to preserve transition animations |
| `swapHeadElements(doc)` | Removes old `<head>` elements not in new document, appends new ones |
| `saveFocus()` | Returns a restore function. Call it after body swap to return focus to persisted elements |
| `swapBodyElement(newBody, oldBody)` | Replaces body, then restores persisted elements (`transition:persist`) |

### Example: Recreate Default Swap

```html
<script>
  import { swapFunctions } from "astro:transitions/client";

  function mySwap(doc) {
    swapFunctions.deselectScripts(doc);
    swapFunctions.swapRootAttributes(doc);
    swapFunctions.swapHeadElements(doc);
    const restoreFocus = swapFunctions.saveFocus();
    swapFunctions.swapBodyElement(doc.body, document.body);
    restoreFocus();
  }

  document.addEventListener("astro:before-swap", (event) => {
    event.swap = () => mySwap(event.newDocument);
  });
</script>
```

### Use Case: DOM Diffing Instead of Full Replacement

Instead of replacing the entire `<body>`, use a diff library for smoother transitions:

```html
<script is:inline>
  document.addEventListener("astro:before-swap", (event) => {
    event.swap = () => {
      diff(document, event.newDocument);
    };
  });
</script>
```

### Relevance to This Project

If React Islands have persistent state that gets lost during body replacement (e.g., open modals, form input), a custom swap function could selectively update only changed DOM areas while preserving island state. This is an advanced optimization to consider after the React migration is complete.

## Issue 9: Browser-Native MPA View Transitions vs `<ClientRouter />`

### Overview

Astro supports two distinct approaches to view transitions:

| Approach | Mechanism | JS Required | Browser Support |
|----------|-----------|-------------|-----------------|
| Browser-native cross-document | CSS `@view-transition`, `view-transition-name` | **None** | Chrome 126+, Safari 18.2+ |
| `<ClientRouter />` (SPA mode) | JS-based client-side routing | Yes (~15KB) | All (with polyfill) |

### Astro's Recommendation

From the Astro docs:
> As browser APIs and web standards evolve, using Astro's `<ClientRouter />` for this additional functionality will increasingly become unnecessary. We recommend keeping up with the current state of browser APIs.

### Current State

The project uses `<ClientRouter />` in `Base.astro` for all pages. This adds a JS dependency and SPA-like behavior (client-side routing, `astro:page-load` events, script re-initialization).

### Evaluation for This Project

**Reasons to keep `<ClientRouter />`:**

- React Islands rely on `transition:persist` to avoid remounting
- `astro:before-swap` is used for theme persistence
- Loading indicators use `astro:before-preparation`
- Form submissions are intercepted by the router

**Reasons to consider MPA transitions (future):**

- Zero JS for transitions = better performance
- No script re-initialization issues (`astro:page-load` pattern goes away)
- No `AbortController` cleanup needed
- Better CSP compatibility (no inline scripts needed for router)
- After full React migration, islands handle their own lifecycle

### Recommendation

Keep `<ClientRouter />` during the React migration (Phase 3-5). Re-evaluate once all vanilla JS is removed and React Islands handle all client-side state. Browser-native MPA transitions may be sufficient at that point.

## Migration Checklist

- [ ] Extract `onPageLoad` helper to reduce boilerplate in vanilla JS components
- [ ] Move theme persistence to inline `<script>` in `Base.astro` (not React-dependent)
- [ ] Add navigation progress indicator using `astro:before-preparation` / `astro:after-preparation`
- [ ] Add `data-astro-prefetch="hover"` to dashboard guild links
- [ ] Add `data-astro-prefetch="false"` to logout link
- [ ] Evaluate `transition:persist` for sidebar and header
- [ ] Consider disabling transitions for form submissions
- [ ] Audit for deprecated `TRANSITION_*` constant imports
- [ ] Add `transition:animate` directives for semantic page transitions
- [ ] Evaluate custom swap function via `swapFunctions` for preserving React Island state during transitions
- [ ] Re-evaluate `<ClientRouter />` vs browser-native MPA transitions after React migration (Phase 7)
