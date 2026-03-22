# Shared Components

Components in `features/shared/components/` used across multiple features.

## Layout Components

Located in `features/shared/components/Layout/`.

### ContentLayout

Main page wrapper. Each `page.tsx` (Server Component) wraps its content in `ContentLayout` directly. `ContentLayout` itself is a `"use client"` component.

Metadata (title, description, OG tags) is handled by `generateMetadata` exported from each `page.tsx`, not by ContentLayout.

```text
ContentLayout
├── Header (fixed AppBar + menu toggle + logo + social links)
├── AlertSnackbar
├── StyledContainer (children)
├── Footer (last update time, legal links, copyright)
└── CustomBottomNavigation (mobile: schedule, clips, multiview)
```

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Page content |
| `title` | `string` | Page title (used by Header) |
| `path` | `string?` | Current path |
| `maxPageWidth` | `Breakpoint \| false?` | MUI container max width |
| `padTop` | `boolean?` | Add top padding |
| `lastUpdateTimestamp` | `number?` | Last data update (shown in footer) |
| `footerMessage` | `string?` | Custom footer message |

Special case: removes padding when `path === "/multiview"`.

### Header

Fixed AppBar with:

- Menu toggle button (opens sidebar drawer)
- Logo linking to `/schedule/all`
- Social icons (GitHub, Twitter/X)
- Custom VSPO purple/dark theme colors

### Footer

- Last update timestamp (formatted with user's timezone)
- Legal links: Home, Terms, Privacy Policy
- Copyright with dynamic year

### CustomBottomNavigation

Mobile-only fixed bottom bar with 3 routes:

- Schedule (`/schedule/all`)
- Clips (`/clips`)
- Multiview (`/multiview`)

Active state detection via URL path matching.

## Element Components

Located in `features/shared/components/Elements/`.

### VideoCard

Displays a video thumbnail as a clickable card.

| Prop | Type | Description |
|------|------|-------------|
| `video` | `Video` | Video data (thumbnail, platform, link) |
| `children` | `ReactNode` | Card body content |
| `highlight` | `{ label, color, bold }?` | Status chip (e.g., "LIVE", "Upcoming") |

Behavior:

- 16:9 aspect ratio thumbnail via Next.js Image
- Platform icon overlay (top-left)
- Highlight chip (top-right) with colored border
- Opens `VideoModal` via `pushVideo()` on click

### VideoModal

Full-screen dialog for video playback. No props -- uses `VideoModalContext`.

Features:

- Embedded video player (platform-specific iframe)
- Tabbed info panel: Overview + Chat
- Overview: title, status, start time, channel info, description, watch/share links
- Chat: embedded live chat (YouTube/Twitch, non-ended streams only)
- Stack-based navigation (back button through modal history)
- Responsive: stacked on mobile, 2-column on desktop

### ChatEmbed

Renders an embedded chat iframe for a livestream.

| Prop | Type | Description |
|------|------|-------------|
| `livestream` | `Livestream \| Freechat` | Stream with chatPlayerLink |

Respects dark mode, shows loading spinner during iframe load.

### TimeZoneSelector

Autocomplete field with all IANA timezones. No props -- uses `TimeZoneContext`.

- Shows UTC offset (e.g., "UTC+9:00")
- On change: updates timezone cookie and refreshes page if offset differs

### LanguageSelector

Select dropdown for locale switching. No props -- uses locale context.

- Options: English, Japanese, Chinese (Simplified/Traditional), Korean
- On change: updates locale cookie

### Other Elements

| Component | Location | Purpose |
|-----------|----------|---------|
| `ThemeToggleButton` | `Elements/Button/` | Light/dark mode toggle |
| `TweetEmbed` | `Elements/Card/` | Embedded tweet display |
| `HighlightedVideoChip` | `Elements/Chip/` | Status chip (Live, Upcoming, etc.) |
| `Drawer` | `Elements/Drawer/` | Sidebar navigation drawer |
| `Icon` | `Elements/Icon/` | Platform icon wrapper (YouTube, Twitch, etc.) |
| `Link` / `Breadcrumb` | `Elements/Link/` | Navigation links with locale awareness |
| `Loading` | `Elements/Loading/` | Circular loading spinner |
| `MarkdownContent` | `Elements/MarkdownContent/` | Renders markdown as HTML |
| `AlertSnackbar` | `Elements/Snackbar/` | Alert notifications |
| `GoogleAnalytics` | `Elements/Google/` | GA script injection |

## Templates

### AgreementDocument

Wrapper for legal documents (privacy policy, terms). Pages use `generateStaticParams` for SSG.
