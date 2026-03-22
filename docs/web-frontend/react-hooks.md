# React Hooks Guidelines

> References:
>
> - [You Might Not Need an Effect – React](https://react.dev/learn/you-might-not-need-an-effect)
> - [React Compiler – React](https://react.dev/learn/react-compiler)

## Core Principles

**Effects are an escape hatch for synchronizing with external systems.** If no external system is involved, an Effect is unnecessary.

## Rules (React Compiler ON)

1. **Write plain code first** -- derive values during rendering, handle events in handlers.
2. **Manual `useMemo` / `useCallback` only when needed** -- stabilizing Effect deps, third-party referential identity, or profiler-confirmed bottlenecks.
3. **Do not blindly remove old optimizations** -- verify behavior first.
4. **Keep Biome's React hooks lint rules enabled in CI** (configured in `biome.json`).

## When useEffect Is Unnecessary

### Derived values & expensive computations

```tsx
// ❌ Redundant state + Effect
const [fullName, setFullName] = useState("");
useEffect(() => setFullName(firstName + " " + lastName), [firstName, lastName]);

// ✅ Compute during render
const fullName = firstName + " " + lastName;

// ✅ If expensive, use useMemo only when profiling shows need
const visibleTodos = useMemo(() => getFilteredTodos(todos, filter), [todos, filter]);
```

### State resets & adjustments on prop change

```tsx
// ❌ Reset state in Effect
useEffect(() => setComment(""), [userId]);
// ✅ Use key to remount
<Profile userId={userId} key={userId} />

// ❌ Adjust state in Effect
useEffect(() => setSelection(null), [items]);
// ✅ Derive during render
const selection = items.find((item) => item.id === selectedId) ?? null;
```

### Event-driven logic (handlers, POST, chains, parent notification)

**Decision rule**: "Component displayed" -> Effect. "User did something" -> event handler.

```tsx
// ❌ Event logic in Effect
useEffect(() => { if (product.isInCart) showNotification(`Added ${product.name}`); }, [product]);
// ✅ In event handler
function handleBuyClick() { addToCart(product); showNotification(`Added ${product.name}`); }

// ❌ Notify parent via Effect
useEffect(() => onChange(isOn), [isOn, onChange]);
// ✅ Update both in handler (or lift state up)
function handleClick() { const next = !isOn; setIsOn(next); onChange(next); }
```

### External stores & data fetching

```tsx
// ❌ Manual subscription
useEffect(() => { /* addEventListener... */ }, []);
// ✅ useSyncExternalStore
const isOnline = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);

// ❌ Race condition
useEffect(() => { fetchResults(query).then(setResults); }, [query]);
// ✅ Cleanup flag (or use React Query / SWR)
useEffect(() => {
  let ignore = false;
  fetchResults(query).then((json) => { if (!ignore) setResults(json); });
  return () => { ignore = true; };
}, [query]);
```

### App initialization

```tsx
// ✅ Module-level guard
if (typeof window !== "undefined") { checkAuthToken(); }
```

## When useEffect Is Appropriate

| Case | Example |
|------|---------|
| External system sync | WebSocket, browser APIs |
| Timers | setInterval, setTimeout |
| Event listeners | resize, scroll, keyboard |
| DOM manipulation | Focus, measurement |
| Analytics | Page view logging |

## useMemo / useCallback / React.memo

**Default**: Let React Compiler handle it.

**Add manually when**:

- Value/function controls Effect dependency re-execution
- Child uses `React.memo` + heavy render and parent re-renders often
- External library requires referential identity

**Do not add** based on speculation or for lightweight derivations.

## Implementation Patterns

### State consolidation (discriminated unions)

```tsx
type SessionPhase =
  | { type: "idle" }
  | { type: "starting" }
  | { type: "active"; session: Session }
  | { type: "error"; message: string };

const [phase, setPhase] = useState<SessionPhase>({ type: "idle" });
```

### Async cleanup (prevent stale updates)

```tsx
useEffect(() => {
  let isMounted = true;
  fetchData().then((result) => { if (isMounted) setData(result); });
  return () => { isMounted = false; };
}, []);
```

### Race condition prevention (sequence tracking)

```tsx
const seqRef = useRef(0);
useEffect(() => {
  seqRef.current += 1;
  const seq = seqRef.current;
  connectToExternalSystem().then((result) => {
    if (seqRef.current === seq) handleResult(result);
  });
}, [dependency]);
```

## Data Fetching

**Prefer** React Query / SWR / TanStack Query for caching, deduplication, retries, and SSR support.

```tsx
import { useQuery } from "@tanstack/react-query";
function useTaskData(taskId: string) {
  return useQuery({ queryKey: ["task", taskId], queryFn: () => fetchTaskData(taskId) });
}
```

**Fallback**: Effect with cleanup flag (see "External stores & data fetching" above).

## React 19 Hooks

> **Status: Partially adopted.** The codebase uses the App Router with Server Components.
> `use()` is available for promise resolution in Client Components. Server Actions
> (`"use server"`) are not yet used (read-only application). These examples are
> kept as reference.

### use (Server Components)

```tsx
import { use } from "react";
function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);
  return comments.map((c) => <Comment key={c.id} comment={c} />);
}
```

### useOptimistic

```tsx
import { useOptimistic } from "react";
const [optimisticTodos, addOptimisticTodo] = useOptimistic(
  todos, (state, newTodo) => [...state, { ...newTodo, pending: true }],
);
```

### useActionState (Forms)

```tsx
import { useActionState } from "react";
const [state, formAction, isPending] = useActionState(
  async (prevState, formData) => {
    const result = await login(formData);
    if (result.err) return { error: result.err.message };
    return { success: true };
  }, null,
);
```

## useSyncExternalStore

```tsx
import { useSyncExternalStore } from "react";

function useOnlineStatus() {
  return useSyncExternalStore(
    (cb) => { window.addEventListener("online", cb); window.addEventListener("offline", cb);
      return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
    },
    () => navigator.onLine,
    () => true, // SSR fallback
  );
}
```

Advantages over useEffect: correct Concurrent Mode behavior, SSR support, prevents tearing.
