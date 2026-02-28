# デザイントークン

## 概要

デザイントークンは、デザイナーとエンジニア間の共通言語として機能し、一貫性のあるUIを効率的に構築するための基盤です。本ガイドラインでは、トークンの種類と使用方法を定義します。

## トークンアーキテクチャ

**3層トークン構造**を採用しています：

```
Base Palette → Semantic Tokens → Component Tokens
```

1. **Base Palette**: 生のカラー値（OKLch形式）
2. **Semantic Tokens**: 意図を表現するトークン（`--token-*`）
3. **Component Tokens**: Tailwindで使用する最終トークン（`--color-*`）

### OKLch カラーフォーマット

すべてのカラーは知覚的均一性のため **OKLch** 形式で定義します：

```css
oklch(L C H / A)
/* L: 明度 (0-1), C: 彩度 (0-0.4), H: 色相 (0-360), A: 透明度 */
```

OKLchの利点：
- 知覚的に均一な明度スケール
- アルファブレンドが直感的
- CSSで直接計算可能

---

## トークンの種類

### 1. Base Palette（プリミティブトークン）

具体性のある値であり、最も低レイヤーで原子的な意味を持つトークンです。

```css
/* ニュートラル */
--palette-ink-900: oklch(...);    /* ダークテキスト */
--palette-ink-800: oklch(...);    /* ソフトテキスト */
--palette-ink-500: oklch(...);    /* ミュートテキスト */
--palette-cream-50: oklch(...);   /* 背景 */
--palette-white: oklch(1 0 0);    /* 純白 */

/* アクセントカラー */
--palette-accent-100: oklch(...); /* 主要アクセント */
--palette-info-100: oklch(...);   /* 情報 */
--palette-warning-100: oklch(...);/* 警告 */
--palette-success-100: oklch(...);/* 成功 */

/* ソフトバリアント（透明度付き）*/
--palette-line: oklch(... / 0.3);
```

### 2. Semantic Tokens（セマンティックトークン）

特定のコンテキストに関連した値であり、トークンの意図した目的を伝えます。

```css
/* 背景 */
--token-canvas: var(--palette-cream-50);   /* メイン背景 */
--token-surface: var(--palette-white);     /* カード/パネル背景 */

/* テキスト */
--token-text: var(--palette-ink-900);      /* プライマリテキスト */
--token-text-soft: var(--palette-ink-800); /* セカンダリテキスト */
--token-text-muted: var(--palette-ink-500);/* ミュートテキスト */

/* ボーダー */
--token-border: var(--palette-line);

/* アクセント */
--token-accent: var(--palette-accent-100);

/* 状態カラー */
--token-info: var(--palette-info-100);
--token-warning: var(--palette-warning-100);
--token-success: var(--palette-success-100);
```

### 3. Component Tokens（Tailwind用トークン）

`@theme` ディレクティブで定義され、Tailwindユーティリティとして使用できます。

```css
/* 背景 */
--color-background: var(--token-canvas);
--color-card: var(--token-surface);

/* テキスト */
--color-foreground: var(--token-text);
--color-foreground-soft: var(--token-text-soft);
--color-muted-foreground: var(--token-text-muted);

/* アクセント */
--color-accent: var(--token-accent);

/* 状態 */
--color-info: var(--token-info);
--color-warning: var(--token-warning);
--color-success: var(--token-success);

/* ボーダー */
--color-border: var(--token-border);
```

---

## レディアストークン

角丸のスケールを定義します。

| トークン | 値 | 用途 |
|----------|-----|------|
| `--radius-sm` | 0.5rem (8px) | 小さな要素、チップ |
| `--radius-md` | 0.875rem (14px) | 標準要素、ボタン |
| `--radius-lg` | 1.25rem (20px) | カード、パネル |
| `--radius-xl` | 1.5rem (24px) | 大きなパネル |
| `--radius-2xl` | 2rem (32px) | モーダル、大きなカード |

---

## シャドウトークン

エレベーション（浮遊感）を表現するシャドウです。

| トークン | 用途 |
|----------|------|
| `--shadow-card` | カード、軽い浮遊感 |
| `--shadow-action` | ボタン、インタラクティブ要素 |
| `--shadow-hero` | ヒーロー要素、強調 |
| `--shadow-focus` | フォーカスリング |

---

## モーショントークン

| トークン | 値 | 用途 |
|----------|-----|------|
| `--duration-fast` | 150ms | 即座のフィードバック（ホバー、フォーカス）|
| `--duration-md` | 300ms | 標準トランジション（パネル開閉）|
| `--ease-standard` | cubic-bezier(0.2, 0.7, 0.2, 1) | 標準イージング |

---

## タイポグラフィトークン

| トークン | 用途 |
|----------|------|
| `--font-body` | 本文テキスト |
| `--font-display` | 見出し（h1-h4）|

---

## トークンの使用方法

### Tailwind CSSでの使用

`@theme` ディレクティブで定義されたトークンは、Tailwindユーティリティとして使用できます。

```tsx
// 背景色
<div className="bg-background" />
<div className="bg-card" />

// テキスト色
<p className="text-foreground" />
<p className="text-muted-foreground" />

// ボーダー
<div className="border border-border" />

// 角丸
<div className="rounded-lg" />
<div className="rounded-2xl" />

// シャドウ
<div className="shadow-card" />
```

### CSS変数としての使用

```css
.custom-element {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  transition: all var(--duration-fast) var(--ease-standard);
}
```

---

## トークン設計のガイドライン

### 命名規則

```
--{layer}-{category}-{variant}

例:
--palette-ink-900      (Base Palette)
--token-text-soft      (Semantic Token)
--color-foreground     (Component Token)
```

### 新しいトークンの追加

1. **プリミティブの追加**: まず `--palette-*` に値を追加
2. **セマンティックの作成**: `--token-*` で意図を表現
3. **Tailwind公開**: 必要に応じて `@theme` で `--color-*` を定義
4. **ドキュメント化**: 本ドキュメントに追記

### 禁止事項

- ハードコードされた値の直接使用（トークン経由で使用する）
- 既存トークンの値の上書き
- 意味のない略語の使用
- Tailwind標準色（`bg-blue-500` など）の直接使用

---

## 参考リンク

- [CSS ガイドライン](../web-frontend/css.md)
- [カラーガイドライン](./colors.md)
- [タイポグラフィガイドライン](./typography.md)
- [ユーティリティクラス](./utilities.md)
