# VRT (Visual Regression Testing) Implementation Guidelines

## Purpose

- Detect visual regressions in UI through diff comparison
- Maintain the ability to determine whether design changes per component are intentional

## Scope

- `services/web/vrt/storybook.spec.ts`
- Storybook stories (design system, key UI elements)

## Implementation Rules

1. Treat one Storybook story as one VRT case
2. Compare diffs using Playwright's `toHaveScreenshot()`
3. Fix viewport, fonts, time, and animations to eliminate non-determinism
4. Update snapshots only in "spec change PRs"

## Mocking Policy

- Default: no mocking
- Exception: return fixed responses via MSW only when stories depend on external APIs
- Purpose: stabilize regression detection for layout, color, and typography

## Operational Rules

- When updating baselines, describe the "intent of the diff" in the PR
- If the change is significant, also confirm the impact on UI/E2E tests

## Execution Commands

- `pnpm --filter web vrt`
- Update: `pnpm --filter web vrt:update`

## References (Primary Sources)

- Playwright Visual Comparisons: https://playwright.dev/docs/test-snapshots
- Storybook Visual Testing: https://storybook.js.org/docs/writing-tests/visual-testing
