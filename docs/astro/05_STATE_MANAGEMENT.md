# State Management Design with Nano Stores

## Why Nano Stores

| Option | Pros | Cons |
|--------|------|------|
| **Nano Stores** | Officially recommended by Astro, framework-agnostic, 2KB, shared across islands | Small ecosystem |
| React Context | React standard | Cannot share across islands (each island is an independent React tree) |
| Zustand | Rich features | Non-official integration with Astro |
| Jotai | Atom-based, good compatibility | No adapter for Astro |

**The primary reason for choosing Nano Stores**: Astro Islands are independent React roots, and React Context cannot span across islands. Since Nano Stores is framework-agnostic, it can share state across multiple independent React islands.

## Dependencies

```bash
pnpm add nanostores @nanostores/react
```

## Store Design

### 1. Theme Store

```typescript
// features/shared/stores/theme.ts
import { atom, onMount } from "nanostores";

type Theme = "light" | "dark";

export const $theme = atom<Theme>("light");

onMount($theme, () => {
  // Get initial value from localStorage
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored) {
    $theme.set(stored);
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    $theme.set("dark");
  }

  // Watch for system preference changes
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem("theme")) {
      $theme.set(e.matches ? "dark" : "light");
    }
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
});

// Update localStorage + DOM when theme changes
$theme.listen((theme) => {
  localStorage.setItem("theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
});
```

**Used by**: ThemeToggle, UserMenu

### 2. Channel Actions Store

```typescript
// features/channel/stores/channel-actions.ts
import { atom } from "nanostores";
import type { ChannelConfig } from "../domain/channel-config";

type ChannelToEdit = {
  channelId: string;
  channelName: string;
  language: string;
  memberType: string;
  customMemberIds: string[];
} | null;

type ChannelToDelete = {
  channelId: string;
  channelName: string;
} | null;

// Channel being edited
export const $channelToEdit = atom<ChannelToEdit>(null);

// Channel being deleted
export const $channelToDelete = atom<ChannelToDelete>(null);

// Show add channel modal
export const $showAddModal = atom<boolean>(false);
```

**Used by**: ChannelTable (button clicks) → ChannelConfigModal, DeleteChannelDialog, ChannelAddModal

### 3. Channel Data Store

```typescript
// features/channel/stores/channel-data.ts
import { map } from "nanostores";
import type { ChannelConfig } from "../domain/channel-config";

type ChannelDataState = {
  channels: ChannelConfig[];
  isLoading: boolean;
  error: string | null;
};

export const $channelData = map<ChannelDataState>({
  channels: [],
  isLoading: false,
  error: null,
});

// Optimistic update helper
export function optimisticUpdate(
  channelId: string,
  update: Partial<ChannelConfig>,
) {
  const current = $channelData.get();
  $channelData.setKey(
    "channels",
    current.channels.map((ch) =>
      ch.id === channelId ? { ...ch, ...update } : ch,
    ),
  );
}

export function optimisticAdd(channel: ChannelConfig) {
  const current = $channelData.get();
  $channelData.setKey("channels", [...current.channels, channel]);
}

export function optimisticRemove(channelId: string) {
  const current = $channelData.get();
  $channelData.setKey(
    "channels",
    current.channels.filter((ch) => ch.id !== channelId),
  );
}
```

**Used by**: ChannelTable, ChannelConfigModal (after save), ChannelAddModal (after add), DeleteChannelDialog (after delete)

### 4. Flash Message Store

```typescript
// features/shared/stores/flash.ts
import { atom } from "nanostores";

type FlashMessage = {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
} | null;

export const $flash = atom<FlashMessage>(null);

export function showFlash(
  type: FlashMessage["type"],
  message: string,
  duration = 5000,
) {
  const id = crypto.randomUUID();
  $flash.set({ id, type, message });
  setTimeout(() => {
    // Only clear if the same message (i.e., a new message hasn't overwritten it)
    if ($flash.get()?.id === id) {
      $flash.set(null);
    }
  }, duration);
}
```

**Used by**: FlashMessage, result display for each Action

## Data Flow Diagram

```text
┌─────────────────────────────────────────────────────────┐
│                    Astro Page (.astro)                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Server: fetch channels, members                  │    │
│  │         pass as props to islands                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────┐   Nano Store   ┌─────────────────┐   │
│  │ ChannelTable │ ←──────────── │ $channelData    │   │
│  │ (React)      │ ──────────→   │ $channelToEdit  │   │
│  │ client:load  │  user clicks  │ $channelToDelete│   │
│  └──────────────┘               │ $showAddModal   │   │
│                                  └────────┬────────┘   │
│  ┌──────────────┐                        │             │
│  │ ConfigModal  │ ←──────────────────────┘             │
│  │ (React)      │ ─── save ──→ Action ──→ $channelData│
│  │ client:load  │                                      │
│  └──────────────┘                                      │
│                                                         │
│  ┌──────────────┐               ┌─────────────────┐   │
│  │ FlashMessage │ ←──────────── │ $flash          │   │
│  │ (React)      │               └─────────────────┘   │
│  │ client:idle  │                                      │
│  └──────────────┘                                      │
└─────────────────────────────────────────────────────────┘
```

## Initial Data Passing

Server-side data is fetched in the Astro page frontmatter and passed as props to React islands. Inside the island, initial values are set in the Nano Store:

```tsx
// ChannelTable.tsx
import { useEffect } from "react";
import { $channelData } from "../stores/channel-data";

export function ChannelTable({ initialChannels }: { initialChannels: ChannelConfig[] }) {
  // Initialize Nano Store on first mount
  useEffect(() => {
    $channelData.setKey("channels", initialChannels);
  }, [initialChannels]);

  const { channels } = useStore($channelData);
  // render...
}
```

## Migration from PRG to Optimistic UI

### Before (Current PRG Pattern)

```text
User clicks "Save" → POST /action → Server processes → Redirect → Full page reload → New data displayed
```

### After (Optimistic UI)

```text
User clicks "Save" → Optimistic update to $channelData → POST /action → 
  Success: keep optimistic state
  Failure: rollback $channelData + show $flash error
```

```tsx
async function handleSave(config: ChannelConfig) {
  const previous = $channelData.get().channels;

  // 1. Optimistic update
  optimisticUpdate(config.id, config);
  showFlash("success", "Channel updated");

  // 2. Send to server
  const result = await actions.updateChannel(config);

  if (result.error) {
    // 3. Rollback
    $channelData.setKey("channels", previous);
    showFlash("error", result.error.message);
  }
}
```

## Notes

### SSR and Hydration Consistency

- Nano Store initial values are empty during SSR, which can cause hydration mismatch
- Workaround: Use `client:only="react"`, or pass initial values via props and set them in the Store with `useEffect`

### `onMount` Pattern (Verified via Astro MCP)

Nano Stores' `onMount` only runs on the browser side. It is not called in SSR environments, making it safe to use for localStorage and browser API initialization:

```typescript
import { atom, onMount } from "nanostores";

export const $theme = atom<"light" | "dark">("light");

// onMount only runs when the first subscriber is attached to the store
// It does not run in SSR environments → avoids hydration mismatch
onMount($theme, () => {
  const stored = localStorage.getItem("theme");
  if (stored) $theme.set(stored as "light" | "dark");
  // Can return a cleanup function
  return () => { /* cleanup */ };
});
```

**`.get()` vs `useStore()`**:

- `.get()` — One-time read of the current value. Use in side effects and event handlers
- `useStore($store)` — Reactive subscription. Use for React component rendering

### Coexistence with View Transitions

- Nano Store instances are preserved even when navigating with `<ClientRouter />`
- Islands with `transition:persist` are not remounted, so Store values are also preserved
- If you need to reset a Store on page navigation, call `$store.set(initialValue)` in `astro:before-preparation`

### Testing

- Store unit tests: Verify state with `$store.set()` → `$store.get()`
- Component tests: `@testing-library/react` + Store mocks
