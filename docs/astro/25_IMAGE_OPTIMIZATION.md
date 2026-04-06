# Image Optimization

## Current State

### Image Usage Inventory

| Location | Image Type | Current Implementation | Issues |
|----------|-----------|----------------------|--------|
| Landing page | Hero/feature images | Manual `<picture>` with WebP + PNG fallback | No Astro `<Image>`, no lazy loading attribute |
| `ChannelConfigForm.astro` | Creator thumbnails | `<img>` with manual URL | Missing `width`/`height`, no responsive sizing |
| `ChannelTable.astro` | Creator thumbnails | `<img>` with manual URL | Missing `width`/`height`, no responsive sizing |
| `AvatarFallback.astro` | User/creator avatars | `<img>` with fallback to initials | Has `width`/`height` props, good |
| `GuildCard.astro` | Guild icons | Discord CDN URLs | Direct external URL, no optimization |
| `UserMenu.astro` | User avatar | Discord CDN URL | Direct external URL, no optimization |
| OGP | Social share image | Static URL in `Base.astro` | No dynamic generation |

### Current Manual `<picture>` Pattern (Landing Page)

```html
<picture>
  <source srcset="/images/hero.webp" type="image/webp" />
  <img src="/images/hero.png" alt="..." />
</picture>
```

This works but misses Astro's built-in optimization: no automatic resizing, no responsive `srcset`, no build-time compression.

## Issue 1: Not Using Astro `<Image>` / `<Picture>` Components

### What Astro Provides

Astro's built-in `<Image>` component (from `astro:assets`):

- **Automatic format conversion**: Converts to WebP/AVIF at build time
- **Responsive `srcset`**: Generates multiple sizes automatically
- **CLS prevention**: Enforces `width`/`height` to prevent layout shift
- **Lazy loading**: Adds `loading="lazy"` and `decoding="async"` by default
- **Remote image support**: Can optimize external URLs with `image.domains` config

### Proposed: Migrate Landing Page Images

```astro
---
import { Image } from "astro:assets";
import heroImage from "~/assets/images/hero.png";
---

<Image
  src={heroImage}
  alt="Vspo Notifications Bot dashboard preview"
  widths={[400, 800, 1200]}
  sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
/>
```

### Proposed: Asset Directory Structure

```text
src/
  assets/
    images/
      hero.png          # Landing page hero
      features/         # Feature section images
        notification.png
        schedule.png
```

Move images from `public/` to `src/assets/` to enable build-time optimization. Only keep images in `public/` that must be served at exact, known URLs (e.g., `favicon.ico`, OGP images referenced by URL).

## Issue 2: Missing `width`/`height` on Creator Thumbnails

### Current State

In `ChannelConfigForm.astro` and `ChannelTable.astro`, creator thumbnails are rendered without explicit dimensions:

```html
<img src={creator.thumbnailURL} alt={creator.name} class="h-6 w-6 rounded-full" />
```

### Problem

1. **Layout shift (CLS)**: Without `width`/`height` attributes, the browser cannot reserve space for the image before it loads
2. **Accessibility**: The `alt` text is present (good), but screen readers benefit from knowing image dimensions

### Proposed Fix

```html
<img
  src={creator.thumbnailURL}
  alt={creator.name}
  width="24"
  height="24"
  loading="lazy"
  decoding="async"
  class="h-6 w-6 rounded-full"
/>
```

### Note on Tailwind `h-6 w-6` vs `width`/`height`

The Tailwind classes set the CSS display size (24px). The HTML `width`/`height` attributes set the intrinsic size for CLS prevention. Both should be present and consistent.

## Issue 3: Discord CDN Image Optimization

### Current State

Guild icons and user avatars are loaded directly from Discord CDN:

```
https://cdn.discordapp.com/avatars/{userId}/{hash}.png
https://cdn.discordapp.com/icons/{guildId}/{hash}.png
```

### Optimization Opportunities

1. **Size parameter**: Discord CDN supports `?size=` parameter (powers of 2: 16, 32, 64, 128, 256, 512, 1024). Currently not used — full-size images are loaded for 24px/32px display

2. **WebP format**: Discord CDN supports `.webp` extension. Replace `.png` with `.webp` for smaller file sizes

3. **Astro remote image config**: Configure `image.domains` in `astro.config.ts` to allow Astro's `<Image>` to optimize Discord CDN images:

```typescript
// astro.config.ts
export default defineConfig({
  image: {
    domains: ["cdn.discordapp.com"],
  },
});
```

### Proposed: Discord Avatar Helper

```typescript
// features/shared/lib/discord-image.ts

/** Build optimized Discord CDN avatar URL */
export const discordAvatarUrl = (
  base: string,
  size: 16 | 32 | 64 | 128 | 256 = 64,
): string => {
  const url = new URL(base);
  // Use WebP format
  url.pathname = url.pathname.replace(/\.png$/, ".webp");
  url.searchParams.set("size", String(size));
  return url.toString();
};
```

### Usage

```astro
<img
  src={discordAvatarUrl(guild.iconURL, 64)}
  alt={guild.name}
  width="32"
  height="32"
  loading="lazy"
  decoding="async"
/>
```

## Issue 4: No Image Error Handling for External Images

### Current State

If a Discord CDN image fails to load (expired hash, deleted server, network error), the `<img>` tag shows a broken image icon.

### Current Partial Solution

`AvatarFallback.astro` handles this for user avatars with an `onerror` fallback to initials. But other image locations (`GuildCard`, `ChannelTable`) have no fallback.

### Proposed: Generalize the Fallback Pattern

```astro
---
// features/shared/components/ExternalImage.astro
interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  fallbackText?: string;
  class?: string;
}

const { src, alt, width, height, fallbackText, class: className } = Astro.props;
---

<img
  src={src}
  alt={alt}
  width={width}
  height={height}
  loading="lazy"
  decoding="async"
  class={className}
  onerror={fallbackText
    ? `this.style.display='none';this.nextElementSibling.style.display='flex'`
    : undefined}
/>
{fallbackText && (
  <span
    style="display:none"
    class:list={[className, "items-center justify-center bg-surface-container text-on-surface-variant text-xs font-medium"]}
    aria-hidden="true"
  >
    {fallbackText.charAt(0).toUpperCase()}
  </span>
)}
```

## Issue 5: No Responsive Images for Feature Sections

### Current State

Landing page feature images are served at a single resolution. On mobile devices, users download unnecessarily large images.

### Proposed: Responsive Image Sizes

For the landing page feature section (if images exist):

```astro
<Image
  src={featureImage}
  alt="Feature description"
  widths={[320, 640, 960]}
  sizes="(max-width: 640px) 320px, (max-width: 1024px) 640px, 960px"
  loading="lazy"
/>
```

### Viewport-Based Loading Strategy

| Image Location | Loading Strategy | Rationale |
|----------------|-----------------|-----------|
| Above the fold (hero) | `loading="eager"` | Visible immediately |
| Below the fold (features) | `loading="lazy"` | Deferred until scrolled |
| Dashboard avatars | `loading="lazy"` | Many small images |
| Thumbnails in tables | `loading="lazy"` | Potentially many rows |

## Issue 6: No Image Preloading for Critical Images

### Current State

No `<link rel="preload">` for above-the-fold images. The browser discovers images only when it parses the HTML and encounters the `<img>` tag.

### Proposed: Preload Hero Image

```astro
<!-- In Base.astro <head> -->
{heroImage && (
  <link
    rel="preload"
    as="image"
    href={heroImage}
    type="image/webp"
  />
)}
```

This should only be used for the single most important above-the-fold image to avoid over-preloading.

## Migration Checklist

- [ ] Add `width`/`height` to all `<img>` tags in `ChannelConfigForm.astro` and `ChannelTable.astro`
- [ ] Add `loading="lazy"` and `decoding="async"` to all below-fold images
- [ ] Create `discordAvatarUrl()` helper for optimized Discord CDN URLs
- [ ] Configure `image.domains` in `astro.config.ts` for Discord CDN
- [ ] Migrate landing page images from `public/` to `src/assets/` with Astro `<Image>`
- [ ] Add image error fallback to `GuildCard.astro` guild icons
- [ ] Add `<link rel="preload">` for above-fold hero image
- [ ] Evaluate `ExternalImage.astro` shared component for consistent external image handling
