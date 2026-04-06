# Developer Tooling Improvements

## Current State

### Tooling Overview

| Tool | Version | Purpose | Config |
|------|---------|---------|--------|
| Astro | ^6.0.8 | Framework | `astro.config.ts` |
| Vitest | ^4.1.0 | Unit/integration testing | `vitest.config.ts` |
| Storybook | ^10.3.1 | Component visual testing | `.storybook/` |
| Wrangler | workspace catalog | Cloudflare Workers CLI | `wrangler.jsonc`, `wrangler.prd.jsonc` |
| TypeScript | workspace catalog | Type checking | `tsconfig.json` |
| Tailwind CSS | ^4.2.2 | Styling | `@tailwindcss/vite` plugin |
| happy-dom | ^20.8.4 | DOM environment for tests | `vitest.setup.ts` |

### Test File Inventory

18 test files covering:

| Feature | Test Files | Coverage Area |
|---------|-----------|---------------|
| Auth | `UserMenu.test.ts`, `discord-user.test.ts`, `login.test.ts` | Component, domain, usecase |
| Channel | `ChannelConfigForm.test.ts`, `ChannelTable.test.ts`, `channel-config.test.ts`, `member-type.test.ts`, `add-channel.test.ts` | Components, domain, usecase |
| Guild | `GuildCard.test.ts`, `guild.test.ts`, `list-guilds.test.ts` | Component, domain, usecase |
| Shared | `AvatarFallback.test.ts`, `Button.test.ts`, `Card.test.ts`, `creator.test.ts`, `parse.test.ts`, `ThemeToggle.test.tsx` | Components, domain, utility |
| i18n | `dict.test.ts` | Dictionary completeness |

### Storybook Story Inventory

15 story files covering all major Astro components:

| Feature | Story Files |
|---------|------------|
| Auth | `UserMenu.stories.ts` |
| Channel | `ChannelAddModal.stories.ts`, `ChannelConfigForm.stories.ts`, `ChannelTable.stories.ts`, `DeleteChannelDialog.stories.ts` |
| Guild | `GuildCard.stories.ts` |
| Shared | `AvatarFallback.stories.ts`, `Button.stories.ts`, `Card.stories.ts`, `ErrorAlert.stories.ts`, `FlashMessage.stories.ts`, `IconButton.stories.ts`, `LanguageSelector.stories.ts`, `MenuItem.stories.ts`, `ThemeToggle.stories.ts` |

### Wrangler Configuration

| File | Purpose | Custom Domain |
|------|---------|---------------|
| `wrangler.jsonc` | Dev/staging | `dev-discord.vspo-schedule.com` |
| `wrangler.prd.jsonc` | Production | (likely production domain) |
| `wrangler.storybook.jsonc` | Storybook hosting | `storybook-bot.vspo-schedule.com` |

## Issue 1: Test Coverage Gaps

### Current Coverage Configuration

```typescript
// vitest.config.ts
coverage: {
  provider: "v8",
  reporter: ["text", "json", "html"],
  include: ["src/features/**/*.ts", "src/components/**/*.astro"],
  exclude: [
    "src/**/*.test.{ts,tsx}",
    "src/**/index.ts",
    "src/features/auth/repository/**",
    "src/features/channel/repository/**",
    "src/features/guild/repository/**",
  ],
},
```

### Missing Test Coverage

| File | Type | Why Untested | Priority |
|------|------|-------------|----------|
| `src/middleware.ts` | Middleware | Depends on Cloudflare env, session API | HIGH |
| `src/actions/index.ts` | Actions | Depends on Cloudflare env, requires action test harness | HIGH |
| `src/features/auth/repository/discord-api.ts` | Repository | Excluded from coverage; calls external Discord API | MEDIUM |
| `src/features/channel/repository/vspo-channel-api.ts` | Repository | Excluded from coverage; uses Workers RPC | MEDIUM |
| `src/features/guild/repository/vspo-guild-api.ts` | Repository | Excluded from coverage; uses Workers RPC | MEDIUM |
| `src/features/shared/dev-mock.ts` | Dev utility | Mock data not validated against schemas | LOW |
| `src/i18n/dict.ts` (interpolation) | i18n | `t()` with interpolation untested | LOW |

### Proposed: Testable Action Handlers

Extract action handler logic into pure functions that can be tested without the Astro Action framework:

```typescript
// features/channel/usecase/add-channel.ts (already exists)
// The usecase IS the testable handler logic.

// actions/index.ts — thin wrapper
addChannel: defineAction({
  accept: "form",
  input: z.object({ guildId: z.string(), channelId: z.string() }),
  handler: async (input, context) => {
    requireAuth(context);
    const result = await AddChannelUsecase.execute({
      appWorker: env.APP_WORKER,
      guildId: input.guildId,
      channelId: input.channelId,
    });
    unwrapOrThrow(result);
    return { success: true as const };
  },
}),
```

The usecase layer is already tested (`add-channel.test.ts`). What's missing is testing the Action-specific logic: `requireAuth`, `unwrapOrThrow`, and input validation. These should be extracted and tested independently:

```typescript
// actions/helpers.test.ts
import { describe, expect, it } from "vitest";
import { toActionErrorCode } from "./helpers";

describe("toActionErrorCode", () => {
  it("maps BAD_REQUEST to BAD_REQUEST", () => {
    expect(toActionErrorCode("BAD_REQUEST")).toBe("BAD_REQUEST");
  });

  it("maps unknown codes to INTERNAL_SERVER_ERROR", () => {
    expect(toActionErrorCode("SOME_CUSTOM_ERROR")).toBe("INTERNAL_SERVER_ERROR");
  });
});
```

### Proposed: Middleware Unit Testing

The middleware depends on Cloudflare's `env` and Astro's `session` API. To test it:

```typescript
// middleware.test.ts
import { describe, expect, it, vi } from "vitest";

// Mock cloudflare:workers
vi.mock("cloudflare:workers", () => ({
  env: {
    DISCORD_CLIENT_ID: "test-client-id",
    DISCORD_CLIENT_SECRET: "test-secret",
  },
}));

// Test security headers application
describe("securityHeaders middleware", () => {
  it("sets CSP header on response", async () => {
    // Create mock context and next function
    const mockResponse = new Response("OK");
    const next = vi.fn().mockResolvedValue(mockResponse);
    const context = { /* mock context */ };

    // Import and invoke middleware
    // ...

    expect(mockResponse.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
  });
});
```

## Issue 2: Storybook Improvements

### Current State

Storybook uses `@storybook/html-vite` for Astro component stories. Stories are deployed to `storybook-bot.vspo-schedule.com` via Cloudflare Workers static assets.

### Issues

1. **No React component stories**: `ThemeToggle.stories.ts` exists but may need updating now that ThemeToggle is a React component (`.tsx`). New React Islands will need `@storybook/react-vite` stories.
2. **No interaction tests**: Stories are visual-only. Storybook's `play` functions could test interactive behaviors (dialogs, forms).
3. **Missing stories for page-level layouts**: No stories for `Dashboard.astro` layout or full page compositions.
4. **No dark mode toggle in Storybook**: If theme switching is a feature, Storybook should support dark/light mode preview.

### Proposed: Add React Storybook Support

When React Islands grow beyond ThemeToggle, add `@storybook/react-vite` for React-specific stories:

```typescript
// .storybook/main.ts
export default {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/html-vite",  // For Astro HTML components
    options: {},
  },
  // Consider @storybook/react-vite when React Islands are the majority
};
```

### Proposed: Interaction Tests

```typescript
// features/channel/components/DeleteChannelDialog.stories.ts
import { expect, userEvent, within } from "@storybook/test";

export const ConfirmDelete = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const deleteButton = canvas.getByRole("button", { name: /delete/i });
    await userEvent.click(deleteButton);
    // Verify dialog is open
    const dialog = canvas.getByRole("dialog");
    expect(dialog).toBeVisible();
  },
};
```

## Issue 3: Dev Mock System UX

### Current State

The dev mock system (`DEV_MOCK_AUTH` in `wrangler.jsonc`) controls whether the dashboard uses mock data. But the DX has friction:

1. **No indication in the UI** that mock mode is active — developers may not realize they're seeing fake data
2. **Switching between mock and real backend** requires editing `wrangler.jsonc` or setting env vars and restarting the dev server
3. **Mock data is limited**: Only one guild scenario (guild `111111111111111111`)

### Proposed: Dev Mode Indicator

```astro
<!-- layouts/Dashboard.astro (dev only) -->
{import.meta.env.DEV && (
  <div class="fixed bottom-2 right-2 z-50 rounded bg-amber-500 px-2 py-1 text-xs font-bold text-black">
    DEV MOCK
  </div>
)}
```

### Proposed: Multiple Mock Scenarios via Env

```jsonc
// wrangler.jsonc
{
  "vars": {
    "DEV_MOCK_AUTH": "true",
    "DEV_MOCK_SCENARIO": "default"
    // Options: "default" | "empty" | "many-channels" | "error"
  }
}
```

## Issue 4: TypeScript Configuration Improvements

### Current State

The project uses `astro check` and `tsc --noEmit` for type checking:

```json
"typecheck": "astro check && tsc --noEmit"
```

### Issues

1. **`vitest.config.ts` skips `astro.config.ts`**: The comment explains this is to avoid Cloudflare adapter conflicts, but it means Vitest doesn't see the full Astro configuration. This could cause test/build divergence.
2. **Coverage excludes all repositories**: `src/features/*/repository/**` are excluded entirely. While RPC-dependent code is hard to test, the mapping functions within repositories (e.g., `toFrontendMemberType`) could be tested if extracted to the domain layer (see `22_DATA_LAYER.md`).

### Proposed: Extract Testable Logic from Repositories

Move pure functions out of repository files into domain or utility files:

```text
Before:
  features/channel/repository/vspo-channel-api.ts
    ├── toFrontendMemberType()  ← Pure function, untestable (excluded from coverage)
    ├── toServerMemberType()    ← Pure function, untestable (excluded from coverage)
    └── ... RPC methods

After:
  features/channel/domain/member-type.ts
    ├── fromServerMemberType()  ← Pure function, testable
    ├── toServerMemberType()    ← Pure function, testable
  features/channel/repository/vspo-channel-api.ts
    └── ... RPC methods only
```

This allows the coverage exclusion to remain in place for repositories while ensuring business logic is always tested.

## Issue 5: Wrangler Configuration Consistency

### Current State

Three wrangler configs exist with different `compatibility_date` values:

| File | compatibility_date |
|------|-------------------|
| `wrangler.jsonc` | `2025-04-01` |
| `wrangler.prd.jsonc` | (not checked) |
| `wrangler.storybook.jsonc` | `2025-05-05` |

### Issues

1. **Inconsistent compatibility dates**: Dev and storybook have different dates, which could cause subtle behavior differences
2. **No shared base config**: Common settings (observability, compatibility flags) are duplicated

### Proposed: Align Compatibility Dates

All wrangler configs should use the same `compatibility_date` to ensure consistent Workers runtime behavior across environments. Update all configs to the latest date when bumping.

## Issue 6: Missing E2E Tests

### Current State

The project has unit tests and Storybook visual tests but no E2E tests for critical user flows:

- OAuth login flow
- Dashboard guild navigation
- Channel add/update/delete flow
- Locale switching
- Theme switching

### Proposed: Playwright E2E Test Structure

```text
e2e/
  auth.spec.ts          # Login → Dashboard redirect → Logout
  dashboard.spec.ts     # Guild list → Guild detail navigation
  channel-crud.spec.ts  # Add → Update → Reset → Delete channel
  locale.spec.ts        # Switch language, verify translations
  theme.spec.ts         # Toggle theme, verify persistence
```

### Key Considerations

1. **OAuth mocking**: The Discord OAuth flow cannot be tested against real Discord in CI. Use a mock OAuth server or bypass auth in E2E test mode
2. **RPC mocking**: E2E tests in CI don't have access to `APP_WORKER`. The dev mock system already handles this — ensure E2E tests run with `DEV_MOCK_AUTH=true`
3. **Cloudflare Workers runtime**: Playwright tests should run against `wrangler dev` or `astro dev` to match production behavior

### Example E2E Test

```typescript
// e2e/dashboard.spec.ts
import { expect, test } from "@playwright/test";

test("navigates from guild list to guild detail", async ({ page }) => {
  await page.goto("/dashboard");
  // In mock mode, expect the dev guild to be listed
  const guildCard = page.getByText("vspo-notifications");
  await expect(guildCard).toBeVisible();
  await guildCard.click();
  await expect(page).toHaveURL(/\/dashboard\/111111111111111111/);
});
```

## Issue 7: CI Pipeline Improvements

### Proposed CI Checks

| Check | Command | When |
|-------|---------|------|
| Type check | `pnpm typecheck` | Every PR |
| Unit tests | `pnpm test:run` | Every PR |
| Coverage | `pnpm test:coverage` | Every PR (enforce 80% threshold) |
| Storybook build | `pnpm storybook:build` | Every PR (catch broken stories) |
| E2E tests | `pnpm e2e` | Every PR (against dev server) |
| Lighthouse | Lighthouse CI | Weekly or on performance-tagged PRs |

### Coverage Threshold Enforcement

```typescript
// vitest.config.ts
coverage: {
  // ... existing config
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
},
```

## Migration Checklist

- [ ] Extract `toFrontendMemberType`/`toServerMemberType` from repository to domain layer
- [ ] Add tests for action helper functions (`requireAuth`, `unwrapOrThrow`)
- [ ] Add middleware unit tests (security headers, auth flow)
- [ ] Update `ThemeToggle.stories.ts` for React component
- [ ] Add Storybook interaction tests for dialogs
- [ ] Add dev mode indicator to Dashboard layout
- [ ] Align `compatibility_date` across wrangler configs
- [ ] Set up Playwright E2E test infrastructure
- [ ] Add coverage thresholds to `vitest.config.ts`
- [ ] Create E2E tests for critical flows (auth, dashboard, channel CRUD)
- [ ] Add Storybook build check to CI
