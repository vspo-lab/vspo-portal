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

## Phase 2: Shared Hooks & Stores — DONE (2-7 deferred to Phase 5)

### Dependencies: Phase 1 complete

| Task | File | Details |
|------|------|---------|
| 2-1 | `features/shared/hooks/useDialog.ts` | Dialog open/close, focus trap, backdrop click, Escape |
| 2-2 | `features/shared/hooks/useClickOutside.ts` | Outside click detection |
| 2-3 | `features/shared/hooks/useTheme.ts` | Theme toggle + system preference |
| 2-4 | `features/shared/stores/theme.ts` | Nano Store: `$theme` atom |
| 2-5 | `features/shared/stores/flash.ts` | Nano Store: `$flash` atom + `showFlash()` |
| 2-6 | `features/channel/stores/channel-actions.ts` | Nano Store: `$channelToEdit`, `$channelToDelete`, `$showAddModal` |
| 2-7 | `features/channel/stores/channel-data.ts` | Nano Store: `$channelData` map + optimistic helpers |

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

## Phase 3: Small Islands

### Dependencies: Phase 2 complete

| Task | File | Migrating From | Directive |
|------|------|----------------|-----------|
| 3-1 | `features/shared/components/ThemeToggle.tsx` | `ThemeToggle.astro` script | `client:load` |
| 3-2 | `features/shared/components/FlashMessage.tsx` | `FlashMessage.astro` script | `client:idle` |
| 3-3 | `features/landing/components/FeatureShowcase.tsx` | `index.astro` script + `FeaturePopup.astro` | `client:visible` |
| 3-4 | `features/shared/components/UserMenu.tsx` | `UserMenu.astro` `<details>` JS | `client:idle` |
| 3-5 | `features/shared/components/LanguageSelector.tsx` | `LanguageSelector.astro` header variant | `client:idle` |

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

```yaml
ThemeToggle.astro (server: icon display) → ThemeToggle.tsx (client:load)
  - Uses useTheme() hook
  - Syncs with $theme Nano Store
  - Adds aria-pressed
  - Supports system preference
  - Base.astro is:inline theme initialization script is preserved
```

### 3-3: FeatureShowcase Details

```text
index.astro <script> (30 lines) + FeaturePopup.astro
  |
FeatureShowcase.tsx (client:visible)
  |-- FeatureCard.tsx (display component)
  |-- FeatureDialog.tsx (dialog, uses useDialog hook)

- Feature data passed as props from Astro page
- Dialog focus management via useDialog hook
```

### Tests

| Test File | Target |
|-----------|--------|
| `ThemeToggle.test.tsx` | Toggle, aria-pressed, icon switch |
| `FlashMessage.test.tsx` | Auto-dismiss, dismiss button, role="status" |
| `FeatureShowcase.test.tsx` | Card click opens dialog, close |
| `UserMenu.test.tsx` | Dropdown open/close, keyboard nav |
| `LanguageSelector.test.tsx` | Locale switch, aria-selected |

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

## Phase 5: State Management Integration & Optimistic UI

### Dependencies: Phase 4 complete

| Task | Details |
|------|---------|
| 5-1 | Convert ChannelTable to React, rendering from `$channelData` |
| 5-2 | Change Actions to `accept: "json"` |
| 5-3 | Implement optimistic update (save -> optimisticUpdate -> API call -> rollback on error) |
| 5-4 | Implement optimistic add (add -> optimisticAdd -> API call -> rollback on error) |
| 5-5 | Implement optimistic delete (delete -> optimisticRemove -> API call -> rollback on error) |
| 5-6 | Remove PRG pattern (redirects no longer needed) |
| 5-7 | Connect FlashMessage with `$flash` Nano Store |

### Data Flow Change

```yaml
Before (PRG):
  User action -> Form POST -> Server -> Redirect -> Full page reload

After (Optimistic UI):
  User action -> Optimistic Store update -> API call ->
    Success: Keep optimistic state + show success flash
    Failure: Rollback store + show error flash
```

---

## Phase 6: Security & Performance

### Dependencies: Phase 5 complete (features stable first)

| Task | Details | Reference |
|------|---------|-----------|
| 6-1 | CSP nonce implementation | 09_SECURITY.md |
| 6-2 | Add OAuth PKCE | 09_SECURITY.md |
| 6-3 | Harden API endpoint authentication | 09_SECURITY.md |
| 6-4 | Harden input validation (Discord snowflake) | 09_SECURITY.md |
| 6-5 | Server Islands: BotStats (LP) | 06_PERFORMANCE.md |
| 6-6 | Server Islands: GuildCard channel count | 06_PERFORMANCE.md |
| 6-7 | Change prefetch strategy (viewport -> hover) | 06_PERFORMANCE.md |
| 6-8 | Font optimization | 13_FONTS_OPTIMIZATION.md |
| 6-9 | Image optimization (Astro Image) | 06_PERFORMANCE.md |
| 6-10 | Split dict.ts by feature | 07_I18N.md |
| 6-11 | Migrate to `astro:env` for type-safe env vars | 28_ASTRO_ENV.md |
| 6-12 | Migrate CSP to Astro built-in `security.csp` | 19_CSP_BUILTIN.md |
| 6-13 | Server Islands: UserMenu deferred rendering | 33_SERVER_ISLANDS.md |
| 6-14 | Session config: explicit cookie, TTL, idle timeout | 18_SESSION_MANAGEMENT.md |
| 6-15 | Content Collections: announcements migration | 14_CONTENT_COLLECTIONS.md |
| 6-16 | Actions: PRG pattern with session persistence | 17_ACTIONS_PATTERNS.md |
| 6-17 | Container API test utils: shared helpers, locals, React renderer | 34_CONTAINER_API.md |
| 6-18 | Browser language detection via `Astro.preferredLocale` | 07_I18N.md |
| 6-19 | Responsive image `layout` prop + `<Picture />` multi-format | 25_IMAGE_OPTIMIZATION.md |
| 6-20 | Evaluate `swapFunctions` custom swap for React Island state preservation | 29_VIEW_TRANSITIONS.md |
| 6-21 | Evaluate browser-native MPA view transitions (post React migration) | 29_VIEW_TRANSITIONS.md |

---

## Phase 7: Cleanup

### Dependencies: Phase 6 complete

| Task | Details |
|------|---------|
| 7-1 | Delete `dialog-helpers.ts` |
| 7-2 | Delete `close-on-outside-click.ts` |
| 7-3 | Delete `theme.ts` |
| 7-4 | Remove all `<script>` tags from Astro components |
| 7-5 | Remove `astro:page-load` event handlers |
| 7-6 | Remove unnecessary AbortController patterns |
| 7-7 | Convert `interface Props` to Zod schema (Base.astro, etc.) |
| 7-8 | Extract shared components from Announcement pages |
| 7-9 | Verify full a11y checklist (08_ACCESSIBILITY.md) |
| 7-10 | Verify full security checklist (09_SECURITY.md) |
| 7-11 | Confirm 80%+ test coverage |

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
