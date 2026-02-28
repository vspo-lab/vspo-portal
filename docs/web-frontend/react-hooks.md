# React Hooks ガイドライン

> 参照:
> - [You Might Not Need an Effect – React](https://react.dev/learn/you-might-not-need-an-effect)
> - [React Compiler – React](https://react.dev/learn/react-compiler)
> - [Incremental Adoption – React Compiler](https://react.dev/learn/react-compiler/incremental-adoption)
> - [eslint-plugin-react-hooks – React](https://react.dev/reference/eslint-plugin-react-hooks)

## 基本原則

**Effectは外部システムとの同期のためのエスケープハッチ**である。外部システムが関係しない場合、Effectは不要。

## React Compiler ON 前提のルール

このプロジェクトでは React Compiler を有効化して運用するため、Hooks の扱いを次の方針に統一する。

1. **まずは素のコードを書く**
   - 値の導出はレンダリング中にそのまま書く。
   - イベントはイベントハンドラで完結させる。
2. **`useMemo` / `useCallback` は必要なときだけ使う**
   - Effect 依存配列を安定化したいとき
   - サードパーティ API が参照同一性を要求するとき
   - プロファイリング済みで手動メモ化の効果が確認できるとき
3. **古い最適化を機械的に削除しない**
   - 既存 `useMemo` / `useCallback` を消す場合は、動作とパフォーマンスを検証してから行う。
4. **lint を常時有効化する**
   - `eslint-plugin-react-hooks` の `recommended` もしくは `recommended-latest` を有効にし、Rules of React 逸脱をCIで検知する。

## useEffectが不要なケース

### 1. propsやstateから派生する値

```tsx
// ❌ Bad: 冗長な状態変数
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(firstName + " " + lastName);
}, [firstName, lastName]);

// ✅ Good: レンダリング中に計算
const fullName = firstName + " " + lastName;
```

### 2. 高コストな計算のキャッシュ

```tsx
// ❌ Bad: Effectで状態を更新
const [visibleTodos, setVisibleTodos] = useState([]);
useEffect(() => {
  setVisibleTodos(getFilteredTodos(todos, filter));
}, [todos, filter]);

// ✅ Good (Compiler ON): まずは通常の計算を使う
const visibleTodos = getFilteredTodos(todos, filter);

// ✅ Good (必要時のみ): 手動メモ化を追加
const visibleTodos = useMemo(() => getFilteredTodos(todos, filter), [todos, filter]);
```

### 3. propが変わったときに全状態をリセット

```tsx
// ❌ Bad: Effectで状態をリセット
useEffect(() => {
  setComment("");
}, [userId]);

// ✅ Good: keyでサブツリー全体をリセット
<Profile userId={userId} key={userId} />
```

### 4. propが変わったときに一部の状態を調整

```tsx
// ❌ Bad: 複数回レンダリングが発生
useEffect(() => {
  setSelection(null);
}, [items]);

// ✅ Good: レンダリング中に計算
const selection = items.find((item) => item.id === selectedId) ?? null;
```

### 5. イベントハンドラ間でロジックを共有

```tsx
// ❌ Bad: イベント固有のロジックがEffectにある
useEffect(() => {
  if (product.isInCart) {
    showNotification(`Added ${product.name}`);
  }
}, [product]);

// ✅ Good: イベントハンドラに配置
function handleBuyClick() {
  addToCart(product);
  showNotification(`Added ${product.name}`);
}
```

### 6. POSTリクエストの送信

```tsx
// ❌ Bad: Effectでイベント固有のロジック
const [jsonToSubmit, setJsonToSubmit] = useState(null);
useEffect(() => {
  if (jsonToSubmit !== null) {
    post("/api/register", jsonToSubmit);
  }
}, [jsonToSubmit]);

// ✅ Good: イベントハンドラで直接呼び出し
function handleSubmit(e) {
  e.preventDefault();
  post("/api/register", { firstName, lastName });
}
```

**判断基準:**
- 「コンポーネントが表示された」→ Effect
- 「ユーザーが何かした」→ イベントハンドラ

### 7. 計算の連鎖

```tsx
// ❌ Bad: Effectが他のEffectをトリガー
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

// ✅ Good: 1つのイベントハンドラで計算と更新
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

### 8. アプリケーションの初期化

```tsx
// ❌ Bad: 開発時に2回実行される
useEffect(() => {
  loadDataFromLocalStorage();
  checkAuthToken();
}, []);

// ✅ Good: モジュールレベルの変数で追跡
let didInit = false;

function App() {
  useEffect(() => {
    if (!didInit) {
      didInit = true;
      loadDataFromLocalStorage();
    }
  }, []);
}

// ✅ Better: モジュール初期化時に実行
if (typeof window !== "undefined") {
  checkAuthToken();
}
```

### 9. 親コンポーネントへの状態変更通知

```tsx
// ❌ Bad: Effectで親に通知
useEffect(() => {
  onChange(isOn);
}, [isOn, onChange]);

// ✅ Good: 同じイベントハンドラで両方更新
function handleClick() {
  const nextIsOn = !isOn;
  setIsOn(nextIsOn);
  onChange(nextIsOn);
}

// ✅ Better: 状態を親にリフトアップ
function Toggle({ isOn, onChange }) {
  function handleClick() {
    onChange(!isOn);
  }
}
```

### 10. 親へのデータ受け渡し

```tsx
// ❌ Bad: 子が親を更新
function Child({ onFetched }) {
  const data = useSomeAPI();
  useEffect(() => {
    if (data) onFetched(data);
  }, [data, onFetched]);
}

// ✅ Good: 親がフェッチして子に渡す
function Parent() {
  const data = useSomeAPI();
  return <Child data={data} />;
}
```

### 11. 外部ストアへの購読

```tsx
// ❌ Bad: 手動で購読を管理
useEffect(() => {
  const updateState = () => setIsOnline(navigator.onLine);
  window.addEventListener("online", updateState);
  return () => window.removeEventListener("online", updateState);
}, []);

// ✅ Good: useSyncExternalStoreを使用
function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
```

### 12. データフェッチ

```tsx
// ❌ Bad: 競合状態が発生
useEffect(() => {
  fetchResults(query).then(setResults);
}, [query]);

// ✅ Good: クリーンアップでstaleレスポンスを無視
useEffect(() => {
  let ignore = false;
  fetchResults(query).then((json) => {
    if (!ignore) setResults(json);
  });
  return () => { ignore = true; };
}, [query]);

// ✅ Better: カスタムHookに抽出 or React Query/SWRを使用
```

## useEffectが適切なケース

| ケース | 例 |
|-------|-----|
| 外部システムとの同期 | WebSocket、ブラウザAPI |
| タイマー | setInterval、setTimeout |
| イベントリスナー | resize、scroll、keyboard |
| DOM操作 | フォーカス管理、測定 |
| アナリティクス | ページビューのロギング |

## useMemo / useCallback / React.memo の判断基準

### デフォルト

- React Compiler に任せる（手動メモ化を前提にしない）。

### 追加してよいケース

- メモ化された値/関数を Effect の依存配列で使い、再実行頻度を制御したい
- Child 側が `React.memo` + 重いレンダリングで、かつ親の再レンダリングが頻発する
- 参照同一性が契約に含まれる外部ライブラリ（例: 一部の chart/map SDK）を使う

### 追加しないケース

- 「たぶん速くなるはず」という推測だけの導入
- 値導出が軽量で、再計算コストよりコード複雑化の方が大きい場合

## 本プロジェクトでの実装パターン

### Discriminated Union による状態統合

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

### 初期化の明示的な制御

```tsx
// Hook側: 初期化関数を返す
export const useTaskSession = () => {
  const startSession = useCallback(async () => { /* ... */ }, []);
  return { startSession };
};

// Container側: 条件が揃ったら呼び出す
const hasStartedRef = useRef(false);
useEffect(() => {
  if (isReady && !hasStartedRef.current) {
    hasStartedRef.current = true;
    void startSession();
  }
}, [isReady, startSession]);
```

### 非同期処理でのunmountチェック

```tsx
// ✅ Good: unmount後の状態更新を防止
useEffect(() => {
  let isMounted = true;

  const loadData = async () => {
    const result = await fetchData();
    if (!isMounted) return; // unmount後は何もしない
    setData(result);
  };

  void loadData();

  return () => {
    isMounted = false;
  };
}, []);
```

### 競合状態の防止（Sequence Tracking）

```tsx
// ✅ Good: 複数のセッションが競合しないようにする
const sessionSeqRef = useRef(0);

useEffect(() => {
  sessionSeqRef.current += 1;
  const currentSeq = sessionSeqRef.current;

  const isCurrentSession = () => sessionSeqRef.current === currentSeq;

  const startSession = async () => {
    const result = await connectToExternalSystem();
    if (!isCurrentSession()) return; // 古いセッションは無視
    handleResult(result);
  };

  void startSession();

  return () => {
    // 次のセッションが開始されるとcurrentSeqと一致しなくなる
  };
}, [dependency]);
```

## データフェッチのベストプラクティス

### 推奨: 専用ライブラリを使用

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

**利点:**
- キャッシング、重複排除、バックグラウンド更新
- エラー処理とリトライの自動化
- SSR/SSGサポート

### 次善策: Effect内でのフェッチ

```tsx
// ✅ Acceptable: プロジェクトの制約でライブラリが使えない場合
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

## React 19 の新機能

### use Hook（Server Components用）

```tsx
// React 19: Promiseを直接消費
import { use } from "react";

function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);
  return comments.map((c) => <Comment key={c.id} comment={c} />);
}
```

### useOptimistic

```tsx
// React 19: 楽観的UIの標準化
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

### useActionState（フォーム用）

```tsx
// React 19: フォームアクションの状態管理
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
      <button disabled={isPending}>ログイン</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
```

## useSyncExternalStore

外部ストア（ブラウザAPI、サードパーティライブラリ）への購読に使用。

```tsx
import { useSyncExternalStore } from "react";

// ブラウザAPIの購読
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
    () => navigator.onLine,    // クライアント用
    () => true,                // SSR用（サーバーではオンラインとみなす）
  );
}

// カスタムストアの購読
function useExternalStore<T>(store: ExternalStore<T>) {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
}
```

**useEffectより優れている点:**
- Concurrent Modeでの正確な動作
- サーバーサイドレンダリングのサポート
- tearing（不整合な状態の表示）の防止
