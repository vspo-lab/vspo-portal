# Design Tokens

## Overview

Design tokens function as a shared language between designers and engineers, serving as the foundation for building consistent UIs efficiently. This guideline defines the types and usage of tokens.

## Token Architecture

A **3-layer token structure** is adopted:

```
Base Palette -> Semantic Tokens -> Component Tokens
```

1. **Base Palette**: Raw color values (OKLch format)
2. **Semantic Tokens**: Tokens that express intent (`--token-*`)
3. **Component Tokens**: Final tokens used with Tailwind (`--color-*`)

### OKLch Color Format

All colors are defined in **OKLch** format for perceptual uniformity:

```css
oklch(L C H / A)
/* L: Lightness (0-1), C: Chroma (0-0.4), H: Hue (0-360), A: Alpha */
```

Benefits of OKLch:
- Perceptually uniform lightness scale
- Intuitive alpha blending
- Directly calculable in CSS

---

## Token Types

### 1. Base Palette (Primitive Tokens)

Tokens with concrete values that carry atomic meaning at the lowest layer.

```css
/* Neutral */
--palette-ink-900: oklch(...);    /* Dark text */
--palette-ink-800: oklch(...);    /* Soft text */
--palette-ink-500: oklch(...);    /* Muted text */
--palette-cream-50: oklch(...);   /* Background */
--palette-white: oklch(1 0 0);    /* Pure white */

/* Accent colors */
--palette-accent-100: oklch(...); /* Primary accent */
--palette-info-100: oklch(...);   /* Information */
--palette-warning-100: oklch(...);/* Warning */
--palette-success-100: oklch(...);/* Success */

/* Soft variants (with alpha) */
--palette-line: oklch(... / 0.3);
```

### 2. Semantic Tokens

Values associated with specific contexts that convey the intended purpose of the token.

```css
/* Background */
--token-canvas: var(--palette-cream-50);   /* Main background */
--token-surface: var(--palette-white);     /* Card/panel background */

/* Text */
--token-text: var(--palette-ink-900);      /* Primary text */
--token-text-soft: var(--palette-ink-800); /* Secondary text */
--token-text-muted: var(--palette-ink-500);/* Muted text */

/* Border */
--token-border: var(--palette-line);

/* Accent */
--token-accent: var(--palette-accent-100);

/* Status colors */
--token-info: var(--palette-info-100);
--token-warning: var(--palette-warning-100);
--token-success: var(--palette-success-100);
```

### 3. Component Tokens (Tailwind Tokens)

Defined with the `@theme` directive and usable as Tailwind utilities.

```css
/* Background */
--color-background: var(--token-canvas);
--color-card: var(--token-surface);

/* Text */
--color-foreground: var(--token-text);
--color-foreground-soft: var(--token-text-soft);
--color-muted-foreground: var(--token-text-muted);

/* Accent */
--color-accent: var(--token-accent);

/* Status */
--color-info: var(--token-info);
--color-warning: var(--token-warning);
--color-success: var(--token-success);

/* Border */
--color-border: var(--token-border);
```

---

## Radius Tokens

Define the border-radius scale.

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.5rem (8px) | Small elements, chips |
| `--radius-md` | 0.875rem (14px) | Standard elements, buttons |
| `--radius-lg` | 1.25rem (20px) | Cards, panels |
| `--radius-xl` | 1.5rem (24px) | Large panels |
| `--radius-2xl` | 2rem (32px) | Modals, large cards |

---

## Shadow Tokens

Shadows that express elevation (floating effect).

| Token | Usage |
|-------|-------|
| `--shadow-card` | Cards, light elevation |
| `--shadow-action` | Buttons, interactive elements |
| `--shadow-hero` | Hero elements, emphasis |
| `--shadow-focus` | Focus ring |

---

## Motion Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Immediate feedback (hover, focus) |
| `--duration-md` | 300ms | Standard transitions (panel open/close) |
| `--ease-standard` | cubic-bezier(0.2, 0.7, 0.2, 1) | Standard easing |

---

## Typography Tokens

| Token | Usage |
|-------|-------|
| `--font-body` | Body text |
| `--font-display` | Headings (h1-h4) |

---

## How to Use Tokens

### Using with Tailwind CSS

Tokens defined with the `@theme` directive can be used as Tailwind utilities.

```tsx
// Background colors
<div className="bg-background" />
<div className="bg-card" />

// Text colors
<p className="text-foreground" />
<p className="text-muted-foreground" />

// Border
<div className="border border-border" />

// Border radius
<div className="rounded-lg" />
<div className="rounded-2xl" />

// Shadow
<div className="shadow-card" />
```

### Using as CSS Variables

```css
.custom-element {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  transition: all var(--duration-fast) var(--ease-standard);
}
```

---

## Token Design Guidelines

### Naming Conventions

```
--{layer}-{category}-{variant}

Examples:
--palette-ink-900      (Base Palette)
--token-text-soft      (Semantic Token)
--color-foreground     (Component Token)
```

### Adding New Tokens

1. **Add primitive**: First add a value to `--palette-*`
2. **Create semantic**: Express intent with `--token-*`
3. **Expose to Tailwind**: Define `--color-*` with `@theme` as needed
4. **Document**: Add to this document

### Prohibited Practices

- Direct use of hardcoded values (use via tokens)
- Overriding existing token values
- Using meaningless abbreviations
- Direct use of Tailwind default colors (e.g., `bg-blue-500`)

---

## References

- [CSS Guidelines](../web-frontend/css.md)
- [Color Guidelines](./colors.md)
- [Typography Guidelines](./typography.md)
- [Utility Classes](./utilities.md)
