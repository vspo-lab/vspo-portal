# Nano Stores による状態管理設計

## なぜ Nano Stores か

| 選択肢 | メリット | デメリット |
|--------|---------|-----------|
| **Nano Stores** | Astro 公式推奨、フレームワーク非依存、2KB、island 間共有 | エコシステムが小さい |
| React Context | React 標準 | island 間で共有不可 (各 island が独立した React tree) |
| Zustand | 豊富な機能 | Astro との統合が非公式 |
| Jotai | atom ベースで相性良い | Astro 用の adapter がない |

**Nano Stores を選択する最大の理由**: Astro Islands は各 island が独立した React ルートであり、React Context は island をまたげない。Nano Stores はフレームワーク非依存のため、複数の独立した React island 間で状態を共有できる。

## 依存パッケージ

```bash
pnpm add nanostores @nanostores/react
```

## Store 設計

### 1. Theme Store

```typescript
// features/shared/stores/theme.ts
import { atom, onMount } from "nanostores";

type Theme = "light" | "dark";

export const $theme = atom<Theme>("light");

onMount($theme, () => {
  // localStorage から初期値を取得
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored) {
    $theme.set(stored);
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    $theme.set("dark");
  }

  // system preference の変更を監視
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem("theme")) {
      $theme.set(e.matches ? "dark" : "light");
    }
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
});

// theme 変更時に localStorage + DOM を更新
$theme.listen((theme) => {
  localStorage.setItem("theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
});
```

**使用箇所**: ThemeToggle, UserMenu

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

// 編集対象のチャンネル
export const $channelToEdit = atom<ChannelToEdit>(null);

// 削除対象のチャンネル
export const $channelToDelete = atom<ChannelToDelete>(null);

// チャンネル追加モーダルの表示
export const $showAddModal = atom<boolean>(false);
```

**使用箇所**: ChannelTable (ボタンクリック) → ChannelConfigModal, DeleteChannelDialog, ChannelAddModal

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

// 楽観的更新ヘルパー
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

**使用箇所**: ChannelTable, ChannelConfigModal (保存後), ChannelAddModal (追加後), DeleteChannelDialog (削除後)

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
    // 同じメッセージの場合のみクリア (新しいメッセージが上書きしていない場合)
    if ($flash.get()?.id === id) {
      $flash.set(null);
    }
  }, duration);
}
```

**使用箇所**: FlashMessage, 各 Action の結果表示

## データフロー図

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

## 初期データの受け渡し

Astro ページの frontmatter でサーバーサイドデータを取得し、React island の props として渡す。island 内で Nano Store に初期値を設定する:

```tsx
// ChannelTable.tsx
import { useEffect } from "react";
import { $channelData } from "../stores/channel-data";

export function ChannelTable({ initialChannels }: { initialChannels: ChannelConfig[] }) {
  // 初回マウント時に Nano Store を初期化
  useEffect(() => {
    $channelData.setKey("channels", initialChannels);
  }, [initialChannels]);

  const { channels } = useStore($channelData);
  // render...
}
```

## PRG → 楽観的 UI への移行

### Before (現在の PRG パターン)

```text
User clicks "Save" → POST /action → Server processes → Redirect → Full page reload → New data displayed
```

### After (楽観的 UI)

```text
User clicks "Save" → Optimistic update to $channelData → POST /action → 
  Success: keep optimistic state
  Failure: rollback $channelData + show $flash error
```

```tsx
async function handleSave(config: ChannelConfig) {
  const previous = $channelData.get().channels;

  // 1. 楽観的更新
  optimisticUpdate(config.id, config);
  showFlash("success", "Channel updated");

  // 2. サーバーに送信
  const result = await actions.updateChannel(config);

  if (result.error) {
    // 3. ロールバック
    $channelData.setKey("channels", previous);
    showFlash("error", result.error.message);
  }
}
```

## 注意事項

### SSR と Hydration の整合性

- Nano Store の初期値は SSR 時には空 → hydration mismatch が起きうる
- 対策: `client:only="react"` を使うか、初期値を props で渡して `useEffect` で Store に設定

### `onMount` パターン (Astro MCP 検証済み)

Nano Stores の `onMount` はブラウザ側でのみ実行される。SSR 環境では呼ばれないため、localStorage やブラウザ API の初期化に安全に使用できる:

```typescript
import { atom, onMount } from "nanostores";

export const $theme = atom<"light" | "dark">("light");

// onMount はストアに最初のサブスクライバーが付いた時のみ実行される
// SSR 環境では実行されない → hydration mismatch を回避
onMount($theme, () => {
  const stored = localStorage.getItem("theme");
  if (stored) $theme.set(stored as "light" | "dark");
  // クリーンアップ関数を返せる
  return () => { /* cleanup */ };
});
```

**`.get()` vs `useStore()`**:

- `.get()` — 現在値の1回取得。副作用やイベントハンドラ内で使用
- `useStore($store)` — リアクティブなサブスクリプション。React コンポーネントのレンダリングに使用

### View Transitions との共存

- `<ClientRouter />` でページ遷移しても Nano Store のインスタンスは維持される
- `transition:persist` の island は再マウントされないため Store の値も保持
- ページ遷移時に Store をリセットする必要がある場合は `astro:before-preparation` で `$store.set(initialValue)` を呼ぶ

### テスト

- Store 単体テスト: `$store.set()` → `$store.get()` で状態を検証
- コンポーネントテスト: `@testing-library/react` + Store のモック
