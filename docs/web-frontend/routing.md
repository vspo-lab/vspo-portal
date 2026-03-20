# Routing

## Pages Router Pattern

Each page file in `pages/` is a thin entry point that delegates to a feature module:

```tsx
// pages/schedule/[status].tsx
import { ScheduleStatus } from "@/features/schedule/pages/ScheduleStatus";
import { getLivestreamsServerSideProps } from "@/features/schedule/pages/ScheduleStatus/serverSideProps";

const SchedulePage: NextPageWithLayout<SchedulePageProps> = ({ pageProps }) => {
  return <ScheduleStatus {...pageProps} />;
};

SchedulePage.getLayout = (page, pageProps) => (
  <ContentLayout
    title={pageProps.meta.title}
    description={pageProps.meta.description}
    path={`/${locale}/schedule/${status}`}
  >
    {page}
  </ContentLayout>
);

export const getServerSideProps = getLivestreamsServerSideProps;
export default SchedulePage;
```

Page files should contain no business logic -- only wiring between Next.js routing and feature modules.

## Route Map

| Path | Page File | Feature |
|------|-----------|---------|
| `/` | redirect | -> `/schedule/all` |
| `/schedule/all` | `schedule/[status].tsx` | schedule |
| `/schedule/live` | `schedule/[status].tsx` | schedule |
| `/schedule/upcoming` | `schedule/[status].tsx` | schedule |
| `/schedule/archive` | `schedule/[status].tsx` | schedule |
| `/clips` | `clips/index.tsx` | clips (ClipsHome) |
| `/clips/youtube` | `clips/youtube/index.tsx` | clips (YouTubeClips) |
| `/clips/youtube/shorts` | `clips/youtube/shorts/index.tsx` | clips (YouTubeClips, type=short) |
| `/clips/twitch` | `clips/twitch/index.tsx` | clips (TwitchClips) |
| `/freechat` | `freechat.tsx` | freechat |
| `/multiview` | `multiview.tsx` | multiview |
| `/about` | `about.tsx` | about |
| `/site-news` | `site-news/index.tsx` | site-news |
| `/site-news/[id]` | `site-news/[id].tsx` | site-news |
| `/privacy-policy` | `privacy-policy.tsx` | legal-documents |
| `/terms` | `terms.tsx` | legal-documents |

All routes are locale-prefixed at runtime: `/{locale}/schedule/all`, `/{locale}/clips`, etc.

### Redirects (next.config.js)

- `/` -> `/schedule/all`
- `/notifications/*` -> `/site-news/*` (legacy URL support)

## Per-Page Layout

`_app.tsx` supports per-page layouts via `NextPageWithLayout`. Each page defines a `getLayout` function to wrap itself in `ContentLayout` with appropriate metadata. The provider stack (Theme, TimeZone, VideoModal) is defined in `_app.tsx` -- see [State Management](./state-management.md#context-providers) for details.

## Layout System

See [Styling - Layout Components](./styling.md#layout-components) for ContentLayout, Header, Footer, and Navigation details.

Route definitions live in `constants/navigation.ts`:

```typescript
const internalRoutes = {
  list: "/schedule/all",
  archive: "/schedule/archive",
  live: "/schedule/live",
  upcoming: "/schedule/upcoming",
  freechat: "/freechat",
  clip: "/clips",
  multiview: "/multiview",
  about: "/about",
  "site-news": "/site-news",
};
```

## Middleware

See [Middleware](./middleware.md) for the full request flow, locale resolution algorithm, timezone/session handling, and cookie settings.
