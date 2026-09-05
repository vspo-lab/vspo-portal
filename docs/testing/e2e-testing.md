# E2E Testing Implementation Guidelines

> **Status:** Implemented for `service/bot-dashboard` (Playwright). `service/vspo-schedule/v2/web` is not yet covered.

## Purpose

- Guarantee major user flows through production-equivalent execution paths
- Detect inconsistencies spanning UI, API, authentication, and DB at the final stage

## Scope

- Login, primary creation flows, update/delete flows, permission controls
- Failure cases (insufficient permissions, validation failures, network errors)

## Implementation Rules

1. Use Playwright Locators and Web-first assertions
2. Keep tests mutually independent (no shared state)
3. Reuse authentication via `storageState` and avoid duplicating login operations
4. Prepare test data via API to minimize UI operation prerequisites

## Mocking Policy

- Default: no mocking (use real implementations for app-internal paths)
- Exception: fix only external dependencies (third-party APIs) using `page.route()`

## Test Case Granularity

Verify one observation point per test case.
When a test fails, you should be able to immediately identify "what broke."

### Good: One Test, One Observation Point

```typescript
test("A new item can be created", async ({ page }) => {
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("Test Item");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Created successfully")).toBeVisible();
});

test("An error is displayed when the name is empty", async ({ page }) => {
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Name is required")).toBeVisible();
});
```

### Bad: Multiple Observation Points in One Test

```typescript
// Bad: When it fails, it's unclear which observation point broke
test("Entire item creation flow", async ({ page }) => {
  // Check creation success
  await expect(page.getByText("Created successfully")).toBeVisible();
  // Also check validation error
  await expect(page.getByText("Name is required")).toBeVisible();
  // Also check it appears in the list
  await expect(page.getByText("Test Item")).toBeVisible();
});
```

## Operational Practices to Reduce Failures

- Do not use retries as a stopgap; resolve the root cause (insufficient waits, data races)
- Write test names as business scenarios (e.g., "A new order can be created")
- Maintain a lean set of key scenarios and complement coverage with Unit/Integration/API tests

## bot-dashboard

### Layout

- `service/bot-dashboard/playwright.config.ts` - config, including the `webServer` that boots `astro dev`
- `service/bot-dashboard/astro.config.e2e.ts` - the app config with the dev toolbar disabled
- `service/bot-dashboard/e2e/helpers.ts` - guild ids, island hydration wait, shared locators
- `service/bot-dashboard/e2e/*.spec.ts` - one file per screen or concern: `landing`, `auth`, `dashboard`, `guild-channels`, `announcements`, `api`

### Running

```bash
cd service/bot-dashboard
pnpm exec playwright install chromium   # once
pnpm test:e2e
pnpm test:e2e:ui                        # interactive
```

`pnpm test:e2e` starts the dev server on port 4341 by itself. A server that is already listening there is reused only with `PLAYWRIGHT_REUSE_SERVER=1`, because its in-memory channel store may have drifted from the seed. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` points the run at a preinstalled Chromium when the browser download is unavailable.

### Where the external boundary is

The dashboard has two external dependencies: Discord OAuth and the `APP_WORKER` service binding (the `vspo-portal-app` Worker, which lives in another repository). Both are replaced by the dev mock the app already ships (`src/features/shared/dev-mock.ts`, active when `astro dev` runs with `DEV_MOCK_AUTH=true`). Everything in this repository runs for real: Astro pages, middleware, session storage, Astro Actions, API routes, React islands.

Consequences to keep in mind:

- The mock user is always logged in, so the landing page is reached with `/?preview` and the OAuth flow is exercised at the HTTP level (`/auth/discord` redirect, `/auth/callback` state and code handling) rather than by following Discord's redirect.
- The mock middleware skips the guild-admin guard and token refresh, so those branches are not covered here. They are the middleware's job and belong in unit tests.
- Channel mutations are persisted in a process-wide in-memory store inside the dev mock, and only while `astro dev` runs with the mock enabled; without the mock, mutations still fail when `APP_WORKER` is unavailable. Tests therefore run with one worker, and every mutation test arranges the state it needs and restores the seed before it ends, so a single test can be run with `--grep`.
- `storageState` is deliberately not used: sessions are server-side, so sharing a cookie between tests would leak the locale one test set into the next. Each test gets a fresh context and therefore a fresh session.

### CI

`.github/workflows/pr-check.yaml` runs the suite in the `e2e-bot-dashboard` job whenever `service/bot-dashboard/**`, `packages/**` or the root manifests change. The HTML report is uploaded as an artifact on failure, and the result appears in the PR Check Summary comment.

## References (Primary Sources)

- Playwright Best Practices: <https://playwright.dev/docs/best-practices>
- Playwright Isolation: <https://playwright.dev/docs/browser-contexts>
- Playwright Authentication: <https://playwright.dev/docs/auth>
- Playwright API Testing: <https://playwright.dev/docs/api-testing>
