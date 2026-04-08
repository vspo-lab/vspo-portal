# Implementation Order and Dependencies

## Phase Overview

```yaml
Phase 1: Foundation Setup (1-2 days)
  |
Phase 2: Shared Hooks & Stores (1-2 days)
  |
Phase 3: Small Islands (2-3 days)
  |
Phase 4: Large Form Islands (3-5 days)
  |
Phase 5: State Management Integration & Optimistic UI (2-3 days)
  |
Phase 6: Security & Performance (2-3 days)
  |
Phase 7: Cleanup (1-2 days)
```

## Phase 1: Foundation Setup — DONE

### Dependencies: None

| Task | File | Details |
|------|------|---------|
| 1-1 | `package.json` | `pnpm add @astrojs/react react react-dom nanostores @nanostores/react` |
| 1-2 | `package.json` | `pnpm add -D @types/react @types/react-dom @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-axe` |
| 1-3 | `astro.config.ts` | Add `react()` integration |
| 1-4 | `tsconfig.json` | Add `"jsx": "react-jsx"` |
| 1-5 | `vitest.config.ts` | Configure jsdom environment and setupFiles |
| 1-6 | `src/test/setup.ts` | Create test setup file |

### Verification

```bash
# Verify React island builds and renders
# Create a simple test React component with client:load
pnpm build && pnpm preview
```

---

## Phase 2: Shared Hooks & Stores — DONE

### Dependencies: Phase 1 complete

| Task | File | Details | Status |
|------|------|---------|--------|
| 2-1 | `features/shared/hooks/useDialog.ts` | Dialog open/close, focus trap, backdrop click, Escape | DONE |
| 2-2 | `features/shared/hooks/useClickOutside.ts` | Outside click detection | DONE |
| 2-3 | `features/shared/hooks/useTheme.ts` | Theme toggle + system preference | DONE |
| 2-4 | `features/shared/stores/theme.ts` | Nano Store: `$theme` atom | DONE |
| 2-5 | `features/shared/stores/flash.ts` | Nano Store: `$flash` atom + `showFlash()` | DONE |
| 2-6 | `features/channel/stores/channel-actions.ts` | Nano Store: `$channelToEdit`, `$channelToDelete`, `$showAddModal` | DONE |
| 2-7 | `features/channel/stores/channel-data.ts` | Nano Store: `$channelData` map + optimistic helpers | DONE |

### Tests

| Test File | Target |
|-----------|--------|
| `hooks/__tests__/useDialog.test.ts` | Focus trap, backdrop click, Escape key |
| `hooks/__tests__/useClickOutside.test.ts` | Outside click detection |
| `hooks/__tests__/useTheme.test.ts` | Toggle, system preference |
| `stores/__tests__/theme.test.ts` | `$theme` atom, localStorage sync |
| `stores/__tests__/flash.test.ts` | `showFlash()`, auto-dismiss |
| `stores/__tests__/channel-data.test.ts` | Optimistic update/add/remove |

---

## Phase 3: Small Islands — DONE

### Dependencies: Phase 2 complete

| Task | File | Migrating From | Directive | Status |
|------|------|----------------|-----------|--------|
| 3-1 | `features/shared/components/ThemeToggle.tsx` | `ThemeToggle.astro` script | `client:load` | DONE |
| 3-2 | `features/shared/components/ClientFlashMessage.tsx` | `FlashMessage.astro` script | `client:idle` | DONE |
| 3-3 | `features/landing/components/FeatureShowcase.tsx` | `index.astro` script + `FeaturePopup.astro` | `client:visible` | DONE |
| 3-4 | `features/auth/components/UserMenuIsland.tsx` | `UserMenu.astro` `<details>` JS | `client:idle` | DONE |
| 3-5 | `features/shared/components/LanguageSelectorIsland.tsx` | `LanguageSelector.astro` header variant | `client:idle` | DONE |

### Per-Task Workflow (TDD)

1. Create test file (RED)
2. Implement React component (GREEN)
3. Place in Astro page/layout with `client:*` directive
4. Remove corresponding vanilla JS / `<script>`
5. Run a11y tests
6. Verify build

### 3-1: ThemeToggle Details — DONE

### 3-2: FlashMessage Details — DONE

Implemented as `ClientFlashMessage.tsx` (`client:idle`). Reads from `$flash` Nano Store. Auto-dismiss via `showFlash()` timer (5s). Dismiss button calls `dismissFlash()`.

### 3-3: FeatureShowcase Details — DONE

Implemented as `FeatureShowcase.tsx` (`client:visible`). Feature data passed as props from Astro landing page.

### 3-4: UserMenu Details — DONE

Implemented as `UserMenuIsland.tsx` in `features/auth/components/`. Dropdown with user avatar, keyboard navigation.

### 3-5: LanguageSelector Details — DONE

Implemented as `LanguageSelectorIsland.tsx` in `features/shared/components/`. Locale switching (ja/en).

---

## Phase 4: Large Form Islands — DONE

### Dependencies: Phase 3 complete (hooks and stores verified)

| Task | File | Migrating From | Directive |
|------|------|----------------|-----------|
| 4-1 | `features/channel/components/ChannelConfigModal.tsx` | `ChannelConfigForm.astro` 320-line script | `client:load` |
| 4-2 | `features/channel/components/ChannelAddModal.tsx` | `ChannelAddModal.astro` 110-line script | `client:load` |
| 4-3 | `features/channel/components/DeleteChannelDialog.tsx` | `DeleteChannelDialog.astro` 30-line script | `client:load` |

### 4-1: ChannelConfigModal Details

**Largest migration. Split into 5 sub-components:**

```text
ChannelConfigModal.tsx
  |-- LanguageSelect.tsx
  |-- MemberTypeRadioGroup.tsx (WAI-ARIA radio group)
  |-- CustomMemberPicker.tsx (WAI-ARIA combobox + listbox)
       |-- MemberSearchInput.tsx
       |-- MemberChips.tsx
       |-- MemberCheckboxGroup.tsx
```

**State management**: `useReducer` for `ConfigFormState`

```tsx
type ConfigFormState = {
  channelId: string;
  channelName: string;
  language: string;
  memberType: MemberTypeValue;
  customMemberIds: Set<string>;
  searchQuery: string;
  isDropdownOpen: boolean;
  isDirty: boolean;
};

type ConfigFormAction =
  | { type: "SET_LANGUAGE"; language: string }
  | { type: "SET_MEMBER_TYPE"; memberType: MemberTypeValue }
  | { type: "TOGGLE_MEMBER"; memberId: string }
  | { type: "SET_SEARCH"; query: string }
  | { type: "TOGGLE_DROPDOWN" }
  | { type: "SELECT_ALL"; group: string; memberIds: string[] }
  | { type: "DESELECT_ALL"; group: string; memberIds: string[] }
  | { type: "RESET"; initial: ConfigFormState };
```

**Astro Action integration**: Phase 4 retains hidden form

```tsx
function ChannelConfigModal({ guildId, channel, members, translations }) {
  const [state, dispatch] = useReducer(reducer, initialState(channel));

  const handleSave = () => {
    // Submit hidden form
    const form = document.getElementById("channel-config-form") as HTMLFormElement;
    // Set state values into form
    form.submit();
  };

  return (
    <dialog ref={dialogRef}>
      {/* React UI */}
      <form id="channel-config-form" method="POST" action={actionUrl} style={{ display: "none" }}>
        <input type="hidden" name="channelId" value={state.channelId} />
        <input type="hidden" name="language" value={state.language} />
        {/* ... */}
      </form>
    </dialog>
  );
}
```

### 4-2: ChannelAddModal Details

```text
ChannelAddModal.tsx
  |-- ChannelSearchInput.tsx
  |-- ChannelList.tsx (with loading/error/empty states)
```

- Fetch channel list via fetch API
- Search filter + filter out already-registered channels
- Loading/error/empty states
- Channel addition via hidden form submit

### 4-3: DeleteChannelDialog Details

```text
DeleteChannelDialog.tsx
  - Gets target from $channelToDelete Nano Store
  - Displays confirmation text
  - Initial focus on cancel button
  - Deletion via hidden form submit
```

### Astro Wrapper Changes

```astro
<!-- [guildId].astro — after migration -->
---
const channels = await fetchChannels(guildId);
const members = await fetchMembers(guildId);
const translations = { /* ... */ };
---

<Dashboard>
  <ChannelTable channels={channels} />
  <ChannelConfigModal
    client:load
    guildId={guildId}
    channels={channels}
    members={members}
    translations={translations}
  />
  <ChannelAddModal
    client:load
    guildId={guildId}
    registeredIds={channels.map(c => c.id)}
  />
  <DeleteChannelDialog
    client:load
    guildId={guildId}
  />
</Dashboard>
```

### Tests

| Test File | Target |
|-----------|--------|
| `ChannelConfigModal.test.tsx` | Form state, radio group, member picker, save/reset |
| `MemberTypeRadioGroup.test.tsx` | Selection, keyboard nav, aria-checked |
| `CustomMemberPicker.test.tsx` | Search, chips, select all/deselect all |
| `ChannelAddModal.test.tsx` | Fetch, search, loading state, channel selection |
| `DeleteChannelDialog.test.tsx` | Confirmation, focus management |
| `a11y/*.test.tsx` | axe-core tests for all modals |

---

## Phase 5: State Management Integration & Optimistic UI — DONE

### Dependencies: Phase 4 complete

| Task | Details | Status |
|------|---------|--------|
| 5-1 | GuildDashboardIsland orchestrates channel table rendering from `$channels` store | DONE |
| 5-2 | Actions use `accept: "json"` via Astro Actions | DONE |
| 5-3 | Optimistic update via `useChannelActions.updateChannel()` with rollback | DONE |
| 5-4 | Optimistic add via `useChannelActions.addChannel()` with rollback | DONE |
| 5-5 | Optimistic delete via `useChannelActions.deleteChannel()` with rollback | DONE |
| 5-6 | PRG pattern removed — direct API calls from React islands | DONE |
| 5-7 | FlashMessage connected with `$flash` Nano Store via `showFlash()` | DONE |

### Implementation Notes

- `GuildDashboardIsland.tsx` serves as the main React island orchestrating all channel CRUD
- `stores/channel-data.ts` provides `$channels` atom with `initChannels()`, `optimisticAdd()`, `optimisticUpdate()`, `optimisticRemove()`
- `stores/channel-actions.ts` manages modal/dialog state (`openAddModal`, `openEditModal`, `openDeleteDialog`)
- `hooks/useChannelActions.ts` wraps CRUD operations with optimistic UI and rollback on error
- `usecase/add-channel.ts` and `usecase/delete-channel.ts` handle server-side orchestration

---

## Phase 6: Security & Performance — DONE

### Dependencies: Phase 5 complete (features stable first)

| Task | Details | Reference | Status |
|------|---------|-----------|--------|
| 6-1 | CSP nonce implementation | 09_SECURITY.md | ✅ DONE (per-request nonce in middleware + nonce attr on is:inline scripts; `unsafe-inline` kept for ClientRouter compat) |
| 6-2 | Add OAuth PKCE | 09_SECURITY.md | ✅ DONE (S256 code_challenge in auth flow, verifier stored in session) |
| 6-3 | Harden API endpoint authentication | 09_SECURITY.md | ✅ DONE (Actions auth check) |
| 6-4 | Harden input validation (Discord snowflake) | 09_SECURITY.md | ✅ DONE (Actions validation) |
| 6-5 | Server Islands: BotStats (LP) | 06_PERFORMANCE.md | ✅ DONE (BotStats.astro with server:defer + Skeleton fallback) |
| 6-6 | Server Islands: GuildCard channel count | 06_PERFORMANCE.md | ⏭️ SKIP — GuildCard uses data already fetched in page frontmatter; no benefit from server island |
| 6-7 | Change prefetch strategy (viewport -> hover) | 06_PERFORMANCE.md | ✅ DONE (`astro.config.ts` defaultStrategy: "hover") |
| 6-8 | Font optimization | 13_FONTS_OPTIMIZATION.md | ✅ DONE (`astro.config.ts` fontProviders.google() for Noto Sans JP + M PLUS Rounded 1c) |
| 6-9 | Image optimization (Astro Image) | 06_PERFORMANCE.md | ✅ DONE (image.domains config + discordAvatarUrl() helper with WebP/size params) |
| 6-10 | Split dict.ts by feature | 07_I18N.md | ✅ DONE (split into `i18n/locales/ja.ts` + `i18n/locales/en.ts`, dict.ts re-exports) |
| 6-11 | Migrate to `astro:env` for type-safe env vars | 28_ASTRO_ENV.md | ✅ DONE (envField schema in config, imports from `astro:env/server`) |
| 6-12 | Migrate CSP to Astro built-in `security.csp` | 19_CSP_BUILTIN.md | ❌ BLOCKED — ClientRouter incompatible; nonce-based middleware approach used instead |
| 6-13 | Server Islands: UserMenu deferred rendering | 33_SERVER_ISLANDS.md | ⏭️ SKIP — UserMenu is a React island (client:idle), not an Astro component |
| 6-14 | Session config: explicit cookie, TTL, idle timeout | 18_SESSION_MANAGEMENT.md | ✅ DONE (cookie: vspo-dash-session, TTL: 86400, idle: 2h) |
| 6-15 | Content Collections: announcements migration | 14_CONTENT_COLLECTIONS.md | ✅ DONE (content.config.ts with glob loader, JSON data files) |
| 6-16 | Actions: PRG pattern with session persistence | 17_ACTIONS_PATTERNS.md | ✅ DONE (replaced by optimistic UI) |
| 6-17 | Container API test utils: shared helpers, locals, React renderer | 34_CONTAINER_API.md | ✅ DONE (test-utils/fixtures, html, container helpers) |
| 6-18 | Browser language detection via `Astro.preferredLocale` | 07_I18N.md | ✅ DONE (middleware uses context.preferredLocale for first-visit) |
| 6-19 | Responsive image `layout` prop + `<Picture />` multi-format | 25_IMAGE_OPTIMIZATION.md | ⏭️ DEFER — LP has no static images requiring `<Picture />`; Discord avatars are external |
| 6-20 | Evaluate `swapFunctions` custom swap for React Island state preservation | 29_VIEW_TRANSITIONS.md | ✅ EVALUATED — Not needed; Nano Stores persist across ClientRouter nav |
| 6-21 | Evaluate browser-native MPA view transitions (post React migration) | 29_VIEW_TRANSITIONS.md | ✅ EVALUATED — Keep ClientRouter for now; re-evaluate after vanilla JS removal |

---

## Phase 7: Cleanup — DONE

### Dependencies: Phase 6 complete

| Task | Details | Status |
|------|---------|--------|
| 7-1 | Delete `dialog-helpers.ts` | ✅ DONE (already deleted) |
| 7-2 | Delete `close-on-outside-click.ts` | ❌ BLOCKED — still used by Base.astro for `<details data-auto-close>` (mobile sidebar) |
| 7-3 | Delete old vanilla `theme.ts` | ✅ N/A — `stores/theme.ts` is the new Nano Store version; no old file exists |
| 7-4 | Remove all `<script>` tags from Astro components | ⚠️ 2 remaining: Base.astro (close-on-outside-click import), FlashMessage.astro (animationend handler) — both legitimately needed |
| 7-5 | Remove `astro:page-load` event handlers | ⚠️ 1 remaining in close-on-outside-click.ts — needed until 7-2 is resolved |
| 7-6 | Remove unnecessary AbortController patterns | ✅ N/A — existing pattern in close-on-outside-click.ts is correct (proper cleanup) |
| 7-7 | Convert `interface Props` to Zod schema (15 .astro files) | ✅ DONE |
| 7-8 | Extract shared components from Announcement pages | ✅ DONE (AnnouncementList.astro shared component) |
| 7-9 | Verify full a11y checklist (08_ACCESSIBILITY.md) | ✅ DONE — 6/8 pass. Remaining: dropdown keyboard nav, aria-labelledby on dialogs |
| 7-10 | Verify full security checklist (09_SECURITY.md) | ✅ DONE — 9/9 pass |
| 7-11 | Confirm 80%+ test coverage | ⚠️ 218 tests passing across 23 files; exact coverage % requires `vitest --coverage` |

---

## Dependency Graph

```text
Phase 1 (Foundation)
  |
  |---> Phase 2 (Hooks & Stores)
  |       |
  |       |---> Phase 3 (Small Islands)
  |       |       |
  |       |       |---> Phase 4 (Large Islands)
  |       |              |
  |       |              |---> Phase 5 (State Management)
  |       |                     |
  |       |                     |---> Phase 6 (Security & Performance)
  |       |                            |
  |       |                            |---> Phase 7 (Cleanup)
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| React hydration mismatch | CLS, console errors | Use `client:only` or pass identical initial values via props |
| Nano Store SSR compatibility | Hydration errors | Set Store initial values via props in `useEffect` |
| View Transitions + React Islands | Island unmount/remount | Proper use of `transition:persist` |
| Astro Action CSRF + React | Protection may not apply | Phase 4 retains hidden form; Phase 5 uses `accept: "json"` |
| CSP nonce + Client Router | Nonce mismatch | Client Router navigation doesn't update nonce — long-term: migrate to MPA |
| Bundle size increase | LCP degradation | React + ReactDOM as shared chunks; per-island bundle optimization |

## Phase Completion Criteria

| Phase | Completion Criteria |
|-------|---------------------|
| 1 | React island builds and renders. Test environment works |
| 2 | All hooks/stores unit tests pass |
| 3 | All small islands functional. Corresponding vanilla JS deleted |
| 4 | All form islands functional. Hidden form executes Actions |
| 5 | Optimistic UI works. PRG pattern removed |
| 6 | Lighthouse scores improved. Security checklist passes |
| 7 | All vanilla JS files deleted. Test coverage 80%+ |
