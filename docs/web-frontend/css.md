# Tailwind CSS Guidelines

## Core Principles

### Utility-First Philosophy

Tailwind's utility-first approach does not mean "all UI is composed of lower-level components." Rather, it means **write with utilities when you're not confident in an abstraction**. Abstract into components only when reusability and behavior (event handlers, etc.) are involved.

### Prohibited

- Using the `@apply` directive
- Defining CSS classes outside of Tailwind (including custom classes in `@layer utilities`)
- Designing components to accept `className` as a prop (except for variants)
- CSS-only abstractions (e.g., defining `.btn-primary`, `.surface-panel`)
- Adding new `@keyframes` to `globals.css`

### Allowed

- Abstracting as UI components (including logic such as handlers)
- Defining variants with `cva`
- Exceptional use of the `.prose` class (for rich text display)
- Normalize/reset processing in `@layer base`
- Defining design tokens in `@theme`
- Tailwind built-in animations (`animate-spin`, `animate-pulse`, etc.)

### Design Goals

- Manage design tokens as a single source of truth (color, type, radius, motion)
- Use Tailwind in a token-first manner, reducing arbitrary values within components
- Adopt shadcn/ui as common primitives while maintaining the brand look
- Enable future theming (dark mode, seasonal) without component modifications

## Design Tokens

### Token Architecture

| Layer | Description | Example |
|-------|-------------|---------|
| Base palette | Raw color values only (no intent) | `--palette-ink-900`, `--palette-coral-100` |
| Semantic tokens | Express intent | `--token-canvas`, `--token-text`, `--token-border` |
| Component tokens | For specific components (only when needed) | `--token-dark-canvas` |
| Motion tokens | Duration/easing | `--duration-fast`, `--ease-standard` |

### Tailwind v4 CSS-first Configuration

Define tokens with the `@theme` directive and expose them as utilities:

```css
@theme {
  /* Colors - semantic tokens */
  --color-background: var(--token-canvas);
  --color-foreground: var(--token-text);
  --color-primary: var(--token-surface-ink);
  --color-accent: var(--token-accent);

  /* Typography */
  --font-body: "M PLUS Rounded 1c", sans-serif;
  --font-display: "Shippori Mincho B1", serif;

  /* Radius scale */
  --radius-sm: 0.5rem;
  --radius-md: 0.875rem;
  --radius-lg: 1.25rem;
  --radius-xl: 1.5rem;
  --radius-2xl: 2rem;
}
```

### Color Format

All colors use the `oklch()` format (for perceptual uniformity):

```css
:root {
  /* Base palette */
  --palette-ink-900: oklch(0.21 0.02 285);
  --palette-ink-800: oklch(0.28 0.02 285);
  --palette-coral-100: oklch(0.90 0.08 50);

  /* With alpha */
  --palette-line: oklch(0.21 0.03 285 / 0.12);
}
```

### Color Mapping (JS Side)

For maintainability, make color definitions accessible from JS as well:

```typescript
// shared/lib/design-tokens.ts
export const colors = {
  ink: {
    900: "oklch(0.21 0.02 285)",
    800: "oklch(0.28 0.02 285)",
  },
  coral: {
    100: "oklch(0.90 0.08 50)",
  },
} as const;
```

## Arbitrary Values Restrictions

Arbitrary values are **prohibited in areas core to design consistency**:

| Area | Prohibited Example | Alternative |
|------|-------------------|-------------|
| Spacing | `p-[13px]`, `m-[7px]` | Use Tailwind scale (`p-3`, `m-2`) |
| Font size | `text-[15px]` | Define token in `@theme` |
| Border radius | `rounded-[10px]` | Use `--radius-*` tokens |
| Colors | `bg-[#ff6b6b]` | Add to palette first, then use |

**Allowed cases:**

- Layout-specific dimensions (`w-[calc(100%-2rem)]`)
- Artistic backgrounds/gradients
- Fixed values due to external constraints (e.g., video player aspect ratio)

```tsx
// NG: Arbitrary values for spacing/color
<div className="p-[13px] bg-[#custom]">

// OK: Layout requiring calculations
<div className="w-[calc(100%-var(--sidebar-width))]">

// OK: One-off artistic background
<div className="bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))]">
```

If unavoidable, document the reason in the component or a nearby comment.

## Component Design

### Variant Definition with cva

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
  {
    variants: {
      intent: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-11 px-6 text-lg",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
    },
  }
);

type ButtonProps = VariantProps<typeof buttonVariants> & {
  onClick?: () => void;
  disabled?: boolean;
};
```

### Using tailwind-merge

Always use the `cn` utility for conditional classes to prevent class name conflicts:

```typescript
// shared/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
// Usage example
<div className={cn(
  "bg-card rounded-lg p-4",
  isActive && "ring-2 ring-primary",
)}>
```

### Handling className Props

**Basic rule:** Do not accept `className` as a prop

```tsx
// NG: Accepting className as a prop
interface CardProps {
  className?: string;
  children: ReactNode;
}

// OK: Handle with variants
interface CardProps {
  variant: "default" | "elevated" | "outlined";
  children: ReactNode;
}
```

**Exception:** When wrapping shadcn/ui primitives, `className` may be accepted as an internal implementation detail

## shadcn/ui Adoption Policy

### Primitives to Use

Button, Input, Textarea, Select, Dialog, Tooltip, Popover, Tabs, Badge, Card, DropdownMenu

### Brand Wrappers

Place wrappers that combine shadcn primitives in `shared/components/presenters`:

| Wrapper | Base | Added Functionality |
|---------|------|---------------------|
| `ActionButton` | Button | Link support via `href` prop |
| `SurfaceCard` | Card | Tone variants (glass, soft, ink) |
| `TagPill` | Badge | Simplified API |

### UI Primitives List

Placed in `shared/components/ui/`:

| Component | Variants | Notes |
|-----------|----------|-------|
| `Button` | primary, secondary, ghost / sm, md, lg | CVA-based |
| `Card` | - | Base card container |
| `Badge` | mint, sky, lilac, amber, coral, ink | With color tones |
| `Input` | default, error | Form input |
| `Textarea` | default, error | Multi-line text |
| `Select` | default, error | Native select wrapper |
| `Chart` | - | Recharts wrapper |

## Normalize / Reset

Done within Tailwind's `@layer base`:

```css
@layer base {
  :root {
    color-scheme: light;
  }

  html {
    font-family: var(--font-body);
  }

  body {
    background: var(--token-canvas);
    color: var(--token-text);
    text-rendering: optimizeLegibility;
  }

  button,
  [role="button"] {
    cursor: pointer;
  }

  button:disabled,
  [role="button"][aria-disabled="true"] {
    cursor: not-allowed;
  }

  h1, h2, h3, h4 {
    font-family: var(--font-display);
  }

  a {
    color: inherit;
  }
}
```

## Animation

### Recommended Approaches

1. **UI libraries:** Framer Motion, React Spring
2. **JS-based animation:** GSAP, Anime.js
3. **Tailwind built-in:** `animate-spin`, `animate-pulse`, etc.

```tsx
// Framer Motion example
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  Content
</motion.div>
```

### Prohibited

- Adding new `@keyframes` to `globals.css`
- CSS-only custom animation definitions

### Legacy Code Migration

The following in `globals.css` are treated as **legacy** and should be gradually migrated to JS-based solutions:

- `@keyframes fadeUp` → Framer Motion
- `@keyframes floaty` → Framer Motion
- `@keyframes softPulse` → Framer Motion
- Custom classes in `@layer utilities` → Convert to React components

## Token Catalog

Tokens defined in `@theme` and available as Tailwind utilities:

### Colors

| Token | Usage |
|-------|-------|
| `bg-background` / `text-foreground` | Main canvas |
| `bg-primary` / `text-primary-foreground` | Primary action |
| `bg-accent` / `text-accent-foreground` | Accent |
| `bg-card` / `text-card-foreground` | Card background |
| `bg-dark-canvas` / `bg-dark-bar` | Dark mode specific |

### Radius

| Token | Value |
|-------|-------|
| `rounded-sm` | 0.5rem |
| `rounded-md` | 0.875rem |
| `rounded-lg` | 1.25rem |
| `rounded-xl` | 1.5rem |
| `rounded-2xl` | 2rem |

### Shadow (via CSS Variables)

| Variable | Usage |
|----------|-------|
| `--shadow-card` | Standard card |
| `--shadow-action` | Action buttons, prominent elements |
| `--shadow-hero` | Hero sections, large cards |

Usage: `shadow-[var(--shadow-card)]` or in React components with `style={{ boxShadow: 'var(--shadow-card)' }}`

### Motion (via CSS Variables)

| Variable | Value |
|----------|-------|
| `--duration-fast` | 150ms |
| `--duration-md` | 300ms |
| `--ease-standard` | cubic-bezier(0.2, 0.7, 0.2, 1) |

## File Structure

```
services/web/
├── app/
│   └── globals.css          # @theme, @layer base, CSS Variables only
└── shared/
    ├── components/
    │   ├── ui/              # shadcn/ui primitives (using cva)
    │   └── presenters/      # Brand wrappers
    └── lib/
        ├── utils.ts         # cn() utility
        └── design-tokens.ts # JS-side color mapping (optional)
```

### Allowed Content in globals.css

```css
/* Allowed */
@import "tailwindcss";
@theme { ... }
@layer base { ... }
:root { /* CSS Variables */ }

/* Prohibited */
@layer utilities { .custom-class { ... } }  /* Custom class definitions */
@keyframes newAnimation { ... }              /* New animations */
.my-class { ... }                            /* Classes outside Tailwind */
```

## Guardrails

- Treat token names as stable. After publishing, refactor usage sites, not token names
- Add new colors to the palette first, then map them to semantic roles
- Prefer Tailwind's default spacing scale. Add custom spacing only when used repeatedly
- Write all new colors in `oklch()` format

## Checklist

When adding new styles:

- [ ] Are arbitrary values not used in areas core to design consistency?
- [ ] Is `@apply` not being used?
- [ ] Are custom classes not defined in `@layer utilities`?
- [ ] Does the component include behavior (handlers, etc.)? (Not a CSS-only abstraction?)
- [ ] Are variants defined with `cva`?
- [ ] Are conditional classes using `cn()`?
- [ ] Are new colors in `oklch()` format?
- [ ] Have you checked if existing UI primitives (`ActionButton`, `SurfaceCard`, `TagPill`) can handle this?

## Reference Links

- [Tailwind CSS v4 - Adding Custom Styles](https://tailwindcss.com/docs/adding-custom-styles)
- [Class Variance Authority](https://cva.style/docs)
- [tailwind-merge](https://github.com/dcastil/tailwind-merge)
- [5 Best Practices for Preventing Chaos in Tailwind CSS](https://evilmartians.com/chronicles/5-best-practices-for-preventing-chaos-in-tailwind-css)
