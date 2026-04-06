# Vanilla JS to React Component Migration

## Vanilla JS Files to Migrate

### 1. `features/shared/components/dialog-helpers.ts`

**Current state**: `initDialog()` sets up backdrop-click-to-close and cancel button for dialogs. Uses AbortController for View Transitions support.

**Problems**:

- Callers (ChannelConfigForm, ChannelAddModal, DeleteChannelDialog) must call `initDialog("dialog-id")` every time
- Re-initialization required on `astro:page-load`

**After React migration**: Replace with a custom hook

```tsx
// features/shared/hooks/useDialog.ts
function useDialog(ref: RefObject<HTMLDialogElement>) {
  // backdrop click → close
  // Escape key handling
  // open/close state management
}
```

### 2. `features/shared/components/close-on-outside-click.ts`

**Current state**: Implements click-outside-to-close for `<details data-auto-close>` elements. Uses a global event listener.

**Problems**:

- Global event listener monitors all `<details>` elements
- Risk of interference with `<details>` inside React islands

**After React migration**: `useClickOutside` hook or headless dropdown component

```tsx
// features/shared/hooks/useClickOutside.ts
function useClickOutside(ref: RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener("click", listener);
    return () => document.removeEventListener("click", listener);
  }, [ref, handler]);
}
```

### 3. `features/shared/components/theme.ts`

**Current state**: Exports `toggle()` and `syncTheme()`. Operates on `localStorage` + `classList`.

**Problems**:

- Called from both ThemeToggle and UserMenu, but state synchronization is DOM-based
- Flash prevention on SSR depends on an `is:inline` script

**After React migration**: Nano Store + React hook

```tsx
// features/shared/stores/theme.ts (Nano Store)
import { atom } from "nanostores";
export const $theme = atom<"light" | "dark">(/* initial from localStorage */);

// features/shared/hooks/useTheme.ts
function useTheme() {
  const theme = useStore($theme);
  const toggle = () => $theme.set(theme === "dark" ? "light" : "dark");
  return { theme, toggle };
}
```

## In-Page `<script>` Tag Migration

### 4. `pages/index.astro` — Feature Popup Script (30 lines)

**Current state**:

```js
document.querySelectorAll(".feature-card-trigger").forEach(btn => {
  btn.addEventListener("click", () => {
    const dialog = document.getElementById(btn.dataset.feature);
    if (dialog && !dialog.open) dialog.showModal();
  });
});
```

**Problems**:

- Requires `AbortController` + `astro:page-load` for re-initialization
- Relies on class-name-based selectors

**React migration plan**: `FeatureShowcase` React island

```tsx
// features/landing/components/FeatureShowcase.tsx
function FeatureShowcase({ features }: { features: Feature[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {features.map(f => (
          <button key={f.id} onClick={() => setOpenId(f.id)}>
            <FeatureCard feature={f} />
          </button>
        ))}
      </div>
      {openId && (
        <FeatureDialog
          feature={features.find(f => f.id === openId)!}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
```

### 5. `pages/dashboard/[guildId].astro` — Dialog Close Script (8 lines)

**Current state**: Closes all dialogs on `astro:before-preparation` and `astro:after-swap`.

**Problems**: A workaround for the "stale top-layer state" issue with View Transitions. Becomes unnecessary after React migration.

**After React migration**: Since dialog state is managed within React islands, dialogs naturally unmount on page navigation, making this unnecessary.

### 6. `ChannelConfigForm.astro` — Main Interaction Script (320 lines)

**This is the largest migration target.** It includes the following features:

- Edit button click → dialog open + form populate
- Radio button highlight toggle
- Custom members dropdown open/close
- Chip creation and deletion
- Search filtering
- Select All / Deselect All per group
- Selected count updates
- Reset button → reset form submit
- Save button disabled state

**React migration plan**: Split into 3 React components

```yaml
ChannelConfigModal.tsx (island, client:load)
  ├── LanguageSelect.tsx
  ├── MemberTypeRadioGroup.tsx
  └── CustomMemberPicker.tsx
       ├── MemberSearchInput.tsx
       ├── MemberChips.tsx
       └── MemberCheckboxGroup.tsx
```

**State management**:

```tsx
type ConfigFormState = {
  channelId: string;
  channelName: string;
  language: string;
  memberType: MemberTypeValue;
  customMemberIds: Set<string>;
  searchQuery: string;
  isDropdownOpen: boolean;
};
```

### 7. `ChannelAddModal.astro` — Channel Add Script (110 lines)

**Current state**: Fetches guild channel list via fetch API, applies search filter, uses template clone.

**React migration plan**:

```tsx
// features/channel/components/ChannelAddModal.tsx
function ChannelAddModal({ guildId, registeredIds }: Props) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/guilds/${guildId}/channels`);
    setChannels(await res.json());
    setLoading(false);
  };

  const filtered = channels.filter(ch =>
    !registeredIds.has(ch.id) && ch.name.toLowerCase().includes(search)
  );

  return (/* ... */);
}
```

### 8. `DeleteChannelDialog.astro` — Delete Confirmation Script (30 lines)

**Current state**: Opens dialog on click event and rewrites heading/hidden input.

**React migration plan**:

```tsx
function DeleteChannelDialog({ guildId }: Props) {
  const { channelToDelete } = useStore($channelActions); // Nano Store
  if (!channelToDelete) return null;
  return (
    <dialog open>
      <p>Delete #{channelToDelete.name}?</p>
      <form method="POST" action={/* deleteChannel action */}>
        {/* ... */}
      </form>
    </dialog>
  );
}
```

### 9. `ThemeToggle.astro` — Theme Toggle Script (12 lines)

**React migration plan**:

```tsx
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label="Toggle theme">
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

**Note**: The `is:inline` theme initialization script in `Base.astro` must be kept (to prevent FOUC).

### 10. `FlashMessage.astro` — Auto-dismiss Script (5 lines)

**React migration plan**:

```tsx
function FlashMessage({ message, type }: Props) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return <div role="status">...</div>;
}
```

## Migration Notes

### Integration with Astro Actions

How to call Astro Actions from a React island:

```tsx
import { actions } from "astro:actions";

// Inside a React component
const handleSubmit = async (data: FormData) => {
  const result = await actions.updateChannel(data);
  if (result.error) { /* handle error */ }
};
```

However, Actions with `accept: "form"` only have CSRF protection when submitted via `<form>`. Options:

1. **Keep hidden form** — Manage state in React, submit via hidden form
2. **Change Action to `accept: "json"`** — Can call directly from React, but loses progressive enhancement

**Recommendation**: Keep hidden form in Phase 3, migrate to `accept: "json"` in Phase 4.

### Actions Security Notes (Verified via Astro MCP)

- Astro Actions are exposed as public endpoints at `/_actions/{name}`
- You can use `getActionContext()` in middleware for authentication gating:

```typescript
// middleware.ts
import { getActionContext } from "astro:actions";

export const onRequest = defineMiddleware(async (context, next) => {
  const { action } = getActionContext(context);
  if (!action) return next();

  // For Actions that require authentication
  const user = await context.session?.get("user");
  if (!user) {
    if (action.calledFrom === "rpc") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    return context.redirect("/auth/discord");
  }
  return next();
});
```

### Compatibility with View Transitions

Notes on React islands when using `<ClientRouter />`:

- `transition:persist` can prevent island unmount/remount
- `transition:name` specifies the animation target
- `astro:page-load` is unnecessary inside React islands (React manages its own lifecycle)

### SSR and Hydration

- `client:load` — Hydrates immediately on page load. Use for form components
- `client:idle` — Hydrates when the browser is idle. Use for UserMenu, LanguageSelector
- `client:visible` — Hydrates when entering the viewport. Use for LP's FeaturePopup
- `client:only="react"` — Client-only rendering without SSR. Can be used for theme toggle, etc.

## File Placement Rules

```text
features/
  channel/
    components/
      ChannelConfigForm.astro    ← Astro wrapper (server data fetch)
      ChannelConfigModal.tsx     ← React island (client interactivity)
      ChannelAddModal.tsx        ← React island
      DeleteChannelDialog.tsx    ← React island
      ChannelTable.astro         ← Astro (server-only)
  shared/
    components/
      ThemeToggle.tsx            ← React island
      FlashMessage.tsx           ← React island
    hooks/
      useDialog.ts               ← shared hook
      useClickOutside.ts         ← shared hook
      useTheme.ts                ← shared hook
    stores/
      theme.ts                   ← Nano Store
```
