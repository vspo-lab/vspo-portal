# Responsive Design & Layout Improvements

## Current State

### Layout Architecture

```text
Base.astro
  ├── <html lang={locale}>
  ├── <head> (meta, styles, fonts)
  ├── <body>
  │   ├── <a href="#main-content"> (skip-to-content)
  │   ├── <slot />
  │   └── <ClientRouter />
  │
  └── Dashboard.astro (extends Base)
       ├── Header.astro
       │   ├── Logo + navigation
       │   ├── ThemeToggle (React Island)
       │   ├── LanguageSelector
       │   └── UserMenu
       ├── <main id="main-content">
       │   ├── Mobile sidebar (<details>)
       │   ├── Desktop sidebar
       │   └── Content area (<slot />)
       └── Footer.astro
```

### Breakpoint Strategy

The project uses Tailwind CSS v4 with standard breakpoints:

| Breakpoint | Min Width | Usage |
|------------|----------|-------|
| (default) | 0px | Mobile-first base styles |
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets, small laptops |
| `lg` | 1024px | Desktops |
| `xl` | 1280px | Large desktops |

### Current Responsive Patterns

| Pattern | Implementation | Quality |
|---------|---------------|---------|
| Mobile-first | Tailwind `sm:`, `md:`, `lg:` prefixes | Good |
| Sidebar | `<details>` on mobile, fixed on desktop | Functional |
| Table columns | Hidden on mobile via `hidden sm:table-cell` | Good |
| Touch targets | 36-40px buttons/links | Adequate |
| Grid layout | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | Good |
| Typography | Responsive sizes via Tailwind | Good |

## Issue 1: Mobile Sidebar UX

### Current State

The dashboard sidebar uses `<details>/<summary>` for mobile collapse:

```html
<details class="md:hidden">
  <summary>Menu</summary>
  <!-- sidebar content -->
</details>
<aside class="hidden md:block">
  <!-- sidebar content (duplicated) -->
</aside>
```

### Issues

1. **Content duplication**: Sidebar content is rendered twice in HTML (once for mobile `<details>`, once for desktop `<aside>`)
2. **No animation**: The `<details>` element snaps open/close without transition
3. **No backdrop overlay**: When the mobile sidebar opens, the background content is still visible and interactive
4. **No close on navigation**: When a sidebar link is clicked, the `<details>` remains open

### Proposed: Single Sidebar with CSS-Only Responsive Behavior

```astro
<aside
  id="sidebar"
  class="fixed inset-y-0 left-0 z-40 w-64 -translate-x-full bg-surface transition-transform md:static md:translate-x-0"
  aria-label="Sidebar navigation"
>
  <!-- Single sidebar content -->
</aside>

<!-- Mobile toggle button -->
<button
  class="md:hidden"
  aria-controls="sidebar"
  aria-expanded="false"
  aria-label="Toggle sidebar"
>
  <svg><!-- hamburger icon --></svg>
</button>
```

### Proposed: React Sidebar Island (Post-Migration)

When the sidebar is migrated to a React Island:

```tsx
// features/shared/components/Sidebar.tsx
import { useState, useEffect } from "react";

interface Props {
  children: React.ReactNode;
  currentPath: string;
}

export const Sidebar = ({ children, currentPath }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [currentPath]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-surface transition-transform md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar navigation"
      >
        {children}
      </aside>
    </>
  );
};
```

## Issue 2: Touch Target Sizing

### Current State

Touch targets range from 36px to 40px. WCAG 2.2 Success Criterion 2.5.8 recommends a minimum of 44x44 CSS pixels for touch targets (Level AAA), with 24x24 as the Level AA minimum.

### Audit

| Component | Current Size | Meets AA (24px) | Meets AAA (44px) |
|-----------|-------------|-----------------|------------------|
| Button.astro (lg) | 40px height | Yes | No |
| Button.astro (sm) | 32px height | Yes | No |
| IconButton.astro | 36x36px | Yes | No |
| ThemeToggle | ~36px | Yes | No |
| LanguageSelector | ~36px | Yes | No |
| Table row actions | ~32px | Yes | No |
| Sidebar links | ~36px | Yes | No |

### Proposed: Increase Touch Targets on Mobile

Use Tailwind responsive prefixes to increase touch targets on touch devices:

```html
<!-- IconButton example -->
<button class="h-9 w-9 md:h-9 md:w-9 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
```

Alternative approach using `@media (pointer: coarse)`:

```css
@media (pointer: coarse) {
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }
}
```

## Issue 3: Table Responsiveness

### Current State

`ChannelTable.astro` uses a responsive table with column hiding:

```html
<th class="hidden sm:table-cell">Member Type</th>
<th class="hidden md:table-cell">Created</th>
```

### Issues

1. **Information loss on mobile**: Hidden columns mean mobile users cannot see member type or creation date
2. **No horizontal scroll alternative**: When all columns are needed, there's no way to scroll the table
3. **No card-view alternative**: On very small screens, a card layout per channel would be more usable

### Proposed: Card View on Mobile

```astro
<!-- Mobile: card layout -->
<div class="space-y-3 sm:hidden">
  {channels.map((channel) => (
    <div class="rounded-xl bg-surface-container p-4">
      <div class="flex items-center justify-between">
        <span class="font-medium">{channel.name}</span>
        <span class="text-xs text-on-surface-variant">{channel.memberType}</span>
      </div>
      <div class="mt-2 flex items-center gap-2 text-xs text-on-surface-variant">
        <span>{channel.createdAt}</span>
      </div>
      <div class="mt-3 flex gap-2">
        <!-- Action buttons -->
      </div>
    </div>
  ))}
</div>

<!-- Desktop: table layout -->
<table class="hidden sm:table">
  <!-- existing table -->
</table>
```

## Issue 4: Container Width Consistency

### Current State

Page content widths vary:

| Page | Container | Max Width |
|------|-----------|-----------|
| Landing | Custom | Various per section |
| Dashboard | `max-w-7xl` | 1280px |
| 404 | `min-h-screen` (full width) | None |
| Announcements | (inherits from Dashboard) | 1280px |

### Proposed: Consistent Container System

Define a reusable container pattern:

```css
/* In Tailwind config or global CSS */
.container-page {
  @apply mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8;
}

.container-narrow {
  @apply mx-auto w-full max-w-3xl px-4 sm:px-6;
}
```

## Issue 5: Dark Mode Transition Quality

### Current State

The theme toggle switches between light and dark mode. The current implementation uses CSS class toggling (`dark` class on `<html>`).

### Issues

1. **Flash of wrong theme**: On initial load, there may be a brief flash of the wrong theme before JavaScript hydrates and applies the correct class
2. **No transition animation**: Theme changes are instant, which can be jarring

### Proposed: Smooth Theme Transition

```css
/* Global CSS */
html {
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* Prevent transition on initial load */
html.no-transition * {
  transition: none !important;
}
```

```astro
<!-- In Base.astro <head>, inline script for FOUC prevention -->
<script is:inline>
  const theme = localStorage.getItem("theme") ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.classList.add(theme, "no-transition");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove("no-transition");
    });
  });
</script>
```

## Issue 6: Print Styles

### Current State

No print-specific styles exist. Printing the dashboard or landing page produces unstyled output with navigation elements, dark mode colors, and other screen-only content.

### Proposed: Basic Print Styles

```css
@media print {
  /* Hide non-content elements */
  header, footer, nav, aside,
  [data-no-print] {
    display: none !important;
  }

  /* Reset colors for print */
  body {
    background: white !important;
    color: black !important;
  }

  /* Ensure links show their URL */
  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
  }
}
```

This is low priority but improves completeness for users who may want to print channel configurations.

## Issue 7: Viewport Meta and Safe Areas

### Current State

The viewport meta tag likely uses the standard:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### Issue

On devices with notches or rounded corners (modern iPhones, Android devices), content may be clipped by safe areas. The `viewport-fit=cover` and `env(safe-area-inset-*)` CSS values handle this.

### Proposed: Safe Area Support

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

```css
/* Apply safe area padding to fixed/sticky elements */
header {
  padding-top: env(safe-area-inset-top);
}

.sidebar {
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}
```

## Migration Checklist

- [ ] Refactor mobile sidebar to eliminate content duplication
- [ ] Add backdrop overlay to mobile sidebar
- [ ] Add close-on-navigation to mobile sidebar
- [ ] Increase touch targets to 44px on coarse pointer devices
- [ ] Add card-view alternative for channel table on mobile
- [ ] Standardize container widths across pages
- [ ] Add theme transition animation with FOUC prevention
- [ ] Add `viewport-fit=cover` and safe area padding
- [ ] Consider print styles for dashboard pages
- [ ] Add Escape key handler to close mobile sidebar
