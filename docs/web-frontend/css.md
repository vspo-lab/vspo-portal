# Tailwind CSS ガイドライン

## 基本原則

### ユーティリティファーストの思想

Tailwindのユーティリティファーストとは、「全てのUIが下位コンポーネントの組み合わせでできている」わけではなく、**確信できない部分はユーティリティで書く**という思想である。コンポーネントとして抽象化するのは、再利用性と振る舞い（イベントハンドラ等）を含む場合のみ。

### 禁止事項

- `@apply` ディレクティブの使用
- Tailwind外でのCSSクラス定義（`@layer utilities` でのカスタムクラスも含む）
- `className` をpropsで受け取る設計（バリエーションは除く）
- CSSのみの抽象化（例: `.btn-primary`, `.surface-panel` のような定義）
- `globals.css` への新規 `@keyframes` 追加

### 許可事項

- UIコンポーネントとしての抽象化（ハンドラ等のロジックを含む）
- `cva` によるバリエーション定義
- `.prose` クラスの例外的な使用（リッチテキスト表示用）
- `@layer base` でのnormalize/reset処理
- `@theme` でのデザイントークン定義
- Tailwindビルトインアニメーション（`animate-spin`, `animate-pulse` 等）

### 設計目標

- デザイントークンを単一のソースとして管理（color, type, radius, motion）
- Tailwindをトークンファーストで使用し、コンポーネント内のarbitrary valueを削減
- shadcn/uiを共通プリミティブとして採用しつつ、ブランドのルックを維持
- 将来のテーマ対応（ダークモード、シーズナル）をコンポーネント改修なしで実現

## Design Tokens

### Token Architecture

| レイヤー | 説明 | 例 |
|----------|------|-----|
| Base palette | 生のカラー値のみ（意図なし） | `--palette-ink-900`, `--palette-coral-100` |
| Semantic tokens | 意図を表現 | `--token-canvas`, `--token-text`, `--token-border` |
| Component tokens | 特定コンポーネント用（必要時のみ） | `--token-dark-canvas` |
| Motion tokens | duration/easing | `--duration-fast`, `--ease-standard` |

### Tailwind v4 CSS-first 設定

`@theme` ディレクティブでトークンを定義し、ユーティリティとして公開:

```css
@theme {
  /* Colors - semantic tokens */
  --color-background: var(--token-canvas);
  --color-foreground: var(--token-text);
  --color-primary: var(--token-surface-ink);
  --color-accent: var(--token-accent);

  /* Typography */
  --font-body: "M PLUS Rounded 1c", sans-serif;
  --font-display: "Shippori Mincho B1", serif;

  /* Radius scale */
  --radius-sm: 0.5rem;
  --radius-md: 0.875rem;
  --radius-lg: 1.25rem;
  --radius-xl: 1.5rem;
  --radius-2xl: 2rem;
}
```

### カラーフォーマット

全てのカラーは `oklch()` フォーマットを使用（知覚的均一性のため）:

```css
:root {
  /* Base palette */
  --palette-ink-900: oklch(0.21 0.02 285);
  --palette-ink-800: oklch(0.28 0.02 285);
  --palette-coral-100: oklch(0.90 0.08 50);

  /* With alpha */
  --palette-line: oklch(0.21 0.03 285 / 0.12);
}
```

### カラーマッピング（JS側）

メンテナビリティのため、カラー定義はJS側でも参照可能にする:

```typescript
// shared/lib/design-tokens.ts
export const colors = {
  ink: {
    900: "oklch(0.21 0.02 285)",
    800: "oklch(0.28 0.02 285)",
  },
  coral: {
    100: "oklch(0.90 0.08 50)",
  },
} as const;
```

## Arbitrary Values の制限

**デザイン一貫性の核となる領域**では arbitrary value を禁止:

| 領域 | 禁止例 | 代替 |
|------|--------|------|
| Spacing | `p-[13px]`, `m-[7px]` | Tailwindスケール（`p-3`, `m-2`）を使用 |
| Font size | `text-[15px]` | `@theme` でトークン定義 |
| Border radius | `rounded-[10px]` | `--radius-*` トークンを使用 |
| Colors | `bg-[#ff6b6b]` | パレットに追加してから使用 |

**許可されるケース:**

- レイアウト固有の寸法（`w-[calc(100%-2rem)]`）
- アート的な背景・グラデーション
- 外部制約による固定値（例: 動画プレイヤーのアスペクト比）

```tsx
// NG: spacing/color での arbitrary value
<div className="p-[13px] bg-[#custom]">

// OK: 計算が必要なレイアウト
<div className="w-[calc(100%-var(--sidebar-width))]">

// OK: 一度きりのアート的背景
<div className="bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))]">
```

避けられない場合は、コンポーネントまたは近くのコメントで理由を文書化すること。

## コンポーネント設計

### cva によるバリエーション定義

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
  {
    variants: {
      intent: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-11 px-6 text-lg",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
    },
  }
);

type ButtonProps = VariantProps<typeof buttonVariants> & {
  onClick?: () => void;
  disabled?: boolean;
};
```

### tailwind-merge の使用

クラス名の衝突を防ぐため、条件付きクラスには必ず `cn` ユーティリティを使用:

```typescript
// shared/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
// 使用例
<div className={cn(
  "bg-card rounded-lg p-4",
  isActive && "ring-2 ring-primary",
)}>
```

### className props の扱い

**基本ルール:** `className` をpropsで受け取らない

```tsx
// NG: className を props で受け取る
interface CardProps {
  className?: string;
  children: ReactNode;
}

// OK: バリエーションで対応
interface CardProps {
  variant: "default" | "elevated" | "outlined";
  children: ReactNode;
}
```

**例外:** shadcn/ui のプリミティブをラップする場合は、内部実装として `className` を受け取ることがある

## shadcn/ui 採用ポリシー

### 使用するプリミティブ

Button, Input, Textarea, Select, Dialog, Tooltip, Popover, Tabs, Badge, Card, DropdownMenu

### ブランドラッパー

`shared/components/presenters` にshadcnプリミティブを組み合わせたラッパーを配置:

| ラッパー | ベース | 追加機能 |
|----------|--------|----------|
| `ActionButton` | Button | `href` propによるリンク対応 |
| `SurfaceCard` | Card | トーンバリアント（glass, soft, ink） |
| `TagPill` | Badge | 簡略化されたAPI |

### UIプリミティブ一覧

`shared/components/ui/` に配置:

| コンポーネント | バリアント | 備考 |
|----------------|------------|------|
| `Button` | primary, secondary, ghost / sm, md, lg | CVAベース |
| `Card` | - | ベースカードコンテナ |
| `Badge` | mint, sky, lilac, amber, coral, ink | カラートーン付き |
| `Input` | default, error | フォーム入力 |
| `Textarea` | default, error | 複数行テキスト |
| `Select` | default, error | ネイティブセレクトラッパー |
| `Chart` | - | Rechartsラッパー |

## Normalize / Reset

Tailwindの `@layer base` 内で行う:

```css
@layer base {
  :root {
    color-scheme: light;
  }

  html {
    font-family: var(--font-body);
  }

  body {
    background: var(--token-canvas);
    color: var(--token-text);
    text-rendering: optimizeLegibility;
  }

  button,
  [role="button"] {
    cursor: pointer;
  }

  button:disabled,
  [role="button"][aria-disabled="true"] {
    cursor: not-allowed;
  }

  h1, h2, h3, h4 {
    font-family: var(--font-display);
  }

  a {
    color: inherit;
  }
}
```

## アニメーション

### 推奨アプローチ

1. **UIライブラリ:** Framer Motion, React Spring
2. **JSベースのアニメーション:** GSAP, Anime.js
3. **Tailwindビルトイン:** `animate-spin`, `animate-pulse` 等

```tsx
// Framer Motion での例
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  Content
</motion.div>
```

### 禁止事項

- `globals.css` に新規 `@keyframes` を追加すること
- CSS-onlyのカスタムアニメーション定義

### 既存コードの移行

`globals.css` に存在する以下は**レガシー**として扱い、段階的にJSベースに移行する:

- `@keyframes fadeUp` → Framer Motion
- `@keyframes floaty` → Framer Motion
- `@keyframes softPulse` → Framer Motion
- `@layer utilities` 内のカスタムクラス → Reactコンポーネント化

## トークンカタログ

`@theme` で定義され、Tailwindユーティリティとして使用可能なトークン:

### Colors

| トークン | 用途 |
|----------|------|
| `bg-background` / `text-foreground` | メインキャンバス |
| `bg-primary` / `text-primary-foreground` | プライマリアクション |
| `bg-accent` / `text-accent-foreground` | アクセント |
| `bg-card` / `text-card-foreground` | カード背景 |
| `bg-dark-canvas` / `bg-dark-bar` | ダークモード専用 |

### Radius

| トークン | 値 |
|----------|-----|
| `rounded-sm` | 0.5rem |
| `rounded-md` | 0.875rem |
| `rounded-lg` | 1.25rem |
| `rounded-xl` | 1.5rem |
| `rounded-2xl` | 2rem |

### Shadow（CSS Variable経由）

| 変数 | 用途 |
|------|------|
| `--shadow-card` | 標準カード |
| `--shadow-action` | アクションボタン、目立つ要素 |
| `--shadow-hero` | ヒーローセクション、大きなカード |

使用例: `shadow-[var(--shadow-card)]` または Reactコンポーネントで `style={{ boxShadow: 'var(--shadow-card)' }}`

### Motion（CSS Variable経由）

| 変数 | 値 |
|------|-----|
| `--duration-fast` | 150ms |
| `--duration-md` | 300ms |
| `--ease-standard` | cubic-bezier(0.2, 0.7, 0.2, 1) |

## ファイル構成

```
services/web/
├── app/
│   └── globals.css          # @theme, @layer base, CSS Variables のみ
└── shared/
    ├── components/
    │   ├── ui/              # shadcn/ui プリミティブ (cva使用)
    │   └── presenters/      # ブランドラッパー
    └── lib/
        ├── utils.ts         # cn() ユーティリティ
        └── design-tokens.ts # JS側のカラーマッピング（任意）
```

### globals.css の許可内容

```css
/* 許可 */
@import "tailwindcss";
@theme { ... }
@layer base { ... }
:root { /* CSS Variables */ }

/* 禁止 */
@layer utilities { .custom-class { ... } }  /* カスタムクラス定義 */
@keyframes newAnimation { ... }              /* 新規アニメーション */
.my-class { ... }                            /* Tailwind外のクラス */
```

## ガードレール

- トークン名は安定版として扱う。公開後はトークン名ではなく使用箇所をリファクタする
- 新しいカラーは最初にパレットに追加し、次にセマンティックロールにマッピングする
- Tailwindデフォルトのspacingスケールを優先。繰り返し使う場合のみカスタムspacingを追加
- 新しいカラーは全て `oklch()` フォーマットで記述する

## チェックリスト

新しいスタイルを追加する際:

- [ ] arbitrary value がデザイン一貫性の核となる領域で使われていないか
- [ ] `@apply` を使っていないか
- [ ] `@layer utilities` でカスタムクラスを定義していないか
- [ ] コンポーネントは振る舞い（ハンドラ等）を含んでいるか（CSSのみの抽象化になっていないか）
- [ ] バリエーションは `cva` で定義されているか
- [ ] 条件付きクラスは `cn()` を使っているか
- [ ] 新しいカラーは `oklch()` フォーマットか
- [ ] 既存のUIプリミティブ（`ActionButton`, `SurfaceCard`, `TagPill`）で対応できないか確認したか

## 参考リンク

- [Tailwind CSS v4 - Adding Custom Styles](https://tailwindcss.com/docs/adding-custom-styles)
- [Class Variance Authority](https://cva.style/docs)
- [tailwind-merge](https://github.com/dcastil/tailwind-merge)
- [5 Best Practices for Preventing Chaos in Tailwind CSS](https://evilmartians.com/chronicles/5-best-practices-for-preventing-chaos-in-tailwind-css)
