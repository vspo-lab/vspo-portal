# 全コンポーネント改善点

## Channel Feature (`features/channel/`)

### ChannelTable.astro (172行)

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **Islands** | Edit/Delete ボタンが `data-action-*` 属性で vanilla JS に依存 | React island の props callback に変更 |
| **a11y** | テーブルに `aria-label` なし | `aria-label="Channel configurations"` |
| **a11y** | アクションボタンに `aria-label` なし | `aria-label="Edit {channelName}"` |
| **a11y** | ステータスインジケータが色のみ | アイコン + テキストラベル追加 |
| **UX** | カスタムメンバーのアバターオーバーフロー (+N) がクリック不可 | ツールチップまたはポップオーバーで全メンバー表示 |
| **UX** | ソート機能なし | チャンネル名、言語、タイプでソート |
| **レスポンシブ** | モバイルでテーブルが横スクロール | カード表示に切り替え (`<dl>` ベース) |
| **パフォーマンス** | チャンネル数が多い場合の全件レンダリング | 仮想スクロールまたはページネーション |

### ChannelConfigForm.astro (600行 — 最大のコンポーネント)

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **Islands** | 320行の vanilla JS | React `ChannelConfigModal` に完全移行 |
| **コード品質** | Astro コンポーネント部分とスクリプト部分が混在 | Astro wrapper (server data) + React island (client UI) に分離 |
| **状態管理** | DOM 操作で状態管理 | `useReducer` で ConfigFormState を管理 |
| **バリデーション** | クライアント側バリデーションなし | Zod schema + リアルタイムバリデーション |
| **a11y** | radio group に `role="radiogroup"` なし | WAI-ARIA radio group パターン |
| **a11y** | custom member dropdown の keyboard navigation なし | `aria-expanded`, `aria-activedescendant`, arrow key navigation |
| **a11y** | chip の削除ボタンに label なし | `aria-label="Remove {memberName}"` |
| **a11y** | focus trap が dialog 内で実装されていない | `useDialog` hook で focus trap |
| **UX** | 検索フィルタのデバウンスなし | 300ms デバウンス |
| **UX** | 保存ボタンの disabled 判定が不完全 | 変更検知 (dirty check) による disabled 制御 |
| **UX** | リセット確認なし | 変更がある場合の確認ダイアログ |
| **型安全性** | フォームデータの型が暗黙的 | ConfigFormState 型 + Zod schema |

### ChannelAddModal.astro (215行)

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **Islands** | 110行の vanilla JS + template clone | React `ChannelAddModal` に移行 |
| **UX** | ローディング状態が不十分 | Skeleton UI + loading spinner |
| **UX** | エラー状態の表示 | fetch 失敗時の retry ボタン |
| **UX** | 追加済みチャンネルの表示 | グレーアウト + "already registered" ラベル |
| **a11y** | 検索入力に `aria-label` なし | `aria-label="Search channels"` |
| **a11y** | チャンネルリストが `role="listbox"` でない | listbox パターン適用 |
| **パフォーマンス** | 毎回 API fetch | キャッシュ + stale-while-revalidate |

### DeleteChannelDialog.astro (111行)

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **Islands** | 30行の vanilla JS | React `DeleteChannelDialog` に移行 |
| **UX** | 削除確認が簡素 | チャンネル名の入力確認 (destructive action protection) |
| **a11y** | dialog の `aria-labelledby` / `aria-describedby` | 適切な ID 参照設定 |
| **a11y** | focus が削除ボタンに自動移動しない | キャンセルボタンに初期 focus |
| **エラー** | 削除失敗時のフィードバック | inline error message |

---

## Auth Feature (`features/auth/`)

### UserMenu.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **Islands** | `<details data-auto-close>` + global JS | React `UserMenu` island (`client:idle`) |
| **a11y** | `<details>` が menu パターンに適さない | `role="menu"` + `aria-expanded` + keyboard navigation |
| **UX** | アバター画像の fallback | `AvatarFallback` コンポーネントのイニシャル表示 |
| **UX** | LanguageSelector と ThemeToggle が menu 内にネスト | React 化で子コンポーネントとして統合 |
| **セキュリティ** | logout が `<form>` POST | 良い。維持する |

---

## Shared Feature (`features/shared/`)

### Header.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **構造** | slot でサイドバートグルを受け取る | 維持（良いパターン） |
| **a11y** | skip-to-content リンクが Base.astro にある | Header 内に移動して一貫性確保 |
| **レスポンシブ** | モバイルナビゲーションが Dashboard.astro 側 | Header 内に統合検討 |

### Footer.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **SEO** | 構造化データなし | `<footer role="contentinfo">` 確認 |
| **a11y** | リンクの `aria-label` | 外部リンクに `rel="noopener noreferrer"` 確認 |
| **i18n** | フッターテキストの翻訳 | dict.ts に追加 |

### Button.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **構造** | 6 variants + 4 sizes は良い設計 | 維持 |
| **a11y** | `disabled` 属性サポート | `aria-disabled` も併用 |
| **UX** | loading state なし | `isLoading` prop + spinner icon |
| **型安全性** | `as="a"` の型 | polymorphic component の型改善 |

### IconButton.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **a11y** | `aria-label` 必須の強制なし | props で `aria-label` を required に |
| **a11y** | アイコンのみボタンのタッチターゲット | 最小 44x44px 確保 |

### Card.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **構造** | 汎用カード。問題なし | 維持 |
| **a11y** | カードがインタラクティブな場合のセマンティクス | `role="link"` or `<a>` wrapper |

### FlashMessage.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **Islands** | CSS animation + 5行 JS | React `FlashMessage` island (`client:idle`) |
| **a11y** | `role="status"` + `aria-live="polite"` 確認 | `role="alert"` for error type |
| **UX** | dismiss ボタンなし | 手動 dismiss + auto-dismiss |
| **UX** | 複数 flash の表示 | toast stack パターン |

### ErrorAlert.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **a11y** | `role="alert"` 確認 | `aria-live="assertive"` for errors |
| **UX** | リトライアクションなし | `onRetry` callback 追加 |

### ThemeToggle.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **Islands** | 12行 JS + theme.ts import | React `ThemeToggle` island (`client:load`) |
| **a11y** | toggle 状態の `aria-pressed` | `aria-pressed={isDark}` |
| **UX** | system preference 追従 | `prefers-color-scheme` media query 対応 + "system" option |

### LanguageSelector.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **Islands** | header variant が `<details>` + global JS | React island (`client:idle`) |
| **構造** | 2 variants (header, dropdown) | variant prop で統合 or 別コンポーネント |
| **UX** | セッションベースのロケール切替 | Astro i18n URL ベースルーティングに移行 |
| **a11y** | `<details>` が listbox パターンに適さない | `role="listbox"` + `aria-selected` |

### MenuItem.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **構造** | 静的メニュー項目 | 維持 |
| **a11y** | `role="menuitem"` | 親要素の `role="menu"` との整合性確認 |

### AvatarFallback.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **構造** | 画像 fallback | 維持 |
| **a11y** | `alt` テキスト | ユーザー名を含む alt テキスト |
| **UX** | イニシャル表示 | SVG ベースのイニシャルアバター |

### dialog-helpers.ts (vanilla JS — 削除対象)

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **全体** | React 移行後は不要 | `useDialog` hook に置換後、削除 |

### close-on-outside-click.ts (vanilla JS — 削除対象)

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **全体** | React 移行後は不要 | `useClickOutside` hook に置換後、削除 |

### theme.ts (vanilla JS — 削除対象)

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **全体** | React 移行後は不要 | Nano Store `$theme` + `useTheme` hook に置換後、削除 |

---

## Guild Feature (`features/guild/`)

### GuildCard.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **構造** | サーバーレンダリングで完結 | 維持 |
| **Server Islands** | チャンネル数の取得がページ全体を遅延 | `server:defer` で遅延表示 |
| **UX** | Bot 未インストールギルドの CTA | 招待リンクの表示改善 |
| **a11y** | カードリンクのフォーカス表示 | `focus-visible` リング |

---

## Landing Feature (`features/landing/`)

### FeaturePopup.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **Islands** | index.astro の script で制御 | `FeatureShowcase` React island に統合 |
| **a11y** | dialog の focus trap なし | `useDialog` hook |
| **a11y** | close ボタンの `aria-label` | `aria-label="Close"` |
| **UX** | 画像プレースホルダ | 実際のスクリーンショットまたはイラスト |

### ScrollReveal.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **パフォーマンス** | CSS-only で良い | 維持 |
| **a11y** | `prefers-reduced-motion` 対応 | `@media (prefers-reduced-motion: reduce)` でアニメーション無効化 |

### DigitRoll.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **パフォーマンス** | CSS-only アニメーション | 維持 |
| **a11y** | 読み上げ対応 | `aria-label` で数値全体を読み上げ、個別数字は `aria-hidden` |
| **a11y** | `prefers-reduced-motion` 対応 | アニメーションなしで即表示 |

---

## Layouts

### Base.astro

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **セキュリティ** | テーマ初期化が `is:inline` | FOUC 防止のため維持。ただしCSP `unsafe-inline` が必要 |
| **パフォーマンス** | Google Fonts のプリロード | フォント表示戦略: `font-display: swap` 確認 |
| **a11y** | `<html lang>` がロケールに連動 | 確認・修正 |
| **SEO** | alternate/hreflang なし | `<link rel="alternate" hreflang="en">` 追加 |
| **型安全性** | `interface Props` 使用 | Zod schema に移行 (プロジェクト規約) |

### Dashboard.astro (140行)

| カテゴリ | 問題 | 改善案 |
|---------|------|--------|
| **構造** | サイドバー + メインコンテンツ | 維持 |
| **Islands** | モバイルハンバーガーメニューが `<details>` | React island に移行検討 |
| **a11y** | サイドバーの `nav` + `aria-label` | `aria-label="Dashboard navigation"` |
| **a11y** | active route の `aria-current="page"` | 追加 |
| **レスポンシブ** | サイドバーの表示/非表示 | CSS `@container` queries 検討 |
| **UX** | サイドバーの折りたたみ状態が永続化されない | localStorage でサイドバー状態保存 |
