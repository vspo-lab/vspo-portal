# All Component Improvements

## Channel Feature (`features/channel/`)

### ChannelTable.astro (172 lines)

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Islands** | Edit/Delete buttons depend on vanilla JS via `data-action-*` attributes | Change to React island props callbacks |
| **a11y** | Table has no `aria-label` | `aria-label="Channel configurations"` |
| **a11y** | Action buttons have no `aria-label` | `aria-label="Edit {channelName}"` |
| **a11y** | Status indicator uses color only | Add icon + text label |
| **UX** | Custom member avatar overflow (+N) is not clickable | Show all members via tooltip or popover |
| **UX** | No sort functionality | Sort by channel name, language, type |
| **Responsive** | Table scrolls horizontally on mobile | Switch to card layout (`<dl>` based) |
| **Performance** | Renders all items when channel count is high | Virtual scrolling or pagination |

### ChannelConfigForm.astro (600 lines — largest component)

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Islands** | 320 lines of vanilla JS | Fully migrate to React `ChannelConfigModal` |
| **Code quality** | Astro component and script parts are interleaved | Separate into Astro wrapper (server data) + React island (client UI) |
| **State management** | State managed via DOM manipulation | Manage ConfigFormState with `useReducer` |
| **Validation** | No client-side validation | Zod schema + real-time validation |
| **a11y** | Radio group missing `role="radiogroup"` | WAI-ARIA radio group pattern |
| **a11y** | No keyboard navigation for custom member dropdown | `aria-expanded`, `aria-activedescendant`, arrow key navigation |
| **a11y** | Chip delete buttons have no label | `aria-label="Remove {memberName}"` |
| **a11y** | Focus trap not implemented within dialog | Focus trap via `useDialog` hook |
| **UX** | No debounce on search filter | 300ms debounce |
| **UX** | Incomplete disabled state for save button | Disabled control via change detection (dirty check) |
| **UX** | No reset confirmation | Confirmation dialog when there are changes |
| **Type safety** | Form data types are implicit | ConfigFormState type + Zod schema |

### ChannelAddModal.astro (215 lines)

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Islands** | 110 lines of vanilla JS + template clone | Migrate to React `ChannelAddModal` |
| **UX** | Insufficient loading state | Skeleton UI + loading spinner |
| **UX** | Error state display | Retry button on fetch failure |
| **UX** | Display of already-added channels | Gray out + "already registered" label |
| **a11y** | Search input has no `aria-label` | `aria-label="Search channels"` |
| **a11y** | Channel list is not `role="listbox"` | Apply listbox pattern |
| **Performance** | API fetch on every open | Cache + stale-while-revalidate |

### DeleteChannelDialog.astro (111 lines)

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Islands** | 30 lines of vanilla JS | Migrate to React `DeleteChannelDialog` |
| **UX** | Simple delete confirmation | Channel name input confirmation (destructive action protection) |
| **a11y** | Dialog `aria-labelledby` / `aria-describedby` | Set proper ID references |
| **a11y** | Focus does not auto-move to delete button | Initial focus on cancel button |
| **Error** | No feedback on delete failure | Inline error message |

---

## Auth Feature (`features/auth/`)

### UserMenu.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Islands** | `<details data-auto-close>` + global JS | React `UserMenu` island (`client:idle`) |
| **a11y** | `<details>` is not suitable for menu pattern | `role="menu"` + `aria-expanded` + keyboard navigation |
| **UX** | Avatar image fallback | Initial display using `AvatarFallback` component |
| **UX** | LanguageSelector and ThemeToggle nested in menu | Integrate as child components after React migration |
| **Security** | Logout uses `<form>` POST | Good. Keep as-is |

---

## Shared Feature (`features/shared/`)

### Header.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Structure** | Receives sidebar toggle via slot | Keep (good pattern) |
| **a11y** | Skip-to-content link is in Base.astro | Move into Header for consistency |
| **Responsive** | Mobile navigation is in Dashboard.astro | Consider integrating into Header |

### Footer.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **SEO** | No structured data | Verify `<footer role="contentinfo">` |
| **a11y** | Link `aria-label` | Verify `rel="noopener noreferrer"` on external links |
| **i18n** | Footer text translation | Add to dict.ts |

### Button.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Structure** | 6 variants + 4 sizes is good design | Keep |
| **a11y** | `disabled` attribute support | Also use `aria-disabled` |
| **UX** | No loading state | `isLoading` prop + spinner icon |
| **Type safety** | Types for `as="a"` | Improve polymorphic component typing |

### IconButton.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **a11y** | `aria-label` not enforced as required | Make `aria-label` required in props |
| **a11y** | Touch target for icon-only buttons | Ensure minimum 44x44px |

### Card.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Structure** | Generic card. No issues | Keep |
| **a11y** | Semantics when card is interactive | `role="link"` or `<a>` wrapper |

### FlashMessage.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Islands** | CSS animation + 5-line JS | React `FlashMessage` island (`client:idle`) |
| **a11y** | Verify `role="status"` + `aria-live="polite"` | `role="alert"` for error type |
| **UX** | No dismiss button | Manual dismiss + auto-dismiss |
| **UX** | Display of multiple flash messages | Toast stack pattern |

### ErrorAlert.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **a11y** | Verify `role="alert"` | `aria-live="assertive"` for errors |
| **UX** | No retry action | Add `onRetry` callback |

### ThemeToggle.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Islands** | 12-line JS + theme.ts import | React `ThemeToggle` island (`client:load`) |
| **a11y** | Toggle state `aria-pressed` | `aria-pressed={isDark}` |
| **UX** | System preference tracking | `prefers-color-scheme` media query support + "system" option |

### LanguageSelector.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Islands** | Header variant uses `<details>` + global JS | React island (`client:idle`) |
| **Structure** | 2 variants (header, dropdown) | Unify with variant prop or separate components |
| **UX** | Session-based locale switching | Migrate to Astro i18n URL-based routing |
| **a11y** | `<details>` is not suitable for listbox pattern | `role="listbox"` + `aria-selected` |

### MenuItem.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Structure** | Static menu item | Keep |
| **a11y** | `role="menuitem"` | Verify consistency with parent element's `role="menu"` |

### AvatarFallback.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Structure** | Image fallback | Keep |
| **a11y** | `alt` text | Alt text including the username |
| **UX** | Initial display | SVG-based initial avatar |

### dialog-helpers.ts (vanilla JS — to be deleted)

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Overall** | Unnecessary after React migration | Replace with `useDialog` hook, then delete |

### close-on-outside-click.ts (vanilla JS — to be deleted)

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Overall** | Unnecessary after React migration | Replace with `useClickOutside` hook, then delete |

### theme.ts (vanilla JS — to be deleted)

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Overall** | Unnecessary after React migration | Replace with Nano Store `$theme` + `useTheme` hook, then delete |

---

## Guild Feature (`features/guild/`)

### GuildCard.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Structure** | Fully server-rendered | Keep |
| **Server Islands** | Channel count fetch delays the entire page | Lazy display with `server:defer` |
| **UX** | CTA for guilds without Bot installed | Improve invite link display |
| **a11y** | Card link focus display | `focus-visible` ring |

---

## Landing Feature (`features/landing/`)

### FeaturePopup.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Islands** | Controlled by script in index.astro | Integrate into `FeatureShowcase` React island |
| **a11y** | No focus trap in dialog | `useDialog` hook |
| **a11y** | Close button `aria-label` | `aria-label="Close"` |
| **UX** | Image placeholder | Use actual screenshots or illustrations |

### ScrollReveal.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Performance** | CSS-only is good | Keep |
| **a11y** | `prefers-reduced-motion` support | Disable animation with `@media (prefers-reduced-motion: reduce)` |

### DigitRoll.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Performance** | CSS-only animation | Keep |
| **a11y** | Screen reader support | Read the full number via `aria-label`, mark individual digits with `aria-hidden` |
| **a11y** | `prefers-reduced-motion` support | Display immediately without animation |

---

## Layouts

### Base.astro

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Security** | Theme initialization uses `is:inline` | Keep for FOUC prevention. However, CSP `unsafe-inline` is required |
| **Performance** | Google Fonts preload | Font display strategy: verify `font-display: swap` |
| **a11y** | `<html lang>` linked to locale | Verify and fix |
| **SEO** | No alternate/hreflang | Add `<link rel="alternate" hreflang="en">` |
| **Type safety** | Uses `interface Props` | Migrate to Zod schema (project convention) |

### Dashboard.astro (140 lines)

| Category | Problem | Improvement |
|----------|---------|-------------|
| **Structure** | Sidebar + main content | Keep |
| **Islands** | Mobile hamburger menu uses `<details>` | Consider migrating to React island |
| **a11y** | Sidebar `nav` + `aria-label` | `aria-label="Dashboard navigation"` |
| **a11y** | `aria-current="page"` for active route | Add |
| **Responsive** | Sidebar show/hide | Consider CSS `@container` queries |
| **UX** | Sidebar collapsed state is not persisted | Save sidebar state to localStorage |
