# React Hooks Guidelines

> References:
> - [You Might Not Need an Effect – React](https://react.dev/learn/you-might-not-need-an-effect)
> - [React Compiler – React](https://react.dev/learn/react-compiler)
> - [Incremental Adoption – React Compiler](https://react.dev/learn/react-compiler/incremental-adoption)
> - [eslint-plugin-react-hooks – React](https://react.dev/reference/eslint-plugin-react-hooks)

## Core Principles

**Effects are an escape hatch for synchronizing with external systems.** If no external system is involved, an Effect is unnecessary.

## Rules Assuming React Compiler is ON

This project operates with React Compiler enabled, so Hooks usage follows these guidelines:

1. **Write plain code first**
   - Derive values directly during rendering.
   - Complete event logic within event handlers.
2. **Use `useMemo` / `useCallback` only when needed**
   - When stabilizing Effect dependency arrays
   - When a third-party API requires referential identity
   - When profiling confirms manual memoization is beneficial
3. **Do not mechanically remove old optimizations**
   - When removing existing `useMemo` / `useCallback`, verify behavior and performance first.
4. **Keep lint enabled at all times**
   - Enable `eslint-plugin-react-hooks` `recommended` or `recommended-latest` and detect Rules of React violations in CI.

## Cases Where useEffect Is Unnecessary

### 1. Values Derived from Props or State

```tsx
// ❌ Bad: Redundant state variable
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(firstName + " " + lastName);
}, [firstName, lastName]);

// ✅ Good: Compute during rendering
const fullName = firstName + " " + lastName;
```

### 2. Caching Expensive Computations

```tsx
// ❌ Bad: Updating state in Effect
const [visibleTodos, setVisibleTodos] = useState([]);
useEffect(() => {
  setVisibleTodos(getFilteredTodos(todos, filter));
}, [todos, filter]);

// ✅ Good (Compiler ON): Use plain computation first
const visibleTodos = getFilteredTodos(todos, filter);

// ✅ Good (only when needed): Add manual memoization
const visibleTodos = useMemo(() => getFilteredTodos(todos, filter), [todos, filter]);
```

### 3. Resetting All State When a Prop Changes

```tsx
// ❌ Bad: Resetting state in Effect
useEffect(() => {
  setComment("");
}, [userId]);

// ✅ Good: Reset the entire subtree with key
<Profile userId={userId} key={userId} />
```

### 4. Adjusting Some State When a Prop Changes

```tsx
// ❌ Bad: Causes multiple re-renders
useEffect(() => {
  setSelection(null);
}, [items]);

// ✅ Good: Compute during rendering
const selection = items.find((item) => item.id === selectedId) ?? null;
```

### 5. Sharing Logic Between Event Handlers

```tsx
// ❌ Bad: Event-specific logic in Effect
useEffect(() => {
  if (product.isInCart) {
    showNotification(`Added ${product.name}`);
  }
}, [product]);

// ✅ Good: Place in event handler
function handleBuyClick() {
  addToCart(product);
  showNotification(`Added ${product.name}`);
}
```

### 6. Sending POST Requests

```tsx
// ❌ Bad: Event-specific logic in Effect
const [jsonToSubmit, setJsonToSubmit] = useState(null);
useEffect(() => {
  if (jsonToSubmit !== null) {
    post("/api/register", jsonToSubmit);
  }
}, [jsonToSubmit]);

// ✅ Good: Call directly in event handler
function handleSubmit(e) {
  e.preventDefault();
  post("/api/register", { firstName, lastName });
}
```

**Decision criteria:**
- "The component was displayed" → Effect
- "The user did something" → Event handler

### 7. Chains of Computations

```tsx
// ❌ Bad: Effects triggering other Effects
useEffect(() => {
  if (card?.gold) {
    setGoldCardCount((c) => c + 1);
  }
}, [card]);

useEffect(() => {
  if (goldCardCount > 3) {
    setRound((r) => r + 1);
    setGoldCardCount(0);
  }
}, [goldCardCount]);

// ✅ Good: Compute and update in a single event handler
function handlePlaceCard(nextCard) {
  setCard(nextCard);
  if (nextCard.gold) {
    if (goldCardCount < 3) {
      setGoldCardCount(goldCardCount + 1);
    } else {
      setGoldCardCount(0);
      setRound(round + 1);
    }
  }
}
```

### 8. Application Initialization

```tsx
// ❌ Bad: Runs twice in development
useEffect(() => {
  loadDataFromLocalStorage();
  checkAuthToken();
}, []);

// ✅ Good: Track with module-level variable
let didInit = false;

function App() {
  useEffect(() => {
    if (!didInit) {
      didInit = true;
      loadDataFromLocalStorage();
    }
  }, []);
}

// ✅ Better: Run at module initialization
if (typeof window !== "undefined") {
  checkAuthToken();
}
```

### 9. Notifying Parent Component of State Changes

```tsx
// ❌ Bad: Notifying parent in Effect
useEffect(() => {
  onChange(isOn);
}, [isOn, onChange]);

// ✅ Good: Update both in the same event handler
function handleClick() {
  const nextIsOn = !isOn;
  setIsOn(nextIsOn);
  onChange(nextIsOn);
}

// ✅ Better: Lift state up to parent
function Toggle({ isOn, onChange }) {
  function handleClick() {
    onChange(!isOn);
  }
}
```

### 10. Passing Data to Parent

```tsx
// ❌ Bad: Child updates parent
function Child({ onFetched }) {
  const data = useSomeAPI();
  useEffect(() => {
    if (data) onFetched(data);
  }, [data, onFetched]);
}

// ✅ Good: Parent fetches and passes to child
function Parent() {
  const data = useSomeAPI();
  return <Child data={data} />;
}
```

### 11. Subscribing to External Stores

```tsx
// ❌ Bad: Manually managing subscriptions
useEffect(() => {
  const updateState = () => setIsOnline(navigator.onLine);
  window.addEventListener("online", updateState);
  return () => window.removeEventListener("online", updateState);
}, []);

// ✅ Good: Use useSyncExternalStore
function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
```

### 12. Data Fetching

```tsx
// ❌ Bad: Race condition occurs
useEffect(() => {
  fetchResults(query).then(setResults);
}, [query]);

// ✅ Good: Ignore stale responses with cleanup
useEffect(() => {
  let ignore = false;
  fetchResults(query).then((json) => {
    if (!ignore) setResults(json);
  });
  return () => { ignore = true; };
}, [query]);

// ✅ Better: Extract to custom Hook or use React Query/SWR
```

## Cases Where useEffect Is Appropriate

| Case | Example |
|------|---------|
| Synchronizing with external systems | WebSocket, browser APIs |
| Timers | setInterval, setTimeout |
| Event listeners | resize, scroll, keyboard |
| DOM manipulation | Focus management, measurement |
| Analytics | Page view logging |

## Decision Criteria for useMemo / useCallback / React.memo

### Default

- Let the React Compiler handle it (do not assume manual memoization).

### Cases Where It May Be Added

- When a memoized value/function is used in an Effect dependency array to control re-execution frequency
- When the child uses `React.memo` + heavy rendering, and the parent re-renders frequently
- When using an external library that requires referential identity as part of its contract (e.g., some chart/map SDKs)

### Cases Where It Should Not Be Added

- Introduction based solely on speculation that "it will probably be faster"
- When the value derivation is lightweight and the cost of re-computation is less than the added code complexity

## Implementation Patterns in This Project

### State Consolidation with Discriminated Unions

```tsx
type SessionPhase =
  | { type: "idle" }
  | { type: "starting" }
  | { type: "active"; session: Session }
  | { type: "error"; message: string };

const [phase, setPhase] = useState<SessionPhase>({ type: "idle" });
```

### Optimistic Updates

```tsx
const [optimisticTurns, setOptimisticTurns] = useState<Turn[]>([]);

const turns = useMemo(() => {
  if (!session) return optimisticTurns;
  const serverIds = new Set(session.turns.map((t) => t.id));
  const pending = optimisticTurns.filter((t) => !serverIds.has(t.id));
  return [...session.turns, ...pending];
}, [session, optimisticTurns]);
```

### Explicit Initialization Control

```tsx
// Hook side: Return an initialization function
export const useTaskSession = () => {
  const startSession = useCallback(async () => { /* ... */ }, []);
  return { startSession };
};

// Container side: Call when conditions are met
const hasStartedRef = useRef(false);
useEffect(() => {
  if (isReady && !hasStartedRef.current) {
    hasStartedRef.current = true;
    void startSession();
  }
}, [isReady, startSession]);
```

### Unmount Check in Async Operations

```tsx
// ✅ Good: Prevent state updates after unmount
useEffect(() => {
  let isMounted = true;

  const loadData = async () => {
    const result = await fetchData();
    if (!isMounted) return; // Do nothing after unmount
    setData(result);
  };

  void loadData();

  return () => {
    isMounted = false;
  };
}, []);
```

### Preventing Race Conditions (Sequence Tracking)

```tsx
// ✅ Good: Prevent multiple sessions from competing
const sessionSeqRef = useRef(0);

useEffect(() => {
  sessionSeqRef.current += 1;
  const currentSeq = sessionSeqRef.current;

  const isCurrentSession = () => sessionSeqRef.current === currentSeq;

  const startSession = async () => {
    const result = await connectToExternalSystem();
    if (!isCurrentSession()) return; // Ignore stale sessions
    handleResult(result);
  };

  void startSession();

  return () => {
    // When the next session starts, it won't match currentSeq
  };
}, [dependency]);
```

## Data Fetching Best Practices

### Recommended: Use a Dedicated Library

```tsx
// ✅ Best: React Query / SWR / TanStack Query
import { useQuery } from "@tanstack/react-query";

function useTaskData(taskId: string) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTaskData(taskId),
  });
}
```

**Benefits:**
- Caching, deduplication, background updates
- Automatic error handling and retries
- SSR/SSG support

### Fallback: Fetching Inside an Effect

```tsx
// ✅ Acceptable: When project constraints prevent using a library
useEffect(() => {
  let ignore = false;

  const fetchData = async () => {
    setLoading(true);
    const result = await api.fetch();
    if (ignore) return;

    if (result.err) {
      setError(result.err.message);
    } else {
      setData(result.val);
    }
    setLoading(false);
  };

  void fetchData();

  return () => {
    ignore = true;
  };
}, [query]);
```

## React 19 New Features

### use Hook (For Server Components)

```tsx
// React 19: Consume Promises directly
import { use } from "react";

function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);
  return comments.map((c) => <Comment key={c.id} comment={c} />);
}
```

### useOptimistic

```tsx
// React 19: Standardized optimistic UI
import { useOptimistic } from "react";

function TodoList({ todos, addTodo }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, { ...newTodo, pending: true }],
  );

  async function handleAdd(formData) {
    const newTodo = { text: formData.get("text") };
    addOptimisticTodo(newTodo);
    await addTodo(newTodo);
  }

  return optimisticTodos.map((todo) => (
    <Todo key={todo.id} todo={todo} />
  ));
}
```

### useActionState (For Forms)

```tsx
// React 19: Form action state management
import { useActionState } from "react";

function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState, formData) => {
      const result = await login(formData);
      if (result.err) return { error: result.err.message };
      return { success: true };
    },
    null,
  );

  return (
    <form action={formAction}>
      <input name="email" type="email" />
      <button disabled={isPending}>Log in</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
```

## useSyncExternalStore

Used for subscribing to external stores (browser APIs, third-party libraries).

```tsx
import { useSyncExternalStore } from "react";

// Subscribing to browser APIs
function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("online", callback);
      window.addEventListener("offline", callback);
      return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
      };
    },
    () => navigator.onLine,    // For client
    () => true,                // For SSR (assume online on server)
  );
}

// Subscribing to a custom store
function useExternalStore<T>(store: ExternalStore<T>) {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}
```

**Advantages over useEffect:**
- Correct behavior in Concurrent Mode
- Server-side rendering support
- Prevention of tearing (displaying inconsistent state)
