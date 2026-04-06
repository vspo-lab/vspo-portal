# SEO & Meta Tag Improvements

## Current State

### Meta Tag Overview

| Feature | Status | Location |
|---------|--------|----------|
| `<title>` | Per-page via `Base.astro` prop | `layouts/Base.astro` |
| OGP (`og:*`) | Complete set in `Base.astro` | `layouts/Base.astro` |
| Twitter Card | `summary_large_image` | `layouts/Base.astro` |
| Canonical URL | `Astro.url.href` | `layouts/Base.astro` |
| Hreflang | `<link rel="alternate">` for ja/en | `layouts/Base.astro` |
| Sitemap | `@astrojs/sitemap` with route filtering | `astro.config.ts` |
| Robots | `noindex` on auth/dashboard pages | `Base.astro` prop |
| JSON-LD | **Missing** | — |
| Favicon | Present | `public/` |

### Current `Base.astro` Meta Setup

```astro
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={ogImage} />
<meta property="og:url" content={Astro.url.href} />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="canonical" href={Astro.url.href} />
```

## Issue 1: Missing JSON-LD Structured Data

### Problem

No structured data markup exists anywhere in the site. Search engines rely on JSON-LD to understand page content semantically. For a SaaS/tool landing page, this impacts rich snippet eligibility.

### Proposed: JSON-LD for Landing Page

```astro
---
// pages/index.astro
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Vspo Notifications Bot",
  "applicationCategory": "CommunicationApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY"
  },
  "description": "Discord bot for Vspo schedule notifications",
};
---

<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
```

### Proposed: JSON-LD Component

Create a reusable component for structured data:

```astro
---
// features/shared/components/JsonLd.astro
interface Props {
  data: Record<string, unknown>;
}

const { data } = Astro.props;
---

<script type="application/ld+json" set:html={JSON.stringify(data)} />
```

### Schema Types to Consider

| Page | Schema Type | Key Properties |
|------|-------------|----------------|
| Landing (`/`) | `SoftwareApplication` | name, category, offers, description |
| Landing (`/`) | `WebSite` | name, url, potentialAction (SearchAction) |
| Dashboard | None (noindex pages) | — |

## Issue 2: OGP Image Optimization

### Current State

The OGP image is set via a `Base.astro` prop with a default value. However:

1. **No per-page OGP images**: All pages share the same default OGP image
2. **No dynamic OGP generation**: Guild-specific or locale-specific OGP images are not generated
3. **Image dimensions not declared**: Missing `og:image:width` and `og:image:height` meta tags

### Proposed: Add Image Dimensions

```astro
<meta property="og:image" content={ogImage} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content={title} />
```

### Proposed: Locale-Specific OGP

If OGP images contain text, provide locale-specific variants:

```astro
---
const locale = Astro.currentLocale ?? "ja";
const ogImage = new URL(`/og/${locale}/default.png`, Astro.site).href;
---
```

## Issue 3: Sitemap Limitations in SSR Mode

### Current State

The sitemap is configured with `@astrojs/sitemap` and filters out private routes:

```typescript
sitemap({
  filter: (page) =>
    !page.includes("/auth/") &&
    !page.includes("/dashboard/") &&
    !page.includes("/api/"),
}),
```

### Issues

1. **Dynamic dashboard routes not in sitemap**: This is correct (they're private), but the landing page and announcement pages should be explicitly included
2. **No `lastmod` or `changefreq`**: Sitemap entries lack update frequency hints
3. **No sitemap index**: Single sitemap file, which is fine for the current site size but should be considered as pages grow

### Proposed: Enhanced Sitemap Config

```typescript
sitemap({
  filter: (page) =>
    !page.includes("/auth/") &&
    !page.includes("/dashboard/") &&
    !page.includes("/api/"),
  serialize: (item) => {
    // Set priority for known pages
    if (item.url.endsWith("/")) {
      item.priority = 1.0;
      item.changefreq = "weekly";
    }
    if (item.url.includes("/announcements")) {
      item.priority = 0.8;
      item.changefreq = "weekly";
    }
    return item;
  },
}),
```

## Issue 4: Canonical URL Edge Cases

### Current State

Canonical URL uses `Astro.url.href` directly. This works for most cases but has edge cases:

1. **Query parameters included**: If a page is accessed with `?flash=add` or other query params, the canonical URL includes them — search engines may index duplicates
2. **Trailing slash inconsistency**: Depending on Astro's `trailingSlash` config, canonical URLs may or may not have trailing slashes

### Proposed: Clean Canonical URLs

```astro
---
// Strip query params and hash from canonical URL
const canonicalUrl = new URL(Astro.url.pathname, Astro.site).href;
---

<link rel="canonical" href={canonicalUrl} />
```

## Issue 5: Missing `robots.txt`

### Current State

No `robots.txt` file exists. While individual pages use `noindex` meta tags for private routes, a `robots.txt` provides an additional layer of crawl control.

### Proposed: `public/robots.txt`

```text
User-agent: *
Allow: /
Disallow: /auth/
Disallow: /dashboard/
Disallow: /api/

Sitemap: https://discord.vspo-schedule.com/sitemap-index.xml
```

### Alternative: Dynamic `robots.txt` via API Route

```typescript
// pages/robots.txt.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const content = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /auth/",
    "Disallow: /dashboard/",
    "Disallow: /api/",
    "",
    `Sitemap: ${new URL("/sitemap-index.xml", import.meta.env.SITE).href}`,
  ].join("\n");

  return new Response(content, {
    headers: { "Content-Type": "text/plain" },
  });
};
```

## Issue 6: Announcement Pages SEO

### Current State

Announcement pages exist at `/dashboard/announcements` and `/dashboard/[guildId]/announcements`. These are under `/dashboard/` and therefore behind auth.

### Consideration

If announcements should be publicly visible (to attract organic traffic), they could be moved to a public route like `/announcements`. This is a product decision, not purely a technical one.

## Migration Checklist

- [ ] Create `JsonLd.astro` shared component
- [ ] Add `SoftwareApplication` JSON-LD to landing page
- [ ] Add `og:image:width`, `og:image:height`, `og:image:alt` to `Base.astro`
- [ ] Clean canonical URLs (strip query params)
- [ ] Add `robots.txt` (static or dynamic)
- [ ] Enhance sitemap with `priority` and `changefreq`
- [ ] Evaluate locale-specific OGP images
