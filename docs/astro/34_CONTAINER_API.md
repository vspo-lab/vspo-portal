# Container API for Astro Component Testing

## What Is the Container API?

The Astro Container API (`experimental_AstroContainer`) allows rendering `.astro` components in isolation, outside of a full Astro build. This enables unit testing Astro components in Vitest without running a dev server.

```typescript
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import Card from "./Card.astro";

const container = await AstroContainer.create();
const html = await container.renderToString(Card, {
  props: { title: "Hello" },
  slots: { default: "Content" },
});
```

## Current State

### Already Using Container API

The project **already** uses the Container API in 7 test files:

| Test File | Component | Tests |
|-----------|-----------|-------|
| `Button.test.ts` | `Button.astro` | Variants, sizes, polymorphic rendering |
| `Card.test.ts` | `Card.astro` | Default classes, custom class |
| `AvatarFallback.test.ts` | `AvatarFallback.astro` | Image rendering, fallback text |
| `GuildCard.test.ts` | `GuildCard.astro` | Guild card rendering |
| `ChannelTable.test.ts` | `ChannelTable.astro` | Channel table rendering |
| `ChannelConfigForm.test.ts` | `ChannelConfigForm.astro` | Form rendering |
| `UserMenu.test.ts` | `UserMenu.astro` | User menu rendering |

### Current Test Pattern

All tests follow the same pattern:

```typescript
import { experimental_AstroContainer as AstroContainer } from "astro/container";

const parseHtml = (html: string) =>
  new DOMParser().parseFromString(html, "text/html").body;

it("renders correctly", async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Component, {
    props: { /* ... */ },
    slots: { default: "Content" },
  });
  const body = parseHtml(html);
  expect(body.querySelector("button")).toBeTruthy();
});
```

### Current Vitest Setup

The project uses a creative approach to avoid the Astro 6 `node`-only constraint:

```typescript
// vitest.config.ts
export default getViteConfig(
  {
    test: {
      globals: true,
      setupFiles: ["./vitest.setup.ts"],
      // No `environment: "jsdom"` — defaults to "node"
    },
  },
  {
    configFile: false, // Skip astro.config.ts to avoid Cloudflare adapter conflicts
    output: "server",
    integrations: [react()],
  },
);
```

```typescript
// vitest.setup.ts
// Manually registers DOM globals from happy-dom into the node environment
import { GlobalWindow } from "happy-dom";

const window = new GlobalWindow();
for (const key of ["DOMParser", "document", "window", /* ... */]) {
  if (!(key in globalThis)) {
    Object.defineProperty(globalThis, key, {
      value: (window as Record<string, unknown>)[key],
      writable: true,
      configurable: true,
    });
  }
}
```

This approach:

- Runs in `node` environment (required by Astro 6 Container API)
- Manually injects DOM APIs from `happy-dom` for HTML parsing and `@testing-library/dom` queries
- Skips `astro.config.ts` to avoid Cloudflare adapter's Vite plugin conflicting with Vitest

## Issue 1: Missing `locals` in Component Tests

### Problem

17 components access `Astro.locals` (for `user`, `guilds`, `locale`), but the current tests don't pass `locals` to the container. This means:

1. Components that read `Astro.locals.user` would get `undefined` in tests
2. Auth-dependent rendering paths are untestable
3. Locale-dependent content can't be verified

### Proposed: Pass `locals` in Tests

The Container API supports a `locals` option:

```typescript
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import UserMenu from "./UserMenu.astro";

const mockLocals = {
  user: {
    id: "123456789",
    username: "testuser",
    avatar: "abc123",
    globalName: "Test User",
  },
  locale: "ja",
  guilds: [],
};

it("renders user avatar when authenticated", async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(UserMenu, {
    locals: mockLocals,
  });
  expect(html).toContain("Test User");
});

it("renders nothing when not authenticated", async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(UserMenu, {
    locals: { locale: "ja" },
  });
  expect(html).not.toContain("Test User");
});
```

### Proposed: Shared Test Fixtures

Create reusable mock data for `locals`:

```typescript
// test-utils/fixtures.ts
import type { DiscordUser } from "../features/auth/domain/discord-user";

export const mockUser: DiscordUser = {
  id: "123456789012345678",
  username: "testuser",
  avatar: "abc123def456",
  globalName: "Test User",
};

export const mockLocals = (overrides?: Partial<App.Locals>): App.Locals => ({
  locale: "ja",
  user: mockUser,
  guilds: [],
  ...overrides,
});
```

## Issue 2: No React Component Rendering in Container Tests

### Problem

The project uses React Islands (`ThemeToggle.tsx`, future React components). To test `.astro` components that contain React Islands, the container needs a React renderer.

### Current State

Tests that render Astro components containing React Islands will only get the island's placeholder/wrapper `<astro-island>` tag, not the rendered React content. This is because no renderer is configured.

### Proposed: Add React Renderer

```typescript
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { getContainerRenderer as reactContainerRenderer } from "@astrojs/react";

const renderers = await loadRenderers([reactContainerRenderer()]);
const container = await AstroContainer.create({ renderers });
```

This enables testing Astro components that embed React Islands with actual React output.

### Helper Factory

```typescript
// test-utils/container.ts
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { getContainerRenderer as reactContainerRenderer } from "@astrojs/react";

let cachedRenderers: Awaited<ReturnType<typeof loadRenderers>> | null = null;

export const createContainer = async (
  options?: { withReact?: boolean },
) => {
  if (options?.withReact) {
    cachedRenderers ??= await loadRenderers([reactContainerRenderer()]);
    return AstroContainer.create({ renderers: cachedRenderers });
  }
  return AstroContainer.create();
};
```

Usage:

```typescript
import { createContainer } from "../../../test-utils/container";

it("renders header with ThemeToggle", async () => {
  const container = await createContainer({ withReact: true });
  const html = await container.renderToString(Header, {
    locals: mockLocals(),
  });
  // React component content is now rendered
});
```

## Issue 3: Duplicated `parseHtml` Helper

### Problem

Every test file defines the same `parseHtml` helper:

```typescript
const parseHtml = (html: string) =>
  new DOMParser().parseFromString(html, "text/html").body;
```

This is duplicated across 7+ test files.

### Proposed: Extract to Shared Test Utility

```typescript
// test-utils/html.ts
export const parseHtml = (html: string): HTMLElement =>
  new DOMParser().parseFromString(html, "text/html").body;
```

Usage:

```typescript
import { parseHtml } from "../../../test-utils/html";
```

## Issue 4: Testing Pages and Layouts

### Problem

The Container API can render pages as full documents (with `<!DOCTYPE html>`) using the `partial: false` option. However, pages like `[guildId].astro` depend on:

1. `Astro.params` (dynamic route parameters)
2. `Astro.locals` (auth context)
3. `Astro.getActionResult()` (form submission results)
4. `Astro.request` (for URL/cookie access)

Currently, only leaf components are tested, not full pages or layouts.

### Proposed: Page-Level Tests

```typescript
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import GuildPage from "./[guildId].astro";

it("renders guild dashboard page", async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(GuildPage, {
    partial: false,
    params: { guildId: "987654321098765432" },
    locals: mockLocals({
      guilds: [{ id: "987654321098765432", name: "Test Guild", icon: null }],
    }),
    request: new Request("https://example.com/dashboard/987654321098765432"),
  });
  expect(html).toContain("Test Guild");
});
```

### Limitations

- `Astro.getActionResult()` may not work in container context (not documented)
- Components that import from `cloudflare:workers` (RPC calls) will fail — mock at the module level
- Middleware does not run in container rendering — `locals` must be provided manually

## Issue 5: Testing Endpoints with Container API

### Problem

API routes (`api/change-locale.ts`, `api/guilds/[guildId]/channels.ts`) export handler functions. The Container API supports testing endpoints via `renderToResponse()` with `routeType: "endpoint"`.

### Proposed

```typescript
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import * as ChangeLocale from "../pages/api/change-locale.ts";

it("changes locale and returns redirect", async () => {
  const container = await AstroContainer.create();
  const response = await container.renderToResponse(ChangeLocale, {
    routeType: "endpoint",
    request: new Request("https://example.com/api/change-locale", {
      method: "POST",
      body: new URLSearchParams({ locale: "en" }),
    }),
  });
  expect(response.status).toBe(302);
});
```

### Note

This requires the endpoint to not depend on Cloudflare-specific globals that aren't available in the test environment. Mock `cloudflare:workers` imports as needed.

## Issue 6: Container Creation Overhead

### Problem

Each test creates a new `AstroContainer` instance. While lightweight, this adds up across 150+ tests.

### Proposed: Reuse Container Per Describe Block

```typescript
describe("Button", () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it("renders primary variant", async () => {
    const html = await container.renderToString(Button, {
      props: { variant: "primary" },
      slots: { default: "Click" },
    });
    // ...
  });
});
```

This reduces container creation from N (one per test) to 1 per describe block.

## Issue 7: Vitest Environment Constraint (Astro 6)

### Current State

Astro 6 requires the Container API to run in the `node` environment. The project works around this by:

1. Using the default `node` environment in Vitest (no `environment: "jsdom"`)
2. Manually injecting DOM globals from `happy-dom` in `vitest.setup.ts`

### Risk

This approach is fragile — if `happy-dom` changes its API or if Astro's Container API changes its expectations about the global environment, tests may break silently.

### Proposed: Document the Constraint

Add a comment to `vitest.setup.ts` explaining the architectural decision:

```typescript
// vitest.setup.ts
//
// ARCHITECTURE NOTE: Astro 6 Container API requires `node` environment.
// Setting `environment: "jsdom"` or `environment: "happy-dom"` in vitest.config.ts
// breaks Astro component compilation. Instead, we manually register DOM globals
// from happy-dom so that @testing-library/dom and DOMParser work without
// switching the environment.
//
// Reference: https://docs.astro.build/en/guides/testing/#vitest-and-container-api
```

### Future: Astro May Stabilize the API

The Container API is still `experimental_`. When it stabilizes, Astro may relax the environment constraint or provide better Vitest integration. Monitor Astro changelogs.

## Migration Checklist

- [ ] Extract `parseHtml` helper to shared `test-utils/html.ts`
- [ ] Create `test-utils/fixtures.ts` with mock `locals`, `user`, `guilds`
- [ ] Create `test-utils/container.ts` with `createContainer()` factory
- [ ] Add `locals` option to existing component tests that access `Astro.locals`
- [ ] Configure React renderer for testing Astro components with React Islands
- [ ] Add page-level tests for at least one page (`[guildId].astro` or `dashboard/index.astro`)
- [ ] Add endpoint tests using `renderToResponse()` with `routeType: "endpoint"`
- [ ] Reuse container instances per `describe` block to reduce overhead
- [ ] Add architecture documentation comment to `vitest.setup.ts`
- [ ] Monitor Astro Container API stabilization in future releases
