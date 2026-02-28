# タイポグラフィガイドライン

## 概要

プロジェクトの目的やブランドに合わせたフォントを選択してください。

## フォント選択の原則

### 本文フォント

可読性が高く、長文でも疲れにくいフォントを選択します。

```css
--font-body: "your-body-font", system-ui, sans-serif;
```

### 見出しフォント

ブランドの個性を表現するフォントを選択します。本文フォントとの対比でメリハリを出します。

```css
--font-display: "your-display-font", system-ui, serif;
```

## Google Fonts 読み込み

```css
@import url("https://fonts.googleapis.com/css2?family=YOUR_FONT:wght@400;500;700&display=swap");
```

## ウェイト

最低限以下のウェイトを用意してください：

| 用途 | 推奨ウェイト |
|------|-------------|
| 本文 | 400 (Regular) |
| 強調 | 500 (Medium) or 700 (Bold) |
| 見出し | 600 (SemiBold) or 700 (Bold) |

## 適用ルール

- `h1` ~ `h4`: `--font-display`
- その他: `--font-body`

```css
h1, h2, h3, h4 {
  font-family: var(--font-display);
}
```

## テキストサイズユーティリティ

| クラス | サイズ | 用途 |
|--------|--------|------|
| `text-3xs` | 0.65rem (10.4px) | 極小テキスト |
| `text-2xs` | 0.7rem (11.2px) | 小さなラベル |
| `text-xs` | 0.75rem (12px) | キャプション |
| `text-sm` | 0.875rem (14px) | 小さな本文 |
| `text-base` | 1rem (16px) | 標準本文 |

## 禁止事項

- 10px未満のフォントサイズを使用すること（可読性の確保）
- 行間を1.4未満に設定すること（日本語テキストの可読性）
