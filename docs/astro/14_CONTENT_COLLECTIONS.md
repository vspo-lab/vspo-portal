# Content Collections

## Current State

### Announcement Data

Defined as a static array in `features/announcement/data/announcements.ts`:

```typescript
const announcements: readonly AnnouncementType[] = [
  {
    id: "2026-04-01-dashboard",
    title: { ja: "Webダッシュボードをリリースしました", en: "Web Dashboard Released" },
    body: { ja: "...", en: "..." },
    date: "2026-04-01T00:00:00Z",
    type: "update",
  },
];
```

- Typed with Zod schema
- Data embedded directly in TS file
- Imported directly by page (`announcements.astro`)

### Issues

1. **Data mixed with logic**: Content data embedded in TS code
2. **Extensibility**: Code changes required to add new announcements
3. **Type safety**: Manual Zod validation (Content Collections would automate this)
4. **i18n**: Translations inlined within objects

## Improvement: Build-time Content Collections

### File Structure

```text
src/
  content.config.ts              <- Collection definition
  data/
    announcements/
      2026-04-01-dashboard.json  <- Individual announcement data
      2026-03-15-launch.json
```

### Collection Definition

```typescript
// src/content.config.ts
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob, file } from "astro/loaders";

const announcements = defineCollection({
  // glob() loads individual files from a directory
  loader: glob({ pattern: "**/*.json", base: "./src/data/announcements" }),
  schema: z.object({
    title: z.object({ ja: z.string(), en: z.string() }),
    body: z.object({ ja: z.string(), en: z.string() }),
    date: z.coerce.date(),
    type: z.enum(["info", "update", "maintenance"]),
  }),
});

export const collections = { announcements };
```

### Built-in Loaders

| Loader | Use Case | Input |
|--------|----------|-------|
| `glob({ pattern, base })` | Multiple files in a directory | Markdown, MDX, JSON, YAML, TOML |
| `file("path/to/file.json")` | Single file with all entries | JSON, YAML, TOML |

- `glob()` auto-generates `id` from filename (e.g., `2026-04-01-dashboard.json` → `"2026-04-01-dashboard"`)
- Custom IDs: add `slug` field in JSON data, or pass `generateId()` option to `glob()`

### Data Files

```json
// src/data/announcements/2026-04-01-dashboard.json
{
  "id": "2026-04-01-dashboard",
  "title": {
    "ja": "Webダッシュボードをリリースしました",
    "en": "Web Dashboard Released"
  },
  "body": {
    "ja": "ブラウザからBot設定を管理できるようになりました。",
    "en": "You can now manage Bot settings from your browser."
  },
  "date": "2026-04-01T00:00:00Z",
  "type": "update"
}
```

### Page Usage

```astro
---
// pages/dashboard/announcements.astro
import { getCollection } from "astro:content";

const allAnnouncements = await getCollection("announcements");
// Sort by date (newest first)
const sorted = allAnnouncements.sort(
  (a, b) => b.data.date.getTime() - a.data.date.getTime()
);
---
```

### Benefits

| Item | Before (TS Array) | After (Content Collections) |
|------|-------------------|----------------------------|
| Type safety | Manual Zod | Automatic TypeScript type generation |
| Data format | TS file | JSON/YAML/TOML |
| Validation | Runtime | Build-time + editor completions |
| Query API | Manual filter/sort | `getCollection()` + filters |
| Editor support | None | `contentIntellisense` for completions |
| Non-engineer edits | TS knowledge required | JSON editing only |

## Build-time vs Live Collections

### Build-time Collections (Recommended)

Ideal for **relatively static content** like announcements:

- Data optimized and cached at build time
- Retrieved via `getCollection()` / `getEntry()`
- Defined in `src/content.config.ts`
- Supports JSON, YAML, Markdown, MDX

### Live Collections (Future Option)

For **real-time data** from APIs or databases:

- Data fetched at request time
- Retrieved via `getLiveCollection()` / `getLiveEntry()`
- Defined in `src/live.config.ts`
- Requires custom loader implementation

```typescript
// src/live.config.ts (future: dynamically fetch announcements from Bot API)
import { defineLiveCollection } from "astro:content";

const announcements = defineLiveCollection({
  loader: botApiAnnouncementLoader({
    apiBase: process.env.BOT_API_BASE_URL,
  }),
});

export const collections = { announcements };
```

**Current recommendation**: Announcements are static data, so build-time collections are sufficient. Consider live collections if announcement management is added to the Bot API.

## Applying to Creator Data

If static creator data exists in `features/shared/domain/creator.ts`, consider migrating to Content Collections as well:

```typescript
// src/content.config.ts
const creators = defineCollection({
  loader: file("src/data/creators.json"),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    memberType: z.string(),
    avatarUrl: z.string().url().optional(),
  }),
});

export const collections = { announcements, creators };
```

## Cross-Collection References

Use `reference()` to link entries across collections. Useful if announcements reference specific creators:

```typescript
// src/content.config.ts
import { defineCollection, reference } from "astro:content";
import { z } from "astro/zod";
import { glob, file } from "astro/loaders";

const creators = defineCollection({
  loader: file("src/data/creators.json"),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    memberType: z.string(),
  }),
});

const announcements = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/data/announcements" }),
  schema: z.object({
    title: z.object({ ja: z.string(), en: z.string() }),
    body: z.object({ ja: z.string(), en: z.string() }),
    date: z.coerce.date(),
    type: z.enum(["info", "update", "maintenance"]),
    // Reference a creator by their id
    author: reference("creators").optional(),
  }),
});

export const collections = { announcements, creators };
```

Querying referenced data:

```astro
---
import { getEntry } from "astro:content";

const announcement = await getEntry("announcements", "2026-04-01-dashboard");
// announcement.data.author is { collection: "creators", id: "..." }

if (announcement.data.author) {
  const author = await getEntry(announcement.data.author);
  // author.data.name, author.data.memberType, etc.
}
---
```

## Intellisense Experimental Feature

Enable editor completions for Content Collections:

```typescript
// astro.config.ts
export default defineConfig({
  experimental: {
    contentIntellisense: true,
  },
});
```

Also enable `astro.content-intellisense: true` in VS Code settings.

## Migration Checklist

- [ ] Create `src/content.config.ts`
- [ ] Extract announcement data into JSON files in `src/data/announcements/`
- [ ] Migrate `announcements.astro` page to `getCollection()` API
- [ ] Delete `features/announcement/data/announcements.ts`
- [ ] Verify build completes successfully
- [ ] Verify TypeScript types are auto-generated
- [ ] (Optional) Enable `contentIntellisense`
