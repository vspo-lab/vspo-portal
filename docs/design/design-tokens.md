# Design Tokens

## Token Architecture

3-layer structure: `Base Palette -> Semantic Tokens -> Component Tokens`

1. **Base Palette** (`--palette-*`): Raw color values in [OKLch format](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) -- `oklch(L C H / A)`
2. **Semantic Tokens** (`--token-*`): Intent-based aliases
3. **Component Tokens** (`--color-*`): Final values consumed by MUI/Emotion

## Color Tokens

### Base Palette

```css
/* Neutral */
--palette-ink-900: oklch(...);     /* Dark text */
--palette-ink-800: oklch(...);     /* Soft text */
--palette-ink-500: oklch(...);     /* Muted text */
--palette-cream-50: oklch(...);    /* Background */
--palette-white: oklch(1 0 0);

/* Accent & Status */
--palette-accent-100: oklch(...);
--palette-info-100: oklch(...);
--palette-warning-100: oklch(...);
--palette-success-100: oklch(...);
--palette-line: oklch(... / 0.3);
```

### Semantic -> Component mapping

```css
/* Semantic                          Component */
--token-canvas: var(--palette-cream-50);    --color-background: var(--token-canvas);
--token-surface: var(--palette-white);      --color-card: var(--token-surface);
--token-text: var(--palette-ink-900);       --color-foreground: var(--token-text);
--token-text-soft: var(--palette-ink-800);  --color-foreground-soft: var(--token-text-soft);
--token-text-muted: var(--palette-ink-500); --color-muted-foreground: var(--token-text-muted);
--token-accent: var(--palette-accent-100);  --color-accent: var(--token-accent);
--token-border: var(--palette-line);        --color-border: var(--token-border);
--token-info: var(--palette-info-100);      --color-info: var(--token-info);
--token-warning: var(--palette-warning-100);--color-warning: var(--token-warning);
--token-success: var(--palette-success-100);--color-success: var(--token-success);
```

## Other Tokens

| Category | Tokens |
|----------|--------|
| **Radius** | `--radius-sm` (8px), `--radius-md` (14px), `--radius-lg` (20px), `--radius-xl` (24px), `--radius-2xl` (32px) |
| **Shadow** | `--shadow-card`, `--shadow-action`, `--shadow-hero`, `--shadow-focus` |
| **Motion** | `--duration-fast` (150ms), `--duration-md` (300ms), `--ease-standard` (cubic-bezier(0.2,0.7,0.2,1)) |
| **Typography** | `--font-body` (body text), `--font-display` (headings) |

## Usage

```tsx
// MUI sx prop (using theme.vars for light/dark mode compatibility)
<Box sx={{ bgcolor: "background.default", color: "text.primary" }} />

// Emotion styled() with theme access
const Card = styled("div")(({ theme }) => ({
  backgroundColor: theme.vars.palette.background.paper,
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2.5, // ~20px
  boxShadow: theme.shadows[1],
}));
```

## Naming Convention

```
--{layer}-{category}-{variant}
--palette-ink-900      (Base)
--token-text-soft      (Semantic)
--color-foreground     (Component)
```

## Adding New Tokens

1. Add value to `--palette-*`
2. Create semantic alias `--token-*`
3. Expose as `--color-*` if needed
4. Document here

**Prohibited**: hardcoded values, overriding existing tokens, raw color values in components.

## References

- [Styling Guidelines](../web-frontend/styling.md)
- [Color Guidelines](./colors.md)
- [Typography Guidelines](./typography.md)
- [Utility Classes](./utilities.md)
