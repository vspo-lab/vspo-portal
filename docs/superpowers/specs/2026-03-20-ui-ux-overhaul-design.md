# UI/UX Comprehensive Improvement — Design Document

## Context

Comprehensively improve the UI/UX across all pages of the vspo-portal web frontend (Next.js 15 / MUI v7 / Emotion).

**Background:**
- The 3-layer token architecture designed in `docs/design/design-tokens.md` has not been reflected in actual code
- Theme.tsx shares the same palette for light/dark, resulting in poor dark mode quality
- Card components lack hover effects and status differentiation, making the visual distinction between live/archive weak
- Bottom navigation has only 3 items, and Freechat is hidden in a drawer
- Loading uses spinner + opacity:0, causing layout shift
- Typography is inconsistent, with minimum size violations below 10px

**Approach:** Hybrid — Advance minimal foundation work (dark mode separation + status colors) and card improvements simultaneously, then gradually expand to full token completion and page-specific UX.

---

## Phase 1: Dark Mode Separation + Status Colors + Card Improvements

### 1-1. Theme Foundation

**Target:** `src/context/Theme.tsx`, `src/types/mui-styles.d.ts`

- Deprecate `sharedColorSystemOptions` and split into `colorSchemes.light` / `colorSchemes.dark`
- Dark mode dedicated palette:
  - `videoHighlight.live`: `"#E53935"` (light) / `"#FF5252"` (dark — brighter)
  - `videoHighlight.upcoming`: `"#2D4870"` (light) / `"#5C8DBE"` (dark — improved visibility)
  - `videoHighlight.trending`: `"#E53935"` (light) / `"#FF5252"` (dark) — must be included in both schemes
- Add semantic colors: `status.success`, `status.warning`, `status.info`
- **Dark mode style application rules:**
  - Inside `styled()` callbacks: Continue using the existing `theme.getColorSchemeSelector("dark")` pattern (`theme.applyStyles()` is not supported inside `styled()`)
  - Inside `sx` prop / `styleOverrides`: Use `theme.applyStyles('dark', {...})` (MUI v7 recommended)
  - Both APIs can coexist in new code, but keep them consistent within the same file
- `mui-styles.d.ts`: Convert `interface CustomPalette` to `type CustomPalette = { ... }` (complying with CLAUDE.md no-interface rule). Add `status` field

### 1-2. VideoCard Improvements

**Target:** `src/features/shared/components/Elements/Card/VideoCard.tsx`

- `backgroundColor: "white"` → `theme.vars.palette.background.paper`
- `border: 3px solid` → Remove, change to `borderRadius: 12px` + `box-shadow: --shadow-card`
- Add hover effect: `translateY(-4px)` + `shadow elevation 4` + `transition: 150ms ease`
- `prefers-reduced-motion` support
- PlatformIconWrapper: Dark mode support `background: rgba(0,0,0,0.5)` + `backdropFilter: blur(4px)`
- Add `thumbnailOverlay` prop:
  - Type: `thumbnailOverlay?: React.ReactNode`
  - Render position: Inside `StyledCardMedia`, immediately after `<Image>`, at the same level as `PlatformIconWrapper`
  - Purpose: Freely placeable slot for viewer count badges, LIVE badges, etc.

### 1-3. LivestreamCard Improvements

**Target:** `src/features/schedule/pages/ScheduleStatus/components/LivestreamContent/LivestreamCard.tsx`

- Hardcoded `#ff0000` / `#2D4870` → Reference `theme.vars.palette.customColors.videoHighlight.*`
- Add LIVE badge on thumbnail (pulse dot + "LIVE" text, backdrop-filter) → Pass to VideoCard via `thumbnailOverlay` prop
- Viewer count overlay (via `thumbnailOverlay` prop)
- `TitleTypography`: `lineHeight: 1.2` → `1.5`, `height: 2.4em` → `3.0em`
- `CreatorTypography`: `lineHeight: 1.2` → `1.4`
- Time display: Strengthen to `fontWeight: 600`, add red dot `::before` when live

### 1-4. Status Differentiation

- **LIVE:** Subtle glow (`box-shadow: 0 0 0 2px rgba(229,57,53,0.3)`), thumbnail LIVE badge (pulse animation), viewer count
- **UPCOMING:** Countdown display "2h 15m remaining", normal shadow
- **ARCHIVE:** Thumbnail `filter: saturate(0.7)` + `opacity: 0.85`, view count display

### 1-5. HighlightedVideoChip Improvements

**Target:** `src/features/shared/components/Elements/Chip/HighlightedVideoChip.tsx`

- When live: Pulse animation (`@keyframes livePulse`)
- `fontSize: "15px"` → Unify to `"0.75rem"`

---

## Phase 2: Navigation + Skeleton Loading + Live Section

### 2-1. Bottom Navigation Redesign

**Target:** `src/features/shared/components/Layout/Navigation.tsx`, `src/constants/navigation.ts`

- **Type design:** Change the type of `bottomNavigationRoutes` from `NavigationRouteId[]` to `BottomNavItem[]`
  - `type BottomNavItem = NavigationRouteId | "more"`
  - `"more"` is handled via a dedicated render path, not through `getNavigationRouteInfo()`
- `bottomNavigationRoutes`: `["list", "clip", "freechat", "more"]`
- Tapping `"more"` opens the drawer (not a route navigation) — receives `onDrawerToggle` callback as a prop
- Label shortening: "List" → "Streams"
- Multiview moves into the drawer
- Add `"more"` case to `DrawerIcon` (`MoreHorizIcon`)
- Add translation keys: `bottomNav.pages.freechat`, `bottomNav.pages.more`

**Target:** `src/features/shared/components/Layout/ContentLayout.tsx`, `src/features/shared/components/Layout/Header.tsx`

- Lift drawer state management to ContentLayout:
  - Manage `const [drawerOpen, setDrawerOpen] = useState(false)` in `ContentLayout`
  - Add `drawerOpen: boolean`, `onDrawerToggle: () => void` to `Header` props
  - Remove internal `useState` and `CustomDrawer` rendering from `Header`
  - Render `CustomDrawer` in `ContentLayout`
  - Add `onDrawerToggle: () => void` to `CustomBottomNavigation`

### 2-2. Header Improvements (Desktop)

**Target:** `src/features/shared/components/Layout/Header.tsx`

- `md` and above: Hamburger menu → Inline tab navigation (Streams/Clips/Freechat/Multiview) — Toggle with `useMediaQuery(theme.breakpoints.up('md'))`
- Add search icon (global access to DateSearchDialog)
- Settings popover (quick access to theme toggle, language, timezone) — Using MUI `Popover`
- `sm` and below: Maintain current hamburger menu (but `drawerOpen`/`onDrawerToggle` as external props)

### 2-3. Skeleton Loading

**New:** `src/features/shared/components/Elements/Skeleton/VideoCardSkeleton.tsx`

- Use MUI `Skeleton` with `animation="wave"`
- Thumbnail: `variant="rectangular"` (16:9 aspect ratio)
- Text lines: `variant="text"` (title, creator name)
- Avatar: `variant="circular"` (32px)

**New:** `src/features/shared/components/Elements/Skeleton/LivestreamGridSkeleton.tsx`

- Place 6-8 VideoCardSkeleton instances in a Grid layout

**Target:** `src/features/schedule/pages/ScheduleStatus/presenter.tsx`

- Remove `LoadingOverlay` styled component
- Remove content `Box` opacity/visibility toggle logic (current lines 104-110)
- When `isLoading`, show `<LivestreamGridSkeleton />`; when `!isLoading`, show content with MUI `Fade` (`timeout={300}`)
- **SSR consideration:** On server-side, `isLoading = false` (data already fetched via SSR props), so skeletons are not shown on initial render. Skeletons are only shown during client-side tab switching (re-fetch via `router.push`)

### 2-4. "Now Live" Section

**Target:** `src/features/schedule/pages/ScheduleStatus/components/LivestreamContent/presenter.tsx`

- When `statusFilter === "all"`, display a "Currently Live" section at the top of the page
- Horizontal scroll (`overflow-x: auto`, `scroll-snap-type: x mandatory`)
- Display live stream cards slightly larger
- Hide section when there are 0 live streams
- Add stream count badge to time block headers

---

## Phase 3: Full Token Architecture + Typography + Web Fonts

### 3-1. 3-Layer Token Architecture Implementation

**Target:** `src/styles/globals.css`

- Define CSS Custom Properties on `:root`:
  - Base Palette: `--palette-purple-100`, `--palette-ink-900`, etc. (OKLch values)
  - Semantic Tokens: `--token-accent`, `--token-live`, `--token-canvas`, etc.
  - Component Tokens: `--color-accent`, `--color-live`, `--color-background`, etc.
  - Radius: `--radius-sm(8px)` / `--radius-md(14px)` / `--radius-lg(20px)` / `--radius-xl(24px)` / `--radius-2xl(32px)`
  - Shadow: `--shadow-card` / `--shadow-action` / `--shadow-hero` / `--shadow-focus`
  - Motion: `--duration-fast(150ms)` / `--duration-md(300ms)` / `--ease-standard`
- Override dark mode tokens with `.dark` class selector (matches because MUI's `colorSchemeSelector: "class"` sets `<html class="dark">`)
- **Boundary with MUI CSS variables:**
  - MUI-managed variables (`--mui-palette-*`) are referenced via MUI theme (`theme.vars.palette.*`)
  - Custom tokens (`--palette-*`, `--token-*`, `--color-*`) are used in non-MUI contexts (globals.css utilities, future non-MUI components)
  - In component code, prefer `theme.vars.*` and avoid direct CSS Custom Property references
  - `theme.vars.palette.customColors.*` references introduced in Phase 1 are maintained as-is (not replaced with tokens)

### 3-2. Typography Improvements

**Target:** `src/context/Theme.tsx`

- Baseline settings in the theme's `typography`:
  - `body1`: `fontSize: "0.875rem"`, `lineHeight: 1.5`
  - `body2`: `fontSize: "0.8rem"`, `lineHeight: 1.4`
  - `caption`: `fontSize: "0.75rem"`, `lineHeight: 1.4`
  - `h5`: `fontSize: "1.25rem"`, `fontWeight: 600`, `lineHeight: 1.4`
  - `h6`: `fontSize: "1rem"`, `fontWeight: 600`, `lineHeight: 1.4`
- Responsive headings: Do not use `responsiveFontSizes()` (poor compatibility with CSS variables mode). Instead, define breakpoint-specific overrides within `createTheme`:
  ```
  h5: {
    fontSize: "1.25rem",
    [theme.breakpoints.down('sm')]: { fontSize: "1.1rem" },
  }
  ```

**Target:** `src/features/shared/components/Layout/Header.tsx`

- `StyledSubtitle` `fontSize: "0.5rem"` → `"0.7rem"` (fixing 10px minimum size violation)

### 3-3. Web Font Introduction

**Target:** `src/pages/_document.tsx`

- `<link rel="preconnect">` + Google Fonts CSS:
  - Body: `Noto Sans JP` (400/500/700)
  - Headings: `M PLUS Rounded 1c` (500/700)
  - `display=swap` to prevent FOIT
- Add `<link rel="preload">` for critical font weights
- **Cloudflare Workers CSP check:** Before deployment, verify that `fonts.googleapis.com` and `fonts.gstatic.com` are allowed in `style-src` / `font-src` directives. If CSP headers exist, update Cloudflare Workers configuration

**Target:** `src/context/Theme.tsx`

- `typography.fontFamily`: `'"Noto Sans JP", "Hiragino Kaku Gothic Pro", system-ui, sans-serif'`
- `h1-h4.fontFamily`: `'"M PLUS Rounded 1c", "Noto Sans JP", sans-serif'`

---

## Phase 4: Page-Specific UX + Interactions

### 4-1. Site News: Table → Card Layout

**Target:** `src/features/site-news/pages/SiteNewsPage/presenter.tsx`

- `Table` (minWidth: 650) → `Grid` + `Card` layout
- Tag filter: Chip row at the top, click to filter
- Mobile 1-column / Desktop 2-column
- Each card: Title (Typography h6), Date (caption), Tags (Chip row)

### 4-2. Clips: Add Tab Navigation

**Target:** `src/features/clips/pages/ClipsHome/presenter.tsx`

- Tab bar at the top: All / YouTube / Shorts / Twitch
- **"All" tab:** Maintain the current multi-section carousel layout (each platform section + "See more" button)
- **Platform tabs:** SSR navigation to existing subpages (`/clips/youtube/`, etc.) via `router.push`. Not client-side filtering (because each subpage has its own SSR data)
- Shorts subpage: Change grid to `xs: 4` (3 columns) to optimize for portrait content

### 4-3. Freechat: Grouping + Active Display

**Target:** `src/features/freechat/pages/FreechatPage/presenter.tsx`

- Display "Active X items" count at the top of the page
- Group by status: Active → Upcoming → Archive
  - `freechat.status` field is available via `livestreamSchema` inheritance (no additional data layer changes needed)
  - Grouping logic is implemented as filter functions within the presenter
- Green dot indicator on active cards

### 4-4. General Interactions

- Tab switching: Content switching with MUI `Fade` transition (`timeout={300}`)
- Breadcrumbs: Add to `/about`, `/freechat`, `/clips/*`, `/site-news/*`, `/terms`, `/privacy-policy`
- FAB: Show/hide based on scroll direction (hide on scroll down, show on scroll up)
- Disable animations when `prefers-reduced-motion: reduce`

---

## Verification Methods

### Common Across All Phases
1. Start locally with `pnpm dev`
2. Visually check all pages in both light/dark mode
3. Check with Chrome DevTools mobile emulation (375px, 768px, 1440px)
4. Pass lint and type checks with `./scripts/post-edit-check.sh`

### Phase 1 Verification
- Confirm visual differentiation of live/upcoming/archive cards on `/schedule/all`
- Confirm lift effect on card hover
- Confirm visibility of status colors in dark mode
- No TypeScript compilation errors (all keys including `trending` exist in both colorSchemes)

### Phase 2 Verification
- Confirm bottom navigation 4-item behavior ("More" opens/closes drawer)
- Confirm header inline navigation display at desktop width
- Confirm skeletons are displayed during loading (triggered on tab switching)
- Confirm skeletons are NOT displayed on SSR initial render
- Confirm horizontal scroll behavior of "Currently Live" section

### Phase 3 Verification
- Confirm CSS Custom Properties are defined on `:root` using DevTools
- Confirm `.dark` class token overrides are correctly applied
- Confirm web fonts load correctly via the Network tab
- Confirm no CSP errors on Cloudflare Workers deployment
- Confirm typography line-height corrections

### Phase 4 Verification
- Confirm `/site-news` displays without horizontal scroll on mobile
- Confirm clip page tab switching works correctly ("All" tab maintains carousel)
- Confirm freechat grouping and count display
- Confirm breadcrumbs are displayed on each page
