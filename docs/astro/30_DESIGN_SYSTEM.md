# Design System & Component Library

## Current State

### Shared Component Inventory

| Component | Type | Props | Variants | Notes |
|-----------|------|-------|----------|-------|
| `Button.astro` | Astro | `as`, `variant`, `size`, `class` | primary, secondary, outline, ghost, destructive; sm, md, lg | Polymorphic (`as="a"` or `as="button"`) |
| `Card.astro` | Astro | `class` | None | Simple wrapper with surface styling |
| `Header.astro` | Astro | None | None | Dashboard header with nav, theme, locale |
| `Footer.astro` | Astro | None | None | Dashboard footer |
| `FlashMessage.astro` | Astro | `type`, `message` | success, error, info | Auto-dismiss after 5s |
| `ErrorAlert.astro` | Astro | `message`, `retryHref` | None | Static error with retry link |
| `ThemeToggle.tsx` | React | None | None | Dark/light mode toggle |
| `LanguageSelector.astro` | Astro | None | None | ja/en locale switcher |
| `MenuItem.astro` | Astro | `href`, `active` | None | Sidebar navigation item |
| `IconButton.astro` | Astro | `aria-label`, `class` | None | Icon-only button |
| `AvatarFallback.astro` | Astro | `src`, `alt`, `width`, `height`, `fallbackText` | None | Image with initials fallback |

### Color Token System

Defined in `src/app.css` via CSS custom properties. Uses a 6-tier tonal surface system inspired by Material Design 3:

**Brand Colors:**

| Token | Value | Purpose |
|-------|-------|---------|
| `--color-vspo-purple` | `#7266cf` | Brand primary |
| `--color-discord` | `#4752c4` | Discord integration |

**Surface Hierarchy (Light / Dark):**

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `surface` | `#ffffff` | `#121317` | Page background |
| `surface-container-lowest` | `#f0f0f6` | `#18181d` | Lowest elevation |
| `surface-container-low` | `#e8e8ef` | `#1e1e23` | Low elevation |
| `surface-container` | `#e0e0e8` | `#242429` | Cards, default containers |
| `surface-container-high` | `#d8d8e0` | `#2b2b30` | Higher elevation |
| `surface-container-highest` | `#d0d0d8` | `#343439` | Highest elevation |

**Text & Status:**

| Token | Purpose |
|-------|---------|
| `on-surface` | Primary text |
| `on-surface-variant` | Secondary text, captions |
| `success` (`#16a34a`) | Success states |
| `info` (`#2563eb`) | Info states |
| `warning` (`#d97706`) | Warning states |
| `destructive` (`#e53935`) | Danger/error states |

**Typography:**

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | `"Noto Sans JP", "Hiragino Kaku Gothic Pro", system-ui` | Body text |
| `--font-heading` | `"M PLUS Rounded 1c", "Noto Sans JP"` | Headings |
| Scale | `display (3rem)`, `headline (2rem)`, `title (1.25rem)`, `body (0.875rem)`, `label (0.75rem)` | |

**Shadows:**

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-card` | `0 2px 8px rgba(0,0,0,0.06)` | Card elevation |
| `--shadow-action` | `0 4px 12px rgba(0,0,0,0.08)` | Interactive elements |
| `--shadow-hover` | `0 8px 24px rgba(0,0,0,0.1)` | Hover states |
| `--shadow-focus` | `0 0 0 3px rgba(114,102,207,0.6)` | Focus ring (purple) |

**Motion:**

| Token | Value |
|-------|-------|
| `--duration-fast` | `150ms` |
| `--duration-medium` | `250ms` |
| `--ease-standard` | `cubic-bezier(0.2, 0.7, 0.2, 1)` |
| `--ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` |

**Border Radius:**

| Token | Value |
|-------|-------|
| `--radius` | `12px` |
| `--radius-sm` | `8px` |

### Current Tailwind CSS v4 Setup

Tailwind v4 uses CSS-first configuration via `@theme` directives rather than `tailwind.config.js`. The project uses `@tailwindcss/vite` plugin.

## Issue 1: No Formal Design Token Documentation

### Problem

The color tokens are defined in CSS but not documented. Developers must read the CSS source to understand which tokens to use for which purpose. This leads to:

1. **Inconsistent token usage**: Different components may use different tokens for the same purpose
2. **Hard to maintain**: Changing the design system requires auditing all component usages
3. **Onboarding friction**: New contributors don't know which token to use

### Proposed: Design Token Reference

Create a design token reference in the Storybook or as a standalone page:

```astro
---
// pages/_design-tokens.astro (dev-only page)
---

<Base title="Design Tokens" noindex>
  <main class="space-y-8 p-8">
    <section>
      <h2>Surface Colors</h2>
      <div class="grid grid-cols-3 gap-4">
        <div class="rounded-xl bg-surface p-4">
          <code>bg-surface</code>
        </div>
        <div class="rounded-xl bg-surface-container p-4">
          <code>bg-surface-container</code>
        </div>
        <div class="rounded-xl bg-surface-container-high p-4">
          <code>bg-surface-container-high</code>
        </div>
      </div>
    </section>
    <!-- More sections for text, borders, actions -->
  </main>
</Base>
```

### Alternative: Storybook Docs Page

Add a "Design Tokens" docs page to Storybook that renders all tokens with their CSS custom property names and values.

## Issue 2: Inconsistent Spacing, Radius, and Shadows

### Border Radius Inconsistency

Despite having `--radius` (12px) and `--radius-sm` (8px) tokens, components mix them with Tailwind defaults:

| Component | Class Used | Actual Size | Should Be |
|-----------|-----------|-------------|-----------|
| Button | `rounded-[--radius-sm]` | 8px | Correct |
| Card | `rounded-2xl` | 16px (Tailwind) | `rounded-[--radius]` (12px) |
| Modal/Dialog | `rounded-xl` | 12px (Tailwind) | `rounded-[--radius]` (12px) |
| Dropdown | `rounded-lg` | 8px (Tailwind) | `rounded-[--radius-sm]` (8px) |
| MenuItem | `rounded-lg` | 8px (Tailwind) | `rounded-[--radius-sm]` (8px) |

**Fix**: Replace Tailwind `rounded-*` classes with custom token references for consistency.

### Shadow Inconsistency

| Component | Shadow Used | Appropriate? |
|-----------|------------|-------------|
| Card | `shadow-card` | Yes |
| Dialog/Modal | `shadow-hover` | No — too large, should have `shadow-modal` |
| Feature cards | `shadow-hover` | Borderline |
| Dropdown | (none) | Missing — should use `shadow-action` |

### Focus State Inconsistency

| Pattern | Usage |
|---------|-------|
| `focus-visible:ring-2 focus-visible:ring-vspo-purple/50` | Most components |
| `focus-visible:shadow-focus` | Some components (different visual) |

These produce different visual effects. Standardize to one approach.

### Spacing Inconsistency

Components use various Tailwind spacing values without a consistent scale:

| Pattern | Values Used | Consistency |
|---------|-------------|------------|
| Card padding | `p-4`, `p-6`, `p-8` | Varies per component |
| Section gaps | `gap-2`, `gap-3`, `gap-4`, `gap-6` | Varies |

### Proposed: Spacing Scale Convention

Document a consistent spacing scale:

| Use Case | Tailwind Class | Pixel Value |
|----------|---------------|-------------|
| Inline spacing (icons) | `gap-1`, `gap-1.5` | 4px, 6px |
| Component internal | `p-3`, `p-4` | 12px, 16px |
| Card padding | `p-4` (mobile), `p-6` (desktop) | 16px, 24px |
| Section spacing | `space-y-6`, `space-y-8` | 24px, 32px |
| Page sections | `py-12`, `py-16` | 48px, 64px |
| Border radius (small) | `rounded-lg` | 8px |
| Border radius (card) | `rounded-xl` | 12px |
| Border radius (dialog) | `rounded-2xl` | 16px |

## Issue 3: No Component API Documentation

### Problem

Components have no documented props API beyond the TypeScript interface in the `.astro` file. Storybook stories show visual examples but don't document:

1. When to use which component
2. Which variant to use in which context
3. Accessibility requirements per component
4. Do's and don'ts

### Proposed: Component Documentation Convention

For each shared component, add a JSDoc comment block:

```astro
---
/**
 * Primary button component with multiple variants and sizes.
 *
 * @usage
 * - `primary`: Main CTA actions (save, submit, confirm)
 * - `secondary`: Secondary actions (cancel, back)
 * - `outline`: Tertiary actions, lower visual weight
 * - `ghost`: Inline actions, minimal styling
 * - `destructive`: Dangerous actions (delete, remove)
 *
 * @accessibility
 * - Renders as `<button>` by default, use `as="a"` for navigation
 * - When using `as="a"`, ensure `href` is provided
 * - Icon-only buttons should use `aria-label`
 *
 * @example
 * <Button variant="primary" size="lg">Save Changes</Button>
 * <Button as="a" href="/dashboard" variant="outline">Go Back</Button>
 */
interface Props {
  as?: "a" | "button";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  class?: string;
}
---
```

## Issue 4: Missing Common UI Components

### Components That Don't Exist Yet

| Component | Need | Priority |
|-----------|------|----------|
| `Spinner.astro` / `Spinner.tsx` | Loading indicator for async actions | HIGH |
| `Badge.astro` | Status indicators (online, offline, channel count) | MEDIUM |
| `Tooltip.astro` / `Tooltip.tsx` | Contextual information on hover | MEDIUM |
| `Skeleton.astro` | Loading placeholder for content areas | MEDIUM |
| `Divider.astro` | Semantic horizontal/vertical divider | LOW |
| `VisuallyHidden.astro` | Screen-reader-only text | LOW |

### Proposed: Spinner Component

```tsx
// features/shared/components/Spinner.tsx
interface Props {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };

export const Spinner = ({ size = "md", label = "Loading..." }: Props) => (
  <span role="status" className="inline-flex items-center gap-2">
    <svg
      className={`${sizeMap[size]} animate-spin text-primary`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        fill="currentColor"
        className="opacity-75"
      />
    </svg>
    <span className="sr-only">{label}</span>
  </span>
);
```

### Proposed: Badge Component

```tsx
// features/shared/components/Badge.tsx
interface Props {
  variant?: "default" | "success" | "warning" | "error" | "info";
  children: React.ReactNode;
}

const variantStyles = {
  default: "bg-surface-container text-on-surface",
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  error: "bg-destructive/10 text-destructive",
  info: "bg-primary/10 text-primary",
};

export const Badge = ({ variant = "default", children }: Props) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantStyles[variant]}`}>
    {children}
  </span>
);
```

## Issue 5: Dark Mode Token Gaps

### Current State

The semantic token system supports dark mode via CSS custom properties that change value based on the `dark` class. However:

1. **Some components use hardcoded colors**: Direct Tailwind color classes (e.g., `text-gray-600`) instead of semantic tokens
2. **Interactive states**: Hover/focus/active states may not all have dark mode variants
3. **Shadows**: Box shadows may not adapt to dark mode (dark shadows on dark backgrounds are invisible)

### Proposed: Dark Mode Audit

Check every component for hardcoded colors that don't adapt to dark mode:

```bash
# Find potential hardcoded colors in Astro/TSX components
grep -rn "text-gray\|bg-gray\|text-slate\|bg-slate\|text-zinc\|bg-zinc" src/
```

Replace with semantic tokens:

| Hardcoded | Semantic Replacement |
|-----------|---------------------|
| `text-gray-600` | `text-on-surface-variant` |
| `bg-gray-100` | `bg-surface-container` |
| `border-gray-200` | `border-outline-variant` |
| `text-white` | `text-on-primary` (on primary bg) |

## Issue 6: No Component Composition Patterns

### Problem

There are no documented patterns for composing components together. For example:

- How to create a form with `Button`, `ErrorAlert`, and `FlashMessage`
- How to build a card with `Card`, `Badge`, and action buttons
- How to create a dialog with `IconButton` (close), content, and `Button` (confirm/cancel)

### Proposed: Composition Examples in Storybook

Add composite stories that show real-world compositions:

```typescript
// stories/compositions/ChannelCard.stories.ts
export const ChannelCard = {
  render: () => `
    <div class="card">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="..." alt="Channel" class="h-8 w-8 rounded" />
          <div>
            <h3 class="font-medium">general</h3>
            <span class="badge badge-success">Active</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm">Edit</button>
          <button class="btn btn-destructive btn-sm">Delete</button>
        </div>
      </div>
    </div>
  `,
};
```

## Migration Checklist

- [ ] Document design token reference (Storybook page or dev-only route)
- [ ] Establish spacing scale convention and document
- [ ] Add JSDoc documentation to all shared components
- [ ] Create `Spinner` component (React Island)
- [ ] Create `Badge` component (React Island)
- [ ] Audit all components for hardcoded colors (dark mode gaps)
- [ ] Replace hardcoded colors with semantic tokens
- [ ] Add composite Storybook stories for common patterns
- [ ] Consider `VisuallyHidden` utility component
- [ ] Document component composition patterns
