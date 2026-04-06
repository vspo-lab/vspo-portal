# Form UX Improvements

## Current State

### Form Inventory

| Form | Location | Action | Input Method | Validation |
|------|----------|--------|-------------|------------|
| Add Channel | `ChannelAddModal.astro` | `actions.addChannel` | `<select>` dropdown | Zod `z.string()` only |
| Update Channel | `ChannelConfigForm.astro` | `actions.updateChannel` | Checkboxes + hidden inputs | Zod `z.string()` only |
| Reset Channel | `ChannelConfigForm.astro` | `actions.resetChannel` | Button (no visible input) | Zod `z.string()` only |
| Delete Channel | `DeleteChannelDialog.astro` | `actions.deleteChannel` | Confirmation dialog | Zod `z.string()` only |
| Channel Search | `ChannelTable.astro` | Client-side filter | Text input with debounce | None (client-side only) |
| Locale Switch | `LanguageSelector.astro` | `/api/change-locale` | `<select>` | None |
| Login | Auth flow | Discord OAuth redirect | Button | N/A |

### Current ARIA Support

| Feature | Status | Notes |
|---------|--------|-------|
| `aria-modal` on dialogs | Yes | `ChannelAddModal`, `DeleteChannelDialog` |
| `aria-expanded` on toggles | Yes | `UserMenu`, sidebar |
| `aria-live` on flash messages | Yes | `role="status"` with `aria-live="polite"` |
| `role="alert"` on errors | Yes | `ErrorAlert.astro` |
| `aria-label` on icon buttons | Yes | `IconButton.astro` |
| `aria-describedby` on form inputs | **No** | Missing error-to-input association |
| `aria-invalid` on invalid inputs | **No** | Missing validation state |

## Issue 1: Missing HTML5 Form Validation Attributes

### Current State

All form inputs use only basic Zod schemas on the server side (`z.string()`). No HTML5 validation attributes are present on the client side:

```html
<!-- Current: no validation attributes -->
<input type="hidden" name="guildId" value={guildId} />
<input type="hidden" name="channelId" value={selectedChannelId} />
```

For user-visible inputs (channel search, locale select), there are no `required`, `pattern`, or `minlength` attributes.

### Problem

1. **No client-side feedback**: Users must submit the form and wait for a server round-trip to discover validation errors
2. **Progressive enhancement gap**: HTML5 validation works without JavaScript and provides immediate feedback
3. **Accessibility**: Screen readers announce validation constraints from HTML5 attributes

### Proposed: Add HTML5 Validation

For the channel add modal's select:

```html
<select name="channelId" required aria-required="true">
  <option value="" disabled selected>Select a channel</option>
  {channels.map((ch) => (
    <option value={ch.id}>{ch.name}</option>
  ))}
</select>
```

For future text inputs (if any are added):

```html
<input
  type="text"
  name="channelName"
  required
  minlength="1"
  maxlength="100"
  pattern="[a-zA-Z0-9\-_]+"
  aria-required="true"
  aria-describedby="channelName-help"
/>
<span id="channelName-help" class="text-xs text-on-surface-variant">
  Letters, numbers, hyphens, and underscores only
</span>
```

## Issue 2: No Loading State During Action Submission

### Current State

When a form is submitted (add/update/delete channel), there is no visual feedback that the action is in progress. The user sees:

1. Click submit button
2. (Silence — no spinner, no disabled state)
3. Page redirects with flash message (success) or shows error

### Problem

1. **Double submission risk**: Users may click the submit button multiple times
2. **Perceived latency**: No feedback makes the app feel slow
3. **Accessibility**: Screen readers have no indication of pending state

### Proposed: Submit Button Loading State (Progressive Enhancement)

#### Option A: Vanilla JS (Minimal, for Astro forms)

```astro
<form method="POST" data-loading-form>
  <button type="submit" data-loading-text="Adding...">
    Add Channel
  </button>
</form>

<script>
  document.querySelectorAll("[data-loading-form]").forEach((form) => {
    form.addEventListener("submit", () => {
      const btn = form.querySelector<HTMLButtonElement>("[data-loading-text]");
      if (btn) {
        btn.disabled = true;
        btn.textContent = btn.dataset.loadingText ?? "Processing...";
        btn.setAttribute("aria-busy", "true");
      }
    });
  });
</script>
```

#### Option B: React Island (For React-migrated forms)

```tsx
// features/shared/components/SubmitButton.tsx
import { useState, type FormEvent } from "react";

interface Props {
  children: React.ReactNode;
  loadingText?: string;
  variant?: "primary" | "destructive";
}

export const SubmitButton = ({
  children,
  loadingText = "Processing...",
  variant = "primary",
}: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = () => {
    setIsSubmitting(true);
  };

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
      onClick={handleClick}
      className={`btn btn-${variant}`}
    >
      {isSubmitting ? (
        <>
          <span className="animate-spin" aria-hidden="true">⟳</span>
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};
```

### Recommendation

Use Option A for now (forms are Astro-rendered). Migrate to Option B when the form components are converted to React Islands.

## Issue 3: Missing `isInputError()` Display on Forms

### Current State

When Zod validation fails in an Astro Action, the error is an `InputError` with per-field details. However, the current page only shows the generic `error.message`:

```typescript
const actionError = addResult?.error ?? updateResult?.error ?? ...;
// FlashMessage shows generic: "An error occurred"
```

### Proposed: Per-Field Error Display

```astro
---
import { isInputError } from "astro:actions";

const actionError = addResult?.error ?? updateResult?.error ?? deleteResult?.error ?? resetResult?.error;
const fieldErrors = actionError && isInputError(actionError) ? actionError.fields : null;
---

{fieldErrors && (
  <div role="alert" class="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-on-surface">
    <p class="font-medium">Please fix the following errors:</p>
    <ul class="mt-2 list-inside list-disc space-y-1">
      {Object.entries(fieldErrors).map(([field, errors]) => (
        <li>
          <span class="font-medium">{field}</span>: {(errors as string[]).join(", ")}
        </li>
      ))}
    </ul>
  </div>
)}
```

### When This Becomes Critical

This improvement becomes essential when Zod schemas are strengthened with Discord Snowflake validation (see `17_ACTIONS_PATTERNS.md`):

```typescript
input: z.object({
  guildId: z.string().regex(/^\d{17,20}$/, "Invalid guild ID format"),
  channelId: z.string().regex(/^\d{17,20}$/, "Invalid channel ID format"),
}),
```

## Issue 4: Delete Confirmation Dialog UX

### Current State

`DeleteChannelDialog.astro` uses a native-like dialog with:

- `aria-modal="true"` (good)
- Keyboard trap with `close-on-outside-click.ts` (good)
- Form submission for the actual delete action

### Issues

1. **No "type to confirm" pattern**: For destructive actions, requiring the user to type the channel name prevents accidental deletion
2. **No undo capability**: Once deleted, the channel configuration is gone
3. **Generic confirmation text**: The dialog should mention the specific channel name being deleted

### Proposed: Enhanced Delete Dialog

```astro
---
interface Props {
  channelName: string;
  guildId: string;
  channelId: string;
}

const { channelName, guildId, channelId } = Astro.props;
---

<dialog aria-modal="true" aria-labelledby="delete-title">
  <h2 id="delete-title">Delete Channel Configuration</h2>
  <p>
    This will permanently delete the notification settings for
    <strong>{channelName}</strong>. This action cannot be undone.
  </p>
  <form method="POST" action={`/?_astroAction=deleteChannel`}>
    <input type="hidden" name="guildId" value={guildId} />
    <input type="hidden" name="channelId" value={channelId} />
    <button type="submit" class="btn-destructive">
      Delete {channelName}
    </button>
    <button type="button" onclick="this.closest('dialog').close()">
      Cancel
    </button>
  </form>
</dialog>
```

## Issue 5: Channel Search Debounce and Accessibility

### Current State

`ChannelTable.astro` includes a client-side search filter with debounce using `AbortController`. This is one of the vanilla JS components slated for React migration.

### Issues

1. **No `aria-live` region for search results count**: Screen readers don't know how many results match
2. **No "no results" state**: When the search matches nothing, no message is shown
3. **No clear button**: Users must manually select and delete the search text

### Proposed: Search Results Announcement

```html
<!-- Add to ChannelTable area -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="search-results-count">
  <!-- Updated by JS: "5 channels found" or "No channels match your search" -->
</div>
```

### Proposed: React Search Component (Post-Migration)

```tsx
// features/channel/components/ChannelSearch.tsx
import { useState, useDeferredValue } from "react";

interface Props {
  onSearch: (query: string) => void;
  resultCount: number;
}

export const ChannelSearch = ({ onSearch, resultCount }: Props) => {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  // Effect to call onSearch with deferred value
  // ...

  return (
    <div>
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search channels..."
          aria-label="Search channels"
          aria-describedby="search-count"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            ✕
          </button>
        )}
      </div>
      <div id="search-count" aria-live="polite" className="sr-only">
        {resultCount === 0
          ? "No channels match your search"
          : `${resultCount} channel${resultCount === 1 ? "" : "s"} found`}
      </div>
    </div>
  );
};
```

## Issue 6: Form Reset After Successful Action

### Current State

After a successful action (add/update channel), the page redirects via PRG. The form state is naturally reset by the redirect. However, if the PRG pattern is replaced with a non-redirect approach (e.g., `Astro.rewrite()`), form state management becomes important.

### Consideration for React Migration

When forms are migrated to React Islands, form state will be managed by React. Ensure:

1. **Controlled inputs**: All form inputs are controlled components
2. **Reset on success**: Form state is reset after successful submission
3. **Preserve on error**: Form state is preserved when an error occurs (so users don't lose their input)
4. **Optimistic updates**: Consider optimistic UI updates for better perceived performance

## Migration Checklist

- [ ] Add `required` attribute to channel select in `ChannelAddModal.astro`
- [ ] Add loading/disabled state to all form submit buttons
- [ ] Implement `isInputError()` display for per-field validation errors
- [ ] Add `aria-describedby` linking errors to their form inputs
- [ ] Add `aria-live` region for channel search result count
- [ ] Add "no results" state to channel search
- [ ] Include specific channel name in delete confirmation dialog
- [ ] Add clear button to channel search input
- [ ] Plan form state management for React Island migration
