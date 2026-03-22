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
