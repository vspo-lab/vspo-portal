# アクセシビリティ設計ガイドライン

本ドキュメントは、本アプリケーションのアクセシビリティ設計ガイドラインを定義する。

## 目次

1. [準拠基準](#準拠基準)
2. [React Aria](#react-aria)
3. [現状分析](#現状分析)
4. [実装ガイドライン](#実装ガイドライン)
5. [コンポーネント別要件](#コンポーネント別要件)
6. [テスト方法](#テスト方法)
7. [チェックリスト](#チェックリスト)

---

## 準拠基準

### WCAG 2.2 Level AA

本プロジェクトは **WCAG 2.2 Level AA** への準拠を目標とする。

#### 4つの基本原則（POUR）

| 原則 | 説明 |
|------|------|
| **Perceivable（知覚可能）** | 情報やUIコンポーネントを知覚できる方法で提示 |
| **Operable（操作可能）** | UIコンポーネントとナビゲーションを操作可能に |
| **Understandable（理解可能）** | 情報とUIの操作を理解可能に |
| **Robust（堅牢）** | 支援技術を含む様々なユーザーエージェントで解釈可能 |

#### WCAG 2.2 新規基準（Level AA）

| 基準 | 説明 | 本プロジェクトへの影響 |
|------|------|----------------------|
| 2.4.11 フォーカス非隠蔽 | フォーカス要素がスティッキー要素で隠れない | ヘッダー/ナビゲーション設計 |
| 2.5.7 ドラッグ操作 | ドラッグに代替操作を提供 | 将来のD&D機能実装時 |
| 2.5.8 ターゲットサイズ | タッチターゲット24×24px以上 | 全インタラクティブ要素 |
| 3.2.6 一貫したヘルプ | ヘルプ機能の配置一貫性 | ヘルプ/サポート機能 |
| 3.3.7 冗長入力排除 | 同一情報の再入力防止 | フォーム設計 |
| 3.3.8 認証アクセシビリティ | 認知負荷の低い認証 | ログイン/認証フロー |

### 法的背景

- **欧州アクセシビリティ法（EAA）**: 2025年6月28日施行、EU圏でのサービス提供時に必須
- **ADA Title II**: 米国政府関連サイトでWCAG 2.1 AA必須
- **障害者差別解消法（日本）**: 合理的配慮の提供義務

---

## React Aria

本プロジェクトでは、アクセシビリティ対応に **React Aria** を使用する。

### React Aria とは

[React Aria](https://react-spectrum.adobe.com/react-aria/) は Adobe が開発したアクセシブルなUIコンポーネントライブラリ。50以上のコンポーネントとフックを提供し、以下の機能を内蔵している。

- **アクセシビリティ**: WCAG準拠のARIA属性、フォーカス管理、キーボード操作
- **国際化**: RTL、日付/数値フォーマット、翻訳対応
- **適応型インタラクション**: マウス、タッチ、キーボード、スクリーンリーダー対応
- **スタイル自由**: TailwindCSS等、任意のスタイリングソリューションと組み合わせ可能

### インストール

```bash
pnpm add react-aria-components
```

### 使用するコンポーネント

| コンポーネント | 用途 | 置き換え対象 |
|---------------|------|-------------|
| `Button` | ボタン | 独自Button |
| `TextField` | テキスト入力 | 独自Input |
| `Select` | セレクトボックス | 独自Select |
| `Modal` / `Dialog` | モーダル | InterruptReasonModal, SurveyModal |
| `Form` | フォーム | HTMLフォーム |
| `RadioGroup` | ラジオボタン群 | 独自実装 |
| `Checkbox` | チェックボックス | 独自実装 |
| `ProgressBar` | 進捗表示 | 独自実装 |

### 実装例

#### Button

```tsx
import { Button } from "react-aria-components";

export function PrimaryButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center
                 rounded-full bg-primary px-6 py-3 font-semibold text-white
                 transition duration-fast ease-standard
                 hover:bg-primary/90
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-ring focus-visible:ring-offset-2
                 disabled:opacity-60 disabled:cursor-not-allowed"
      {...props}
    >
      {children}
    </Button>
  );
}
```

#### TextField（Input）

```tsx
import { TextField, Label, Input, FieldError, Text } from "react-aria-components";

type TextFieldProps = {
  label: string;
  description?: string;
  errorMessage?: string;
  isRequired?: boolean;
};

export function FormTextField({ label, description, errorMessage, isRequired, ...props }: TextFieldProps) {
  return (
    <TextField isRequired={isRequired} {...props}>
      <Label className="font-medium text-sm">
        {label}
        {isRequired && <span className="text-error ml-1">*</span>}
      </Label>
      <Input
        className="mt-1 w-full rounded-2xl border bg-card px-4 py-3 text-sm
                   transition duration-fast ease-standard
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                   invalid:border-error"
      />
      {description && (
        <Text slot="description" className="mt-1 text-muted text-sm">
          {description}
        </Text>
      )}
      <FieldError className="mt-1 text-error text-sm" />
    </TextField>
  );
}
```

#### Select

```tsx
import {
  Select,
  Label,
  Button,
  SelectValue,
  Popover,
  ListBox,
  ListBoxItem,
} from "react-aria-components";
import { ChevronDown } from "lucide-react";

type SelectOption = { id: string; name: string };

type FormSelectProps = {
  label: string;
  items: SelectOption[];
  placeholder?: string;
};

export function FormSelect({ label, items, placeholder, ...props }: FormSelectProps) {
  return (
    <Select {...props}>
      <Label className="font-medium text-sm">{label}</Label>
      <Button className="mt-1 flex w-full items-center justify-between rounded-2xl
                         border bg-card px-4 py-3 text-sm
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <SelectValue className="truncate">
          {({ selectedText }) => selectedText || placeholder}
        </SelectValue>
        <ChevronDown className="h-4 w-4 text-muted" />
      </Button>
      <Popover className="w-[--trigger-width] rounded-xl border bg-card shadow-lg">
        <ListBox items={items} className="max-h-60 overflow-auto p-1">
          {(item) => (
            <ListBoxItem
              className="cursor-pointer rounded-lg px-3 py-2 text-sm
                         hover:bg-muted/10
                         focus:bg-muted/10 focus:outline-none
                         selected:bg-primary/10 selected:text-primary"
            >
              {item.name}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  );
}
```

#### Modal / Dialog

```tsx
import {
  DialogTrigger,
  Modal,
  Dialog,
  Heading,
  Button,
} from "react-aria-components";

type ConfirmDialogProps = {
  title: string;
  children: React.ReactNode;
  triggerLabel: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
};

export function ConfirmDialog({
  title,
  children,
  triggerLabel,
  confirmLabel = "確認",
  cancelLabel = "キャンセル",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <DialogTrigger>
      <Button className="...">{triggerLabel}</Button>
      <Modal
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        isDismissable
      >
        <Dialog className="mx-4 w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl
                          focus:outline-none">
          <Heading slot="title" className="font-bold text-lg">
            {title}
          </Heading>
          <div className="mt-4">{children}</div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              slot="close"
              className="rounded-full px-4 py-2 text-muted hover:bg-muted/10"
            >
              {cancelLabel}
            </Button>
            <Button
              onPress={onConfirm}
              className="rounded-full bg-primary px-4 py-2 text-white"
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}
```

#### RadioGroup

```tsx
import { RadioGroup, Radio, Label } from "react-aria-components";

type RadioOption = { value: string; label: string };

type FormRadioGroupProps = {
  label: string;
  options: RadioOption[];
  isRequired?: boolean;
};

export function FormRadioGroup({ label, options, isRequired, ...props }: FormRadioGroupProps) {
  return (
    <RadioGroup isRequired={isRequired} {...props}>
      <Label className="font-medium text-sm">{label}</Label>
      <div className="mt-2 space-y-2">
        {options.map((option) => (
          <Radio
            key={option.value}
            value={option.value}
            className="group flex cursor-pointer items-center gap-3"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2
                           group-selected:border-primary group-selected:bg-primary
                           group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <div className="h-2 w-2 rounded-full bg-white opacity-0
                             group-selected:opacity-100" />
            </div>
            <span className="text-sm">{option.label}</span>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
}
```

### フォーカス管理

React Aria は `useFocusRing` フックでフォーカスリングを管理する。

```tsx
import { useFocusRing, mergeProps } from "react-aria";

function CustomButton({ children, ...props }) {
  const ref = useRef(null);
  const { focusProps, isFocusVisible } = useFocusRing();
  const { buttonProps } = useButton(props, ref);

  return (
    <button
      {...mergeProps(buttonProps, focusProps)}
      ref={ref}
      className={cn(
        "rounded-full px-4 py-2",
        isFocusVisible && "ring-2 ring-ring ring-offset-2"
      )}
    >
      {children}
    </button>
  );
}
```

### スタイリング（TailwindCSS）

React Aria コンポーネントはデータ属性でステートを公開する。Tailwindで直接スタイリング可能。

```tsx
<Button className="
  bg-primary text-white
  hover:bg-primary/90
  pressed:scale-95
  focus-visible:ring-2
  disabled:opacity-50
">
  送信
</Button>
```

**利用可能なステート修飾子:**
- `hover:` - ホバー時
- `focus:` - フォーカス時
- `focus-visible:` - キーボードフォーカス時
- `pressed:` - 押下時
- `selected:` - 選択時
- `disabled:` - 無効時
- `invalid:` - バリデーションエラー時

### 移行ガイド

既存コンポーネントをReact Ariaに置き換える際の手順:

1. **Button**: `<button>` → `<Button>` に置き換え、`onClick` → `onPress`
2. **Input**: `<input>` → `<TextField>` + `<Input>` でラベル・エラー統合
3. **Select**: `<select>` → `<Select>` + `<ListBox>` でキーボード操作改善
4. **Modal**: 独自実装 → `<Modal>` + `<Dialog>` でフォーカストラップ自動化

---

## 現状分析

### 実装済み機能

| 機能 | 状態 | 備考 |
|------|------|------|
| `htmlFor`/`id` ペア | ✅ 良好 | フォーム要素の関連付け |
| `focus-visible` スタイル | ✅ 部分的 | Button, Input, Selectで実装 |
| `disabled` 属性対応 | ✅ 良好 | 視覚的フィードバックあり |
| `aria-label` | ⚠️ 限定的 | 一部要素のみ |
| `lang="ja"` | ✅ 良好 | ルートレイアウトで設定 |

### 改善が必要な機能

| 機能 | 優先度 | 対象 |
|------|--------|------|
| モーダルアクセシビリティ | 🔴 高 | フォーカストラップ、role、ESCキー |
| カラーコントラスト | 🔴 高 | coral色の改善 |
| `aria-describedby` | 🟡 中 | エラーメッセージ関連付け |
| `aria-required` | 🟡 中 | 必須フィールド明示 |
| スキップリンク | 🟡 中 | メインコンテンツへのジャンプ |
| キーボードナビゲーション | 🟡 中 | ナビゲーション要素のフォーカス |

---

## 実装ガイドライン

### 1. セマンティックHTML

適切なHTML要素を使用し、カスタム要素での再実装を避ける。

```tsx
// Good: セマンティックなHTML
<button onClick={handleClick}>送信</button>
<nav aria-label="メインナビゲーション">
  <ul>
    <li><a href="/home">ホーム</a></li>
  </ul>
</nav>

// Bad: div/spanでの代用
<div onClick={handleClick} role="button">送信</div>
```

### 2. フォームアクセシビリティ

#### ラベルの関連付け

```tsx
// 明示的なラベル（推奨）
<label htmlFor="email">メールアドレス</label>
<Input id="email" type="email" aria-describedby="email-error" />
{error && <p id="email-error" role="alert">{error}</p>}
```

#### 必須フィールド

```tsx
<label htmlFor="name">
  お名前 <span aria-hidden="true">*</span>
</label>
<Input
  id="name"
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby={error ? "name-error" : undefined}
/>
```

#### フィールドセット/レジェンド

関連するフォーム要素をグループ化する。

```tsx
<fieldset>
  <legend>就職活動の種別</legend>
  <label>
    <input type="radio" name="userType" value="individual" />
    個人
  </label>
  <label>
    <input type="radio" name="userType" value="business" />
    法人
  </label>
</fieldset>
```

### 3. モーダル/ダイアログ

モーダルは以下の要件を満たす必要がある。

```tsx
import { useCallback, useEffect, useRef } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function AccessibleModal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // フォーカストラップ
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // ESCキーで閉じる
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className="mx-4 w-full max-w-lg rounded-lg bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
```

### 4. フォーカス管理

#### フォーカスリングスタイル

```css
/* globals.css */
:focus-visible {
  outline: none;
  ring: 2px;
  ring-color: var(--color-ring);
  ring-offset: 2px;
}

/* フォーカスがスティッキー要素で隠れないように */
html {
  scroll-padding-top: 80px; /* ヘッダーの高さ + 余白 */
}

*:focus {
  scroll-margin-top: 100px;
}
```

#### スキップリンク

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4"
        >
          メインコンテンツへスキップ
        </a>
        <Header />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
```

### 5. カラーコントラスト

#### コントラスト比要件

| 用途 | 最小比率（AA） | 最小比率（AAA） |
|------|---------------|----------------|
| 通常テキスト | 4.5:1 | 7:1 |
| 大きいテキスト（18px以上） | 3:1 | 4.5:1 |
| UI要素/グラフィック | 3:1 | - |

#### 色定義の改善

```css
/* globals.css - エラー/警告色の改善 */
:root {
  /* 現在: coral (oklch 0.90) - コントラスト不足 */
  /* 改善: より暗い赤系 */
  --color-error: oklch(0.55 0.20 25);     /* 約 #D32F2F 相当 */
  --color-error-text: oklch(0.45 0.18 25); /* より暗い赤 */

  /* 成功色 */
  --color-success: oklch(0.50 0.15 145);   /* 約 #388E3C 相当 */

  /* 警告色 */
  --color-warning: oklch(0.55 0.15 85);    /* 約 #F57C00 相当 */
}
```

#### 色だけに依存しない設計

状態の変化は色以外の視覚的手がかりも併用する。

```tsx
// Good: 色 + アイコン + テキスト
<div className="flex items-center gap-2 text-error">
  <AlertCircleIcon aria-hidden="true" />
  <span>エラー: 入力内容を確認してください</span>
</div>

// Bad: 色のみ
<div className="text-red-500">入力内容を確認してください</div>
```

### 6. ターゲットサイズ

タッチターゲットは最小24×24px（推奨44×44px）を確保する。

```tsx
// Button コンポーネント
const buttonVariants = cva(
  "inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 py-2",
  // ...
);

// アイコンボタン
<button
  aria-label="設定を開く"
  className="flex h-11 w-11 items-center justify-center rounded-full"
>
  <SettingsIcon className="h-5 w-5" />
</button>
```

### 7. 動的コンテンツ

#### ライブリージョン

```tsx
// 操作結果の通知
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

// エラーメッセージ（即座に通知）
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

#### ローディング状態

```tsx
<button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? (
    <>
      <Spinner aria-hidden="true" />
      <span className="sr-only">読み込み中</span>
    </>
  ) : (
    "送信"
  )}
</button>
```

### 8. 画像とメディア

#### 代替テキスト

```tsx
// 意味のある画像
<img src="/avatar.png" alt="ユーザーのプロフィール画像" />

// 装飾的な画像
<img src="/decoration.svg" alt="" aria-hidden="true" />

// 複雑な画像
<figure>
  <img src="/chart.png" alt="2024年の売上推移グラフ" aria-describedby="chart-desc" />
  <figcaption id="chart-desc">
    1月から12月にかけて売上が20%増加
  </figcaption>
</figure>
```

#### 動画/音声

本アプリケーションでは音声認識・合成を使用するため、以下を提供する。

- 音声入力の視覚的フィードバック（波形表示）
- AI応答のテキスト表示（字幕機能）
- 音量調整機能

---

## コンポーネント別要件

### Button

```tsx
// shared/components/ui/button.tsx
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
```

**要件:**
- `min-h-[44px]` でターゲットサイズ確保
- `focus-visible` でフォーカスリング
- `disabled` 時の視覚的変化と `aria-disabled`
- アイコンのみの場合は `aria-label` 必須

### Input

```tsx
// shared/components/ui/input.tsx
type InputProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ id, label, error, required, ...props }: InputProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-error text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Select

```tsx
// shared/components/ui/select.tsx
type SelectProps = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  error?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ id, label, options, error, ...props }: SelectProps) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}
```

### Navigation

```tsx
// DesktopSideNav.tsx
<nav aria-label="メインナビゲーション">
  <ul role="list">
    {navItems.map((item) => (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          className="focus-visible:ring-2 focus-visible:ring-ring"
        >
          <item.icon aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      </li>
    ))}
  </ul>
</nav>
```

---

## テスト方法

### 自動テスト

| ツール | 用途 | 検出範囲 |
|--------|------|----------|
| axe-core | CI/CDでの自動チェック | 約40% |
| eslint-plugin-jsx-a11y | 静的解析 | 基本的な問題 |
| Lighthouse | パフォーマンス含む総合評価 | スコアベース |

#### axe-core 導入例

```tsx
// tests/accessibility.test.tsx
import { axe, toHaveNoViolations } from "jest-axe";
import { render } from "@testing-library/react";

expect.extend(toHaveNoViolations);

describe("Accessibility", () => {
  it("should have no accessibility violations", async () => {
    const { container } = render(<YourComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 手動テスト

#### キーボードテスト

1. `Tab` キーですべてのインタラクティブ要素に到達可能か
2. `Enter`/`Space` でボタンが動作するか
3. `Escape` でモーダルが閉じるか
4. フォーカスリングが常に視認可能か
5. フォーカス順序が論理的か

#### スクリーンリーダーテスト

| OS | スクリーンリーダー |
|----|-------------------|
| macOS | VoiceOver (組み込み) |
| Windows | NVDA (無料) / JAWS |
| iOS | VoiceOver |
| Android | TalkBack |

**チェック項目:**
- 見出し構造が正しく読み上げられるか
- フォームラベルが関連付けられているか
- 画像の代替テキストが適切か
- 動的コンテンツの変更が通知されるか

#### カラーコントラストテスト

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools > Rendering > Emulate vision deficiencies

---

## チェックリスト

### 開発時チェックリスト

#### HTML構造
- [ ] 適切な見出しレベル（h1→h2→h3）
- [ ] ランドマーク要素（header, nav, main, footer）
- [ ] リストは ul/ol を使用
- [ ] テーブルには caption と th を使用

#### フォーム
- [ ] すべての入力に label を関連付け
- [ ] 必須フィールドに `aria-required="true"`
- [ ] エラーに `aria-invalid` と `aria-describedby`
- [ ] エラーメッセージに `role="alert"`
- [ ] 適切な `autocomplete` 属性

#### インタラクティブ要素
- [ ] ボタンは `<button>` 要素を使用
- [ ] リンクは `<a>` 要素を使用
- [ ] カスタムコントロールに適切な `role`
- [ ] ターゲットサイズ 44×44px 以上
- [ ] `focus-visible` スタイル

#### モーダル/ダイアログ
- [ ] `role="dialog"` と `aria-modal="true"`
- [ ] `aria-labelledby` でタイトル関連付け
- [ ] フォーカストラップ実装
- [ ] ESC キーで閉じる
- [ ] 閉じた後に元の要素にフォーカス戻す

#### 画像/メディア
- [ ] 意味のある画像に代替テキスト
- [ ] 装飾的な画像に `alt=""` と `aria-hidden`
- [ ] 動画に字幕/キャプション

#### カラー
- [ ] テキストのコントラスト比 4.5:1 以上
- [ ] UI要素のコントラスト比 3:1 以上
- [ ] 色だけに依存しない情報伝達

### リリース前チェックリスト

- [ ] axe-core で自動テスト実行
- [ ] キーボードのみで全機能操作可能
- [ ] VoiceOver/NVDA でページ読み上げ確認
- [ ] 200%ズームでレイアウト崩れなし
- [ ] reduced-motion 設定時のアニメーション確認

---

## 参考リソース

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [React Aria](https://react-spectrum.adobe.com/react-aria/) - Adobe製アクセシブルUIライブラリ
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html) - コンポーネント一覧
- [MDN Accessibility](https://developer.mozilla.org/ja/docs/Web/Accessibility)
- [axe-core](https://github.com/dequelabs/axe-core)
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
