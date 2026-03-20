# Styling

## Approach

- **MUI v7** components as the primary UI building blocks
- **Emotion** `styled()` for custom styling and theme-aware components
- **MUI `sx` prop** for inline/one-off styling
- **CSS variables** for theme colors (`cssVariables: true` in theme config)
- **No Tailwind** -- all styling through MUI and Emotion

## Theme

Custom theme defined in `context/Theme.tsx` using MUI's `createTheme`:

```tsx
const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: { palette: { customColors: { /* ... */ } } },
    dark: { palette: { customColors: { /* ... */ } } },
  },
});
```

### Custom Colors

| Name | Usage |
|------|-------|
| `vspoPurple` | Brand primary color, header background |
| `darkBlue` | Secondary brand color |
| `gray` | Neutral backgrounds |
| `darkGray` | Dark mode backgrounds |
| `videoHighlight` | Nested object: `{ live: "red", upcoming: "rgb(45, 75, 112)", trending: "red" }` |

### Color Scheme

Light/dark mode is managed via MUI's CSS variable system with `InitColorSchemeScript`. The user's preference persists automatically.

## Styling Patterns

### Styling Patterns

| Pattern | When |
|---------|------|
| MUI component props | Layout, spacing, color (`variant`, `color`, `size`) |
| `sx` prop | One-off adjustments, responsive styles |
| Emotion `styled()` | Reusable styled components, complex theme-dependent styles |
| Global CSS | Reset, scrollbar, font-face (minimal use) |

Use `theme.vars.*` (CSS variables) instead of `theme.palette.*` in `styled()` for light/dark mode compatibility.

## MUI Component Usage

Use MUI components as the default UI primitives. Avoid creating custom components that replicate MUI functionality.

## Layout Components

Shared layout components in `features/shared/components/Layout/`:

| Component | Purpose |
|-----------|---------|
| `ContentLayout` | Main page wrapper (Head, Header, Footer, BottomNav) |
| `Header` | Fixed AppBar with logo, menu toggle, social links |
| `Footer` | Last update time, legal links, copyright |
| `Navigation` | Bottom navigation bar (mobile) + sidebar drawer |
