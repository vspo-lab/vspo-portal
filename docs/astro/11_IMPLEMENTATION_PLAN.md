# 実装順序と依存関係

## Phase 概要

```
Phase 1: 基盤セットアップ (1-2日)
  ↓
Phase 2: 共通 hooks & stores (1-2日)
  ↓
Phase 3: 小さい island (2-3日)
  ↓
Phase 4: 大きなフォーム系 island (3-5日)
  ↓
Phase 5: 状態管理統合 & 楽観的UI (2-3日)
  ↓
Phase 6: セキュリティ & パフォーマンス (2-3日)
  ↓
Phase 7: クリーンアップ (1-2日)
```

## Phase 1: 基盤セットアップ

### 依存: なし

| タスク | ファイル | 詳細 |
|--------|---------|------|
| 1-1 | `package.json` | `pnpm add @astrojs/react react react-dom nanostores @nanostores/react` |
| 1-2 | `package.json` | `pnpm add -D @types/react @types/react-dom @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-axe` |
| 1-3 | `astro.config.ts` | `react()` integration 追加 |
| 1-4 | `tsconfig.json` | `"jsx": "react-jsx"` 追加 |
| 1-5 | `vitest.config.ts` | jsdom environment, setupFiles 設定 |
| 1-6 | `src/test/setup.ts` | テストセットアップファイル作成 |

### 検証
```bash
# React island が動作することを確認
# 簡単なテスト React コンポーネントを作成して client:load で表示
pnpm build && pnpm preview
```

---

## Phase 2: 共通 Hooks & Stores

### 依存: Phase 1 完了

| タスク | ファイル | 詳細 |
|--------|---------|------|
| 2-1 | `features/shared/hooks/useDialog.ts` | dialog open/close, focus trap, backdrop click, Escape |
| 2-2 | `features/shared/hooks/useClickOutside.ts` | 外部クリック検知 |
| 2-3 | `features/shared/hooks/useTheme.ts` | theme toggle + system preference |
| 2-4 | `features/shared/stores/theme.ts` | Nano Store: `$theme` atom |
| 2-5 | `features/shared/stores/flash.ts` | Nano Store: `$flash` atom + `showFlash()` |
| 2-6 | `features/channel/stores/channel-actions.ts` | Nano Store: `$channelToEdit`, `$channelToDelete`, `$showAddModal` |
| 2-7 | `features/channel/stores/channel-data.ts` | Nano Store: `$channelData` map + optimistic helpers |

### テスト
| テストファイル | テスト対象 |
|---------------|-----------|
| `hooks/__tests__/useDialog.test.ts` | focus trap, backdrop click, Escape key |
| `hooks/__tests__/useClickOutside.test.ts` | outside click detection |
| `hooks/__tests__/useTheme.test.ts` | toggle, system preference |
| `stores/__tests__/theme.test.ts` | `$theme` atom, localStorage sync |
| `stores/__tests__/flash.test.ts` | `showFlash()`, auto-dismiss |
| `stores/__tests__/channel-data.test.ts` | optimistic update/add/remove |

---

## Phase 3: 小さい Island

### 依存: Phase 2 完了

| タスク | ファイル | 移行元 | ディレクティブ |
|--------|---------|--------|---------------|
| 3-1 | `features/shared/components/ThemeToggle.tsx` | `ThemeToggle.astro` の script | `client:load` |
| 3-2 | `features/shared/components/FlashMessage.tsx` | `FlashMessage.astro` の script | `client:idle` |
| 3-3 | `features/landing/components/FeatureShowcase.tsx` | `index.astro` の script + `FeaturePopup.astro` | `client:visible` |
| 3-4 | `features/shared/components/UserMenu.tsx` | `UserMenu.astro` の `<details>` JS | `client:idle` |
| 3-5 | `features/shared/components/LanguageSelector.tsx` | `LanguageSelector.astro` の header variant | `client:idle` |

### 各タスクの手順 (TDD)

1. テストファイル作成 (RED)
2. React コンポーネント実装 (GREEN)
3. Astro ページ/レイアウトで `client:*` ディレクティブで配置
4. 対応する vanilla JS / `<script>` を削除
5. a11y テスト実行
6. ビルド確認

### 3-1: ThemeToggle の詳細

```
ThemeToggle.astro (server: アイコン表示) → ThemeToggle.tsx (client:load)
  - useTheme() hook を使用
  - $theme Nano Store と連携
  - aria-pressed 追加
  - system preference 対応
  - Base.astro の is:inline テーマ初期化スクリプトは維持
```

### 3-3: FeatureShowcase の詳細

```
index.astro の <script> (30行) + FeaturePopup.astro
  ↓
FeatureShowcase.tsx (client:visible)
  ├── FeatureCard.tsx (表示コンポーネント)
  └── FeatureDialog.tsx (dialog、useDialog hook 使用)

- features データは Astro page の props で渡す
- dialog の focus management は useDialog hook
```

### テスト
| テストファイル | テスト対象 |
|---------------|-----------|
| `ThemeToggle.test.tsx` | toggle, aria-pressed, icon switch |
| `FlashMessage.test.tsx` | auto-dismiss, dismiss button, role="status" |
| `FeatureShowcase.test.tsx` | card click → dialog open, close |
| `UserMenu.test.tsx` | dropdown open/close, keyboard nav |
| `LanguageSelector.test.tsx` | locale switch, aria-selected |

---

## Phase 4: 大きなフォーム系 Island

### 依存: Phase 3 完了 (hooks と stores が検証済み)

| タスク | ファイル | 移行元 | ディレクティブ |
|--------|---------|--------|---------------|
| 4-1 | `features/channel/components/ChannelConfigModal.tsx` | `ChannelConfigForm.astro` の 320行 script | `client:load` |
| 4-2 | `features/channel/components/ChannelAddModal.tsx` | `ChannelAddModal.astro` の 110行 script | `client:load` |
| 4-3 | `features/channel/components/DeleteChannelDialog.tsx` | `DeleteChannelDialog.astro` の 30行 script | `client:load` |

### 4-1: ChannelConfigModal の詳細

**最大の移行。5つのサブコンポーネントに分割:**

```
ChannelConfigModal.tsx
  ├── LanguageSelect.tsx
  ├── MemberTypeRadioGroup.tsx (WAI-ARIA radio group)
  └── CustomMemberPicker.tsx (WAI-ARIA combobox + listbox)
       ├── MemberSearchInput.tsx
       ├── MemberChips.tsx
       └── MemberCheckboxGroup.tsx
```

**状態管理**: `useReducer` で `ConfigFormState` を管理

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

**Astro Action との統合**: Phase 4 では hidden form 維持

```tsx
function ChannelConfigModal({ guildId, channel, members, translations }) {
  const [state, dispatch] = useReducer(reducer, initialState(channel));

  const handleSave = () => {
    // hidden form を submit
    const form = document.getElementById("channel-config-form") as HTMLFormElement;
    // form に state の値をセット
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

### 4-2: ChannelAddModal の詳細

```
ChannelAddModal.tsx
  ├── ChannelSearchInput.tsx
  └── ChannelList.tsx (with loading/error/empty states)
```

- fetch API でチャンネル一覧取得
- 検索フィルタ + 登録済みチャンネルのフィルタ
- loading/error/empty states
- チャンネル追加は hidden form submit

### 4-3: DeleteChannelDialog の詳細

```
DeleteChannelDialog.tsx
  - $channelToDelete Nano Store から対象取得
  - 確認テキスト表示
  - キャンセルボタンに初期 focus
  - 削除は hidden form submit
```

### Astro wrapper の変更

```astro
<!-- [guildId].astro — 変更後 -->
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

### テスト
| テストファイル | テスト対象 |
|---------------|-----------|
| `ChannelConfigModal.test.tsx` | form state, radio group, member picker, save/reset |
| `MemberTypeRadioGroup.test.tsx` | selection, keyboard nav, aria-checked |
| `CustomMemberPicker.test.tsx` | search, chips, select all/deselect all |
| `ChannelAddModal.test.tsx` | fetch, search, loading state, channel selection |
| `DeleteChannelDialog.test.tsx` | confirmation, focus management |
| `a11y/*.test.tsx` | axe-core tests for all modals |

---

## Phase 5: 状態管理統合 & 楽観的UI

### 依存: Phase 4 完了

| タスク | 詳細 |
|--------|------|
| 5-1 | ChannelTable を React 化し、`$channelData` から描画 |
| 5-2 | Action を `accept: "json"` に変更 |
| 5-3 | 楽観的更新の実装 (save → optimisticUpdate → API call → rollback on error) |
| 5-4 | 楽観的追加の実装 (add → optimisticAdd → API call → rollback on error) |
| 5-5 | 楽観的削除の実装 (delete → optimisticRemove → API call → rollback on error) |
| 5-6 | PRG パターンの除去 (redirect 不要に) |
| 5-7 | FlashMessage を `$flash` Nano Store と連携 |

### データフロー変更

```
Before (PRG):
  User action → Form POST → Server → Redirect → Full page reload

After (Optimistic UI):
  User action → Optimistic Store update → API call →
    Success: Keep optimistic state + show success flash
    Failure: Rollback store + show error flash
```

---

## Phase 6: セキュリティ & パフォーマンス

### 依存: Phase 5 完了 (機能面が安定してから)

| タスク | 詳細 | 参照 |
|--------|------|------|
| 6-1 | CSP の nonce 対応 | 09_SECURITY.md |
| 6-2 | OAuth PKCE 追加 | 09_SECURITY.md |
| 6-3 | API エンドポイントの認証強化 | 09_SECURITY.md |
| 6-4 | 入力バリデーション強化 (Discord snowflake) | 09_SECURITY.md |
| 6-5 | Server Islands: BotStats (LP) | 06_PERFORMANCE.md |
| 6-6 | Server Islands: GuildCard チャンネル数 | 06_PERFORMANCE.md |
| 6-7 | Prefetch 戦略の変更 (viewport → hover) | 06_PERFORMANCE.md |
| 6-8 | フォント最適化 (@fontsource) | 06_PERFORMANCE.md |
| 6-9 | 画像最適化 (Astro Image) | 06_PERFORMANCE.md |
| 6-10 | dict.ts の機能別分割 | 07_I18N.md |

---

## Phase 7: クリーンアップ

### 依存: Phase 6 完了

| タスク | 詳細 |
|--------|------|
| 7-1 | `dialog-helpers.ts` 削除 |
| 7-2 | `close-on-outside-click.ts` 削除 |
| 7-3 | `theme.ts` 削除 |
| 7-4 | 全 Astro コンポーネントから `<script>` タグ除去 |
| 7-5 | `astro:page-load` イベントハンドラ除去 |
| 7-6 | 不要な AbortController パターン除去 |
| 7-7 | `interface Props` → Zod schema (Base.astro 等) |
| 7-8 | Announcement ページの重複コンポーネント抽出 |
| 7-9 | 全 a11y チェックリスト確認 (08_ACCESSIBILITY.md) |
| 7-10 | 全セキュリティチェックリスト確認 (09_SECURITY.md) |
| 7-11 | テストカバレッジ 80%+ 確認 |

---

## 依存関係図

```
Phase 1 (基盤)
  │
  ├──→ Phase 2 (hooks & stores)
  │      │
  │      ├──→ Phase 3 (小 island)
  │      │      │
  │      │      └──→ Phase 4 (大 island)
  │      │             │
  │      │             └──→ Phase 5 (状態管理)
  │      │                    │
  │      │                    └──→ Phase 6 (セキュリティ & パフォーマンス)
  │      │                           │
  │      │                           └──→ Phase 7 (クリーンアップ)
```

## リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| React hydration mismatch | CLS, コンソールエラー | `client:only` を使うか、SSR で同じ初期値を渡す |
| Nano Store の SSR 互換性 | hydration エラー | Store の初期値を props 経由で設定 |
| View Transitions + React island | island のアンマウント/再マウント | `transition:persist` の適切な使用 |
| Astro Action の CSRF + React | 保護が効かない | Phase 4 は hidden form 維持、Phase 5 で `accept: "json"` |
| CSP nonce + Client Router | nonce 不一致 | Client Router 経由の遷移で nonce が更新されない → 長期で MPA 移行 |
| バンドルサイズ増加 | LCP 悪化 | React + ReactDOM は共有チャンク。島ごとのバンドル最適化 |

## 各 Phase の完了基準

| Phase | 完了基準 |
|-------|---------|
| 1 | React island がビルド・表示できる。テスト環境が動作する |
| 2 | 全 hooks/stores のユニットテストが通る |
| 3 | 小さい island がすべて動作。対応する vanilla JS が削除済み |
| 4 | フォーム系 island がすべて動作。hidden form 経由で Action が実行可能 |
| 5 | 楽観的UI が動作。PRG パターンが除去済み |
| 6 | Lighthouse スコア改善。セキュリティチェックリスト通過 |
| 7 | vanilla JS ファイルが全削除。テストカバレッジ 80%+ |
