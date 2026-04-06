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

## Issue 7: Not Using Responsive Image `layout` Prop

### Overview

Astro 5.10+ introduced a `layout` property on `<Image />` and `<Picture />` components that automatically generates `srcset` and `sizes` attributes for responsive images. This eliminates the need to manually specify `widths` and `sizes` arrays.

### Layout Types

| Layout | Behavior | Use Case |
|--------|----------|----------|
| `constrained` | Scales down to fit container, won't scale beyond specified dimensions. Matches Tailwind default `max-width: 100%` | General-purpose images. Choose this if unsure |
| `full-width` | Scales to fit container width, maintaining aspect ratio | Hero images, banners |
| `fixed` | Maintains requested dimensions, generates `srcset` for high-density displays only | Icons, logos, small fixed-size images |
| `none` | No responsive behavior, no auto `srcset`/`sizes` | Override global default for specific images |

### Example: Constrained Layout

```astro
---
import { Image } from "astro:assets";
import heroImage from "~/assets/images/hero.png";
---

<Image
  src={heroImage}
  alt="Vspo Notifications Bot dashboard preview"
  layout="constrained"
  width={800}
  height={600}
/>
```

**Generated HTML:**

```html
<img
  src="/_astro/hero.hash3.webp"
  srcset="
    /_astro/hero.hash1.webp 640w,
    /_astro/hero.hash2.webp 750w,
    /_astro/hero.hash3.webp 800w,
    /_astro/hero.hash4.webp 828w,
    /_astro/hero.hash5.webp 1080w,
    /_astro/hero.hash6.webp 1280w,
    /_astro/hero.hash7.webp 1600w"
  sizes="(min-width: 800px) 800px, 100vw"
  loading="lazy"
  decoding="async"
  fetchpriority="auto"
  width="800"
  height="600"
  data-astro-image="constrained"
/>
```

### Global Configuration

Set a default layout for all images in `astro.config.ts`:

```typescript
// astro.config.ts
export default defineConfig({
  image: {
    layout: "constrained", // Default layout for all images
    responsiveStyles: true, // Apply global responsive styles
  },
});
```

### Responsive Styles

`image.responsiveStyles: true` injects a small global stylesheet:

```css
:where([data-astro-image]) {
  object-fit: var(--fit);
  object-position: var(--pos);
}
:where([data-astro-image='full-width']) {
  width: 100%;
}
:where([data-astro-image='constrained']) {
  max-width: 100%;
}
```

Uses `:where()` (specificity 0) — easy to override with any CSS selector.

### `fit` and `position` Props

Override `object-fit` and `object-position` per image:

```astro
<Image
  src={heroImage}
  alt="Hero"
  layout="full-width"
  fit="contain"
  position="top"
/>
```

### Tailwind 4 Compatibility

Tailwind 4 uses [cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), which are always lower specificity than non-layered rules. Astro's responsive styles (non-layered) will override Tailwind styling.

**If using Tailwind 4 for image styles**: Do NOT enable `image.responsiveStyles`. Handle responsive styling via Tailwind classes instead.

**If using Astro's responsive styles**: Enable `image.responsiveStyles: true` and Tailwind classes will not conflict (Tailwind layer is lower priority).

### Astro 6 Change: Style Emission

In Astro 5.x, responsive image styles were injected as inline `style` attributes (`style="--fit: cover; --pos: center;"`). This was incompatible with Content Security Policy (CSP).

Astro 6 generates styles via a virtual module at build time, emitting a hash class + `data-*` attributes instead:

```html
<!-- Astro 5.x -->
<img style="--fit: cover; --pos: center;" >

<!-- Astro 6 -->
<img class="__a_HaSh350" data-astro-fit="cover" data-astro-pos="center" >
```

If any custom code relied on the old inline `--fit`/`--pos` CSS custom properties, update to use the new `data-*` attributes.

## Issue 8: Not Using `<Picture />` for Multi-Format Delivery

### Current State

The landing page uses a manual `<picture>` element with hardcoded WebP + PNG sources. Astro's `<Picture />` component automates this with better optimization.

### Proposed: Use `<Picture />` Component

```astro
---
import { Picture } from "astro:assets";
import heroImage from "~/assets/images/hero.png";
---

<Picture
  src={heroImage}
  formats={["avif", "webp"]}
  alt="Vspo Notifications Bot dashboard preview"
  layout="constrained"
  width={800}
  height={600}
/>
```

**Generated HTML:**

```html
<picture>
  <source srcset="/_astro/hero.hash.avif" type="image/avif" />
  <source srcset="/_astro/hero.hash.webp" type="image/webp" />
  <img
    src="/_astro/hero.hash.png"
    width="800"
    height="600"
    decoding="async"
    loading="lazy"
    alt="Vspo Notifications Bot dashboard preview"
  />
</picture>
```

### `<Picture />` Props

| Prop | Type | Description |
|------|------|-------------|
| `formats` | `ImageOutputFormat[]` | Formats for `<source>` tags. List modern formats first (e.g., `['avif', 'webp']`) |
| `fallbackFormat` | `ImageOutputFormat` | Format for the fallback `<img>`. Defaults to `.png` (or `.jpg` for JPGs) |
| `pictureAttributes` | `HTMLAttributes<'picture'>` | Attributes for the outer `<picture>` element |

### Per-Image Override

With a global `constrained` layout, override specific images:

```astro
<!-- Uses global constrained layout -->
<Image src={featureImg} alt="Feature" />

<!-- Full-width hero -->
<Image src={heroImg} alt="Hero" layout="full-width" />

<!-- Fixed-size icon, no responsive sizing -->
<Image src={iconImg} alt="Icon" layout="fixed" width={24} height={24} />

<!-- Disable responsive for this specific image -->
<Image src={specialImg} alt="Special" layout="none" />
```

## Issue 9: Not Using `inferRemoteSize()` for Discord CDN Images

### Problem

Discord CDN images are rendered with hardcoded `width`/`height` or no dimensions at all. When the actual image dimensions don't match, this causes incorrect aspect ratios or CLS.

### Proposed: Use `inferRemoteSize()`

Astro 4.12+ provides `inferRemoteSize()` to automatically detect remote image dimensions by streaming the image header:

```typescript
import { inferRemoteSize } from "astro:assets";

const { width, height, format } = await inferRemoteSize(
  "https://cdn.discordapp.com/avatars/123/abc.png"
);
// { width: 128, height: 128, format: "png" }
```

### Use Case: Creator Thumbnails

For creator thumbnails in `ChannelTable` and `ChannelConfigForm`, where images come from Discord CDN with unknown dimensions:

```astro
---
import { inferRemoteSize } from "astro:assets";

// During SSR, infer the actual dimensions
const { width, height } = await inferRemoteSize(creator.thumbnailURL);
---
<img
  src={creator.thumbnailURL}
  alt={creator.name}
  width={width}
  height={height}
  loading="lazy"
  decoding="async"
  class="h-6 w-6 rounded-full"
/>
```

### Caveat

`inferRemoteSize()` makes a network request to fetch image headers. For pages with many creator thumbnails (50+ creators), this adds latency during SSR. Consider:
1. Caching the results if the same image appears on multiple pages
2. Using known fixed dimensions (e.g., Discord avatars are always square) instead of inferring
3. Only using this for images where you don't control the dimensions

## Migration Checklist

- [ ] Add `width`/`height` to all `<img>` tags in `ChannelConfigForm.astro` and `ChannelTable.astro`
- [ ] Add `loading="lazy"` and `decoding="async"` to all below-fold images
- [ ] Create `discordAvatarUrl()` helper for optimized Discord CDN URLs
- [ ] Configure `image.domains` in `astro.config.ts` for Discord CDN
- [ ] Migrate landing page images from `public/` to `src/assets/` with Astro `<Image>`
- [ ] Add image error fallback to `GuildCard.astro` guild icons
- [ ] Add `<link rel="preload">` for above-fold hero image
- [ ] Evaluate `ExternalImage.astro` shared component for consistent external image handling
- [ ] Add `image.layout: "constrained"` and `image.responsiveStyles: true` to `astro.config.ts`
- [ ] Replace manual `widths`/`sizes` arrays with `layout` prop on `<Image>` components
- [ ] Migrate landing page manual `<picture>` to Astro `<Picture />` with `formats: ['avif', 'webp']`
- [ ] Use `layout="full-width"` for hero images, `layout="fixed"` for icons/logos
- [ ] Verify Tailwind 4 compatibility: decide between `responsiveStyles` or Tailwind-managed responsive
- [ ] Verify Astro 6 style emission (data-* attributes) doesn't break existing CSS targeting
