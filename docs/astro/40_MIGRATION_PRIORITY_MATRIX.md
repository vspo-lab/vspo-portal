# Migration Priority Matrix

## Purpose

This document provides a cross-cutting priority matrix across all 39 topic-specific docs, enabling informed decisions about implementation order. Items are ranked by **impact** (user-facing benefit) and **effort** (development time + risk).

---

## Priority Tiers

### Tier 1: Critical (High Impact, Low-Medium Effort)

Must-do items that deliver immediate value with manageable risk.

| # | Item | Doc | Impact | Effort | Dependencies |
|---|------|-----|--------|--------|--------------|
| 1 | Fix `Astro.response.status = 404` in 404.astro | [35](./35_ROUTING_PATTERNS.md) | SEO | Low | None |
| 2 | Add CSRF protection (`checkOrigin`) | [09](./09_SECURITY.md), [19](./19_CSP_BUILTIN.md) | Security | Low | None |
| 3 | Validate `[guildId]` param (Discord Snowflake) | [35](./35_ROUTING_PATTERNS.md) | Security | Low | None |
| 4 | Add `httpOnly`, `secure`, `sameSite` to all cookies | [39](./39_COOKIES_AND_ENDPOINTS.md) | Security | Low | None |
| 5 | Create `500.astro` error page | [35](./35_ROUTING_PATTERNS.md), [21](./21_ERROR_HANDLING.md) | UX | Low | None |
| 6 | Add `aria-label` to interactive elements | [08](./08_ACCESSIBILITY.md) | a11y | Low | None |
| 7 | Set explicit `width`/`height` on images | [25](./25_IMAGE_OPTIMIZATION.md) | CLS/Perf | Low | None |
| 8 | Add HTML5 form validation attributes | [26](./26_FORM_UX.md) | UX | Low | None |

### Tier 2: High Priority (High Impact, Medium Effort)

Major improvements that require more work but significantly improve the codebase.

| # | Item | Doc | Impact | Effort | Dependencies |
|---|------|-----|--------|--------|--------------|
| 9 | Complete Phase 2: Shared Hooks & Stores | [11](./11_IMPLEMENTATION_PLAN.md) | Architecture | Medium | Phase 1 done |
| 10 | Migrate `ChannelConfigForm` to React island | [02](./02_REACT_MIGRATION.md), [04](./04_COMPONENT_IMPROVEMENTS.md) | UX/Code quality | High | Phase 2 |
| 11 | Implement Nano Stores for cross-island state | [05](./05_STATE_MANAGEMENT.md) | Architecture | Medium | Phase 2 |
| 12 | Migrate `change-locale` to Astro Action | [20](./20_API_ROUTES.md), [39](./39_COOKIES_AND_ENDPOINTS.md) | Consistency | Low | None |
| 13 | Add `isInputError()` display to forms | [17](./17_ACTIONS_PATTERNS.md), [26](./26_FORM_UX.md) | UX | Medium | None |
| 14 | Migrate to `astro:env` for type-safe env vars | [28](./28_ASTRO_ENV.md) | Type safety | Medium | None |
| 15 | Add loading states to form submissions | [26](./26_FORM_UX.md) | UX | Medium | None |
| 16 | Implement `useDialog` hook for focus trap | [02](./02_REACT_MIGRATION.md), [08](./08_ACCESSIBILITY.md) | a11y | Medium | Phase 2 |
| 17 | Session management improvements (TTL, regeneration) | [18](./18_SESSION_MANAGEMENT.md) | Security | Medium | None |

### Tier 3: Medium Priority (Medium Impact, Medium Effort)

Improvements that enhance quality but aren't blocking.

| # | Item | Doc | Impact | Effort | Dependencies |
|---|------|-----|--------|--------|--------------|
| 18 | ThemeToggle cleanup (delete deprecated files) | [00](./00_OVERVIEW.md) | Code quality | Low | None |
| 19 | Server Islands for Bot Stats | [33](./33_SERVER_ISLANDS.md) | Performance | Medium | None |
| 20 | Prefetch strategy optimization | [06](./06_PERFORMANCE.md), [29](./29_VIEW_TRANSITIONS.md) | Performance | Low | None |
| 21 | i18n type safety improvements | [07](./07_I18N.md), [31](./31_TYPE_SAFETY.md) | Type safety | Medium | None |
| 22 | Migrate small islands (Phase 3) | [11](./11_IMPLEMENTATION_PLAN.md) | Architecture | Medium | Phase 2 |
| 23 | Add custom elements pattern (interim) | [36](./36_SCRIPTS_AND_STYLES.md) | Code quality | Medium | None |
| 24 | Responsive table → card layout on mobile | [27](./27_RESPONSIVE_DESIGN.md) | UX | Medium | None |
| 25 | Container API test setup | [34](./34_CONTAINER_API.md) | Testing | Medium | None |
| 26 | Add JSON-LD structured data | [24](./24_SEO_META.md) | SEO | Low | None |
| 27 | Slot improvements (fallback, has() checks) | [37](./37_SLOTS_AND_COMPOSITION.md) | Code quality | Low | None |

### Tier 4: Nice-to-Have (Lower Impact or High Effort)

Improvements to plan for after core migration is complete.

| # | Item | Doc | Impact | Effort | Dependencies |
|---|------|-----|--------|--------|--------------|
| 28 | Built-in CSP (`security.csp`) | [19](./19_CSP_BUILTIN.md) | Security | High | Astro 6 |
| 29 | Astro 6 Fonts API | [13](./13_FONTS_OPTIMIZATION.md) | Performance | Medium | Astro 6 |
| 30 | Content Collections for announcements | [14](./14_CONTENT_COLLECTIONS.md) | Architecture | Medium | None |
| 31 | Custom Dev Toolbar app | [38](./38_DEV_TOOLBAR.md) | DX | Medium | None |
| 32 | E2E test suite | [23](./23_DEV_TOOLING.md) | Testing | High | None |
| 33 | Storybook for component library | [23](./23_DEV_TOOLING.md) | DX | High | None |
| 34 | Monitoring & structured logging | [32](./32_MONITORING.md) | Ops | High | None |
| 35 | Design system formalization | [30](./30_DESIGN_SYSTEM.md) | Consistency | High | None |
| 36 | Client prerendering (Speculation Rules) | [06](./06_PERFORMANCE.md), [16](./16_ADVANCED_FEATURES.md) | Performance | Low | Experimental |
| 37 | OAuth PKCE flow | [09](./09_SECURITY.md) | Security | Medium | None |
| 38 | Print styles | [27](./27_RESPONSIVE_DESIGN.md) | UX | Low | None |

---

## Dependency Graph

```text
Phase 1 (DONE)
  └── Phase 2: Hooks & Stores (#9)
       ├── Phase 3: Small Islands (#22)
       │    └── Phase 4: Large Form Islands (#10)
       │         └── Phase 5: State Mgmt + Optimistic UI (#11)
       └── useDialog hook (#16)

Independent tracks:
  ├── Security hardening (#2, #3, #4, #17, #37)
  ├── a11y improvements (#6, #8, #16)
  ├── Astro 6 preparation (#28, #29, #36)
  ├── API/Action migration (#12, #13)
  └── Testing improvements (#25, #32)
```

---

## Astro 6 Migration Readiness

Items that must be addressed before or during the Astro 6 upgrade:

| Item | Doc | Breaking Change |
|------|-----|-----------------|
| Update `@astrojs/cloudflare` to v13+ | [12](./12_CLOUDFLARE_INTEGRATION.md) | Adapter entrypoint, `Astro.locals.runtime` removed |
| `sessionDrivers` function form | [18](./18_SESSION_MANAGEMENT.md) | Session config syntax change |
| Remove stabilized experimental flags | [16](./16_ADVANCED_FEATURES.md) | Flags become errors |
| `security.csp` migration | [19](./19_CSP_BUILTIN.md) | `experimental.csp` → `security.csp` |
| `fonts` config migration | [13](./13_FONTS_OPTIMIZATION.md) | `experimental.fonts` → top-level `fonts` |
| Responsive image style handling | [25](./25_IMAGE_OPTIMIZATION.md) | Inline styles → data attributes |
| Endpoint trailing slash changes | [35](./35_ROUTING_PATTERNS.md) | File extension endpoints |
| Wrangler entrypoint config | [12](./12_CLOUDFLARE_INTEGRATION.md) | New entrypoint path |
| `prerenderEnvironment` option | [12](./12_CLOUDFLARE_INTEGRATION.md) | Prerender now runs in workerd |

---

## Effort Estimation Key

| Label | Description |
|-------|-------------|
| Low | < 1 hour, single file change, minimal testing |
| Medium | 1-4 hours, multiple files, requires testing |
| High | 4+ hours, cross-cutting changes, significant testing |

---

## Quick Wins (< 30 minutes each)

These can be done immediately between larger tasks:

1. Set `Astro.response.status = 404` in `404.astro`
2. Delete deprecated `ThemeToggle.astro` and `theme.ts`
3. Add `aria-label` to table action buttons in `ChannelTable.astro`
4. Add `width`/`height` to avatar images
5. Set `trailingSlash: "never"` in `astro.config.ts`
6. Add `checkOrigin: true` to security config
7. Add `Astro.slots.has()` checks in `Card.astro`
8. Use `Response.json()` in API endpoints

---

## Cross-References

This document synthesizes priorities from all 39 topic docs:
- Architecture: [01](./01_ISLANDS_ARCHITECTURE.md), [02](./02_REACT_MIGRATION.md), [05](./05_STATE_MANAGEMENT.md), [11](./11_IMPLEMENTATION_PLAN.md)
- Quality: [08](./08_ACCESSIBILITY.md), [09](./09_SECURITY.md), [10](./10_TESTING.md), [31](./31_TYPE_SAFETY.md)
- Performance: [06](./06_PERFORMANCE.md), [13](./13_FONTS_OPTIMIZATION.md), [25](./25_IMAGE_OPTIMIZATION.md), [33](./33_SERVER_ISLANDS.md)
- UX: [26](./26_FORM_UX.md), [27](./27_RESPONSIVE_DESIGN.md), [29](./29_VIEW_TRANSITIONS.md), [30](./30_DESIGN_SYSTEM.md)
- Infrastructure: [12](./12_CLOUDFLARE_INTEGRATION.md), [28](./28_ASTRO_ENV.md), [32](./32_MONITORING.md)
