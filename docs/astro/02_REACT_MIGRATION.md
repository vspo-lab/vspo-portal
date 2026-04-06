# vanilla JS → React コンポーネント移行

## 移行対象の vanilla JS ファイル

### 1. `features/shared/components/dialog-helpers.ts`

**現状**: `initDialog()` で dialog の backdrop-click-to-close と cancel ボタンを設定。AbortController で View Transitions 対応。

**問題点**:
- 呼び出し側（ChannelConfigForm, ChannelAddModal, DeleteChannelDialog）が毎回 `initDialog("dialog-id")` を呼ぶ必要がある
- `astro:page-load` での再初期化が必要

**React 移行後**: カスタムフックに置換
```tsx
// features/shared/hooks/useDialog.ts
function useDialog(ref: RefObject<HTMLDialogElement>) {
  // backdrop click → close
  // Escape key handling
  // open/close state management
}
```

### 2. `features/shared/components/close-on-outside-click.ts`

**現状**: `<details data-auto-close>` 要素のクリック外閉じを実装。global event listener。

**問題点**:
- グローバルイベントリスナーで全 `<details>` を監視
- React island 内の `<details>` との干渉リスク

**React 移行後**: `useClickOutside` フックまたは headless dropdown コンポーネント
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

**現状**: `toggle()` と `syncTheme()` を export。`localStorage` + `classList` 操作。

**問題点**:
- ThemeToggle と UserMenu の両方から呼ばれるが、状態の同期は DOM ベース
- SSR 時のフラッシュ防止が `is:inline` スクリプトに依存

**React 移行後**: Nano Store + React hook
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

## ページ内 `<script>` タグの移行

### 4. `pages/index.astro` — Feature Popup スクリプト (30行)

**現状**:
```js
document.querySelectorAll(".feature-card-trigger").forEach(btn => {
  btn.addEventListener("click", () => {
    const dialog = document.getElementById(btn.dataset.feature);
    if (dialog && !dialog.open) dialog.showModal();
  });
});
```

**問題点**:
- `AbortController` + `astro:page-load` で re-init
- クラス名ベースのセレクタに依存

**React 移行案**: `FeatureShowcase` React island
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

### 5. `pages/dashboard/[guildId].astro` — Dialog close スクリプト (8行)

**現状**: `astro:before-preparation` と `astro:after-swap` で全 dialog を close。

**問題点**: View Transitions の「stale top-layer state」対策。React 移行後は不要。

**React 移行後**: React island 内で dialog state を管理するため、ページ遷移で自然にアンマウント → 不要に。

### 6. `ChannelConfigForm.astro` — メイン操作スクリプト (320行)

**これが最大の移行対象。** 以下の機能を含む:
- Edit ボタンクリック → dialog open + フォーム populate
- Radio button highlight toggle
- Custom members dropdown open/close
- Chip 生成・削除
- 検索フィルタリング
- Select All / Deselect All per group
- Selected count 更新
- Reset ボタン → reset form submit
- Save ボタン disabled state

**React 移行案**: 3つの React コンポーネントに分割

```
ChannelConfigModal.tsx (island, client:load)
  ├── LanguageSelect.tsx
  ├── MemberTypeRadioGroup.tsx
  └── CustomMemberPicker.tsx
       ├── MemberSearchInput.tsx
       ├── MemberChips.tsx
       └── MemberCheckboxGroup.tsx
```

**状態管理**:
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

### 7. `ChannelAddModal.astro` — チャンネル追加スクリプト (110行)

**現状**: fetch API でギルドのチャンネル一覧を取得、検索フィルタ、template clone。

**React 移行案**:
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

### 8. `DeleteChannelDialog.astro` — 削除確認スクリプト (30行)

**現状**: クリックイベントで dialog open + heading/hidden input 書き換え。

**React 移行案**:
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

### 9. `ThemeToggle.astro` — テーマ切替スクリプト (12行)

**React 移行案**:
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

**注意**: `Base.astro` の `is:inline` テーマ初期化スクリプトは維持する必要がある (FOUC 防止)。

### 10. `FlashMessage.astro` — auto-dismiss スクリプト (5行)

**React 移行案**:
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

## 移行時の注意点

### Astro Actions との統合

React island から Astro Actions を呼ぶ方法:
```tsx
import { actions } from "astro:actions";

// React コンポーネント内
const handleSubmit = async (data: FormData) => {
  const result = await actions.updateChannel(data);
  if (result.error) { /* handle error */ }
};
```

ただし `accept: "form"` の Action は `<form>` 経由でないと CSRF 保護が効かない。選択肢:
1. **hidden form を維持** — React で state 管理、submit は hidden form 経由
2. **Action を `accept: "json"` に変更** — React から直接呼べるが、progressive enhancement を失う

**推奨**: Phase 3 では hidden form 維持、Phase 4 で `accept: "json"` に移行。

### Actions セキュリティの注意点 (Astro MCP 検証済み)

- Astro Actions は `/_actions/{name}` で公開エンドポイントとして公開される
- `getActionContext()` を middleware で使用して認証ゲーティング可能:

```typescript
// middleware.ts
import { getActionContext } from "astro:actions";

export const onRequest = defineMiddleware(async (context, next) => {
  const { action } = getActionContext(context);
  if (!action) return next();

  // 認証が必要な Action の場合
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

### View Transitions との互換性

`<ClientRouter />` 使用時の React island の注意点:
- `transition:persist` を使うと island のアンマウント/再マウントを防げる
- `transition:name` でアニメーション対象を指定
- `astro:page-load` は React island 内では不要 (React が自前でライフサイクル管理)

### SSR と Hydration

- `client:load` — ページロード即座にハイドレーション。フォーム系に使用
- `client:idle` — ブラウザがアイドル時にハイドレーション。UserMenu, LanguageSelector に使用
- `client:visible` — ビューポートに入った時にハイドレーション。LP の FeaturePopup に使用
- `client:only="react"` — SSR なしでクライアントのみレンダリング。テーマトグル等に使用可能

## ファイル配置規則

```
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
