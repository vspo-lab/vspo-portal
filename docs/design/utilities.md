# ユーティリティクラス

## 概要

`globals.css` の `@layer utilities` で定義されているカスタムユーティリティクラスです。Tailwind CSS の標準ユーティリティを補完し、プロジェクト固有のスタイルを提供します。

---

## テキストユーティリティ

### text-balance

テキストの行末のバランスを調整し、より美しい組版を実現します。

```css
.text-balance {
  text-wrap: balance;
}
```

**使用場面**: 見出し、キャッチコピーなど短いテキスト

### text-2xs / text-3xs

Tailwind 標準より小さいテキストサイズ。

| クラス | サイズ | 行高さ | 用途 |
|--------|--------|--------|------|
| `text-2xs` | 0.7rem (11.2px) | 1rem | 小さなラベル、補足情報 |
| `text-3xs` | 0.65rem (10.4px) | 0.9rem | 極小テキスト、タイムスタンプ |

---

## アニメーションユーティリティ

### animate-fade-up / animate-fade-up-slow

下から上へフェードインするアニメーション。

| クラス | 時間 | 用途 |
|--------|------|------|
| `animate-fade-up` | 0.8s | 標準的なフェードイン |
| `animate-fade-up-slow` | 1.2s | ゆっくりしたフェードイン |

```tsx
<div className="animate-fade-up">
  コンテンツがフェードインします
</div>
```

### animate-floaty

上下に浮遊するアニメーション（無限ループ）。

```css
.animate-floaty {
  animation: floaty 8s ease-in-out infinite;
}
```

**使用場面**: ヒーローセクションのアバター、装飾要素

### animate-soft-pulse

ソフトなパルスアニメーション（無限ループ）。

```css
.animate-soft-pulse {
  animation: softPulse 2.8s ease-in-out infinite;
}
```

**使用場面**: CTAボタン、注目を引く要素

### animate-fade-in

シンプルなフェードインアニメーション。

```css
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

**使用場面**: モーダル、ツールチップの表示

---

## シャドウユーティリティ

| クラス | 用途 | 値 |
|--------|------|-----|
| `shadow-card` | カード、パネル | `var(--shadow-card)` |
| `shadow-action` | ボタン、インタラクティブ要素 | `var(--shadow-action)` |
| `shadow-hero` | ヒーロー要素、強調 | `var(--shadow-hero)` |

```tsx
<div className="shadow-card">カード</div>
<button className="shadow-action">ボタン</button>
```

---

## モーションユーティリティ

| クラス | 値 | 用途 |
|--------|-----|------|
| `duration-fast` | 150ms | ホバー、フォーカス |
| `duration-md` | 300ms | パネル開閉、状態変化 |
| `ease-standard` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | 標準イージング |
| `transition-width` | `width` | 幅のトランジション |

```tsx
<div className="transition-width duration-fast ease-standard">
  幅がスムーズに変化
</div>
```

---

## サーフェスユーティリティ

半透明背景とボーダーを持つパネルスタイル。

### surface-panel / surface-panel-compact / surface-panel-input

| クラス | フォントサイズ | 背景透明度 | 用途 |
|--------|--------------|----------|------|
| `surface-panel` | 0.875rem | 80% | 標準パネル |
| `surface-panel-compact` | 0.75rem | 80% | コンパクトパネル |
| `surface-panel-input` | 0.75rem | 90% | 入力フィールド風 |

```css
.surface-panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  background-color: color-mix(in srgb, var(--color-card) 80%, transparent);
  padding: 0.75rem 1rem;
}
```

### input-surface

入力フィールド用のサーフェス。

```css
.input-surface {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  background-color: color-mix(in srgb, var(--color-card) 90%, transparent);
  padding: 0.75rem 1rem;
}
```

### surface-info / surface-alert

情報・アラート表示用のサーフェス。

| クラス | 背景色 | 用途 |
|--------|--------|------|
| `surface-info` | `var(--color-info-soft)` | 情報パネル |
| `surface-alert` | `var(--color-accent-soft)` | アラートパネル |

### surface-metric / surface-metric-lg

メトリクス表示用のサーフェス。

| クラス | パディング | 用途 |
|--------|----------|------|
| `surface-metric` | 0.5rem 0.75rem | 小さなメトリクス |
| `surface-metric-lg` | 0.75rem | 大きなメトリクス |

---

## ピル/バッジユーティリティ

### pill-outline

アウトラインスタイルのピル。

```css
.pill-outline {
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  background-color: color-mix(in srgb, var(--color-card) 80%, transparent);
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
}
```

### field-surface

フォームフィールド用のサーフェス。

```css
.field-surface {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background-color: var(--color-card);
  padding: 0.5rem 0.75rem;
}
```

---

## ビデオUI専用ユーティリティ

ビデオオーバーレイで使用する専用クラス。

### badge-video-overlay

```css
.badge-video-overlay {
  border-radius: 9999px;
  background-color: oklch(0 0 0 / 0.5);
  padding: 0.25rem 0.75rem;
  font-size: 0.7rem;
  color: oklch(1 0 0 / 0.8);
  backdrop-filter: blur(4px);
}
```

**使用場面**: ビデオ上のタイムスタンプ、ステータス表示

### badge-alert

パルスアニメーション付きのアラートバッジ。

```css
.badge-alert {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  background-color: oklch(0.63 0.24 25 / 0.8);
  color: oklch(1 0 0);
  font-weight: 700;
  backdrop-filter: blur(4px);
}
```

**使用場面**: 重要な警告、制限時間超過

### badge-speaking

発話中を示すバッジ。

```css
.badge-speaking {
  background-color: oklch(0.70 0.17 162);
  box-shadow: var(--shadow-action);
}
```

**使用場面**: ユーザーまたはAIが発話中であることを示す

### badge-name / badge-name-sm

名前表示用のバッジ。

| クラス | フォントサイズ | 用途 |
|--------|--------------|------|
| `badge-name` | 0.875rem | 標準の名前表示 |
| `badge-name-sm` | 0.75rem | 小さな名前表示 |

### overlay-panel-dark / overlay-panel-alert

オーバーレイパネル。

| クラス | 背景色 | 用途 |
|--------|--------|------|
| `overlay-panel-dark` | `oklch(0 0 0 / 0.7)` | 暗いオーバーレイ |
| `overlay-panel-alert` | `oklch(0.63 0.24 25 / 0.9)` | アラート用オーバーレイ |

### badge-pose-feedback

姿勢フィードバック用のバッジ。

```css
.badge-pose-feedback {
  background-color: oklch(0.55 0.18 250 / 0.85);
  box-shadow: 0 2px 8px oklch(0 0 0 / 0.3);
  backdrop-filter: blur(4px);
}
```

**使用場面**: 姿勢に関するリアルタイムフィードバック

---

## レイアウトユーティリティ

| クラス | 値 | 用途 |
|--------|-----|------|
| `min-h-stage` | 80vh | ヒーローセクション |
| `min-w-pricing-table` | 600px | 価格表の最小幅 |
| `min-h-answer` | 140px | 回答エリア |
| `min-h-suspense` | 60vh | ローディング状態 |
| `min-h-textarea` | 150px | テキストエリア |
| `min-w-action-btn` | 120px | アクションボタン |
| `max-w-chat-bubble` | 80% | チャットバブル |
| `aspect-avatar` | 4:5 | アバター表示 |

```tsx
<section className="min-h-stage">
  ヒーローセクション
</section>

<div className="aspect-avatar">
  <img src="/avatar.png" alt="アバター" />
</div>
```

---

## グリッドユーティリティ

### lg:grid-cols-mic-check

マイクチェックページ専用のグリッドレイアウト。

```css
@media (min-width: 1024px) {
  .lg\:grid-cols-mic-check {
    grid-template-columns: 1.1fr 0.9fr;
  }
}
```

---

## 背景ユーティリティ

### bg-app-gradient

アプリケーション全体で使用するグラデーション背景。

```css
.bg-app-gradient {
  background: radial-gradient(
      45% 45% at 10% 8%,
      rgba(255, 215, 194, 0.55),
      transparent 70%
    ),
    radial-gradient(
      50% 40% at 85% 12%,
      rgba(215, 230, 255, 0.6),
      transparent 72%
    ),
    radial-gradient(
      42% 40% at 70% 88%,
      rgba(231, 244, 239, 0.7),
      transparent 70%
    ),
    linear-gradient(160deg, #fbf6ef 0%, #f4f0ff 100%);
}
```

**使用場面**: ランディングページ、オンボーディング

---

## 参考

- [デザイントークン](./design-tokens.md)
- [CSS ガイドライン](../css.md)
- [アクセシビリティ](../accessibility.md)
