# Design Tokens

## Token Architecture (vspo-schedule)

The main application (`service/vspo-schedule/v2/web`) uses MUI's `createTheme` with the `cssVariables` option. Colors, shadows, and shape values are defined in the MUI theme object and accessed via `theme.*` or MUI's `sx` prop -- there is no separate CSS custom-property layer or OKLch color format.

### Theme Definition

Source: `service/vspo-schedule/v2/web/src/context/Theme.tsx`

```tsx
const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: { palette: { customColors: { vspoPurple: "#7266cf", /* ... */ } } },
    dark:  { palette: { customColors: { vspoPurple: "#7266cf", /* ... */ } } },
  },
  // mixins, component overrides, etc.
});
```

Key points:

- Light/dark mode is toggled via a CSS class selector (`colorSchemeSelector: "class"`).
- Custom brand colors are placed under `palette.customColors`.
- Component-level overrides (e.g., `MuiDrawer` scrollbar) live in `theme.components`.

### Color Tokens

Colors are provided by MUI's default palette plus the `customColors` extension:

| Token path | Value | Purpose |
|---|---|---|
| `palette.customColors.vspoPurple` | `#7266cf` | Brand accent |
| `palette.customColors.darkBlue` | `rgb(45, 75, 112)` | Secondary accent |
| `palette.customColors.gray` | `#353535` | Neutral |
| `palette.customColors.darkGray` | `#212121` | Dark neutral |
| `palette.customColors.videoHighlight.live` | `red` | Live stream indicator |
| `palette.customColors.videoHighlight.upcoming` | `rgb(45, 75, 112)` | Upcoming stream indicator |

All other colors (background, text, divider, etc.) come from MUI's built-in light/dark palettes.

## Usage

```tsx
// MUI sx prop
<Box sx={{ bgcolor: "background.default", color: "text.primary" }} />

// Emotion styled() with theme access
const Card = styled("div")(({ theme }) => ({
  backgroundColor: theme.vars.palette.background.paper,
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2.5,
  boxShadow: theme.shadows[1],
}));
```

## Adding New Tokens

1. Add the value to the MUI theme object in `Theme.tsx` (under `palette`, `shape`, `mixins`, etc.)
2. For custom brand values, add under `palette.customColors`
3. Document here

**Prohibited**: hardcoded color values in components -- always reference `theme.*` or MUI palette paths.

## References

- [Styling Guidelines](../web-frontend/styling.md)
- [Color Guidelines](./colors.md)
- [Typography Guidelines](./typography.md)
- [Utility Classes](./utilities.md)

---

## Bot Dashboard Token Architecture

The bot-dashboard (`service/bot-dashboard/src/app.css`) uses a simplified 2-layer token architecture adapted for Tailwind CSS 4:

### Layer Structure

1. **Semantic variables (`--sem-*`):** Light/dark mode values defined in `:root` and `.dark` CSS blocks
2. **Utility binding (`--color-*`):** Tailwind CSS 4 `@theme inline` maps utility class names to `var(--sem-*)` references

This differs from the MUI theme approach used in vspo-schedule. The bot-dashboard has a smaller design surface and uses Tailwind CSS 4's `@theme inline` directive, which requires this indirection pattern.

### Example

```css
@theme inline {
  --color-background: var(--sem-background);
}

:root {
  --sem-background: #ffffff;  /* light */
}

.dark {
  --sem-background: #121212;  /* dark */
}
```

Brand colors (`--color-vspo-purple`, `--color-discord`) are constant across modes and defined directly in `@theme`.

### Surface Hierarchy (6-tier Tonal System)

Inspired by Material Design 3's tonal surface system. Boundaries between layout areas are defined by background color shifts, not borders ("No-Line Rule").

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `surface` | `#121317` | `#fafafa` | Global canvas / main content area |
| `surface-container-lowest` | `#0d0e12` | `#ffffff` | Sidebar background, deepest layer |
| `surface-container-low` | `#1a1b20` | `#f5f5f5` | Table containers, secondary areas |
| `surface-container` | `#1e1f24` | `#efefef` | Header bar, card backgrounds |
| `surface-container-high` | `#292a2e` | `#e8e8e8` | Table header, modal backgrounds |
| `surface-container-highest` | `#343439` | `#e0e0e0` | Active states, hover, language chips |

Text tokens:
- `on-surface` — primary text on any surface (`#e3e2e7` dark / `rgba(0,0,0,0.87)` light)
- `on-surface-variant` — secondary/muted text (`#c6c5d7` dark / `rgba(0,0,0,0.6)` light)

Accent tokens:
- `primary-container` (`#5865f2`) — Discord blurple, used for Discord-specific CTAs
- `tertiary` (`#ffb689` dark / `#e67e22` light) — amber accent for status highlights
- `outline-variant` (`#454655` dark) — ghost borders at 15-20% opacity

### Glass Effect

Floating elements (modals, dropdowns, tooltips) use `backdrop-filter: blur(20px) saturate(180%)` with semi-transparent `surface-container-high/90` backgrounds. Falls back to solid background on unsupported browsers via `@supports`.

### Typography Scale

Editorial scale using existing fonts (M PLUS Rounded 1c for headings, Noto Sans JP for body):

| Token | Size | Usage |
|-------|------|-------|
| `--font-size-display` | 3rem (48px) | Hero headlines |
| `--font-size-headline` | 2rem (32px) | Page titles |
| `--font-size-title` | 1.25rem (20px) | Section headings |
| `--font-size-body` | 0.875rem (14px) | Body text, table data |
| `--font-size-label` | 0.75rem (12px) | Labels, chips, captions |
