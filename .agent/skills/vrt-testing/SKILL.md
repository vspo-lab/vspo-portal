---
name: vrt-testing
description: Implement VRT with Storybook + Playwright, detecting UI regressions via snapshot diffs. Pin non-deterministic elements and operate with minimal mocks.
---

# Trigger Conditions

- When verifying visual regressions in UI
- When adding or updating VRT cases for Storybook stories

# Execution Checklist

1. Review `docs/testing/vrt-testing.md`
2. Add VRT cases per story
3. Pin time/animations/viewport
4. Update snapshots with an explanation of intent

# Reference Documents

- `docs/testing/vrt-testing.md`
- `docs/design/design-review.md`
