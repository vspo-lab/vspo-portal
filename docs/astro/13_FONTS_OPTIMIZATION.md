# フォント最適化

## 現状

- Google Fonts を `<link>` タグで外部読み込み (`Noto Sans JP`, `M PLUS Rounded 1c`)
- CSP に `https://fonts.googleapis.com` / `https://fonts.gstatic.com` を許可
- CSS 変数でフォントスタック定義:
  - `--font-sans: "Noto Sans JP", "Hiragino Kaku Gothic Pro", system-ui, sans-serif`
  - `--font-heading: "M PLUS Rounded 1c", "Noto Sans JP", sans-serif`

## 課題

1. **外部リクエスト**: Google Fonts CDN への往復がレンダリングブロック要因
2. **CSP の緩和**: `fonts.googleapis.com` / `fonts.gstatic.com` をホワイトリストに追加する必要がある
3. **FOUT/FOIT**: フォント読み込み中のレイアウトシフト
4. **最適化不足**: 必要なウェイトのみ選択的に読み込む仕組みがない

## 改善: Astro 6 `fonts` 設定

Astro 6 で追加された組み込みフォント管理機能を使用する。フォントファイルはビルド時にダウンロードされ、セルフホストされる。

### 設定例

```typescript
// astro.config.ts
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Noto Sans JP",
      cssVariable: "--font-sans",
      weights: ["400", "500", "700"],
      fallbacks: ["Hiragino Kaku Gothic Pro", "system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "M PLUS Rounded 1c",
      cssVariable: "--font-heading",
      weights: ["700", "800"],
      fallbacks: ["Noto Sans JP", "sans-serif"],
    },
  ],
});
```

### メリット

| 項目 | Before | After |
|------|--------|-------|
| フォント配信 | Google CDN (外部) | セルフホスト (_astro/) |
| CSP | `fonts.googleapis.com` 許可必要 | `'self'` のみで OK |
| CLS | FOUT/FOIT あり | `optimizedFallbacks` で自動軽減 |
| リクエスト | 別ドメインへの往復 | 同一オリジン |

### Optimized Fallbacks

デフォルトで有効。Astro がフォントメトリクスを分析し、ローカルフォールバックのサイズを自動調整して CLS を最小化する。

```typescript
{
  name: "Noto Sans JP",
  cssVariable: "--font-sans",
  optimizedFallbacks: true, // デフォルト: true
}
```

### ローカルフォントの使用

Google Fonts 以外のローカルフォントファイルも同じ API で管理可能:

```typescript
{
  provider: fontProviders.local(),
  name: "CustomFont",
  cssVariable: "--font-custom",
  options: {
    variants: [{
      src: ["./src/assets/fonts/CustomFont.woff2"],
      weight: "normal",
      style: "normal",
    }],
  },
}
```

### 利用可能なプロバイダー

| プロバイダー | 用途 |
|-------------|------|
| `fontProviders.google()` | Google Fonts |
| `fontProviders.fontsource()` | Fontsource (OSS fonts) |
| `fontProviders.adobe()` | Adobe Fonts |
| `fontProviders.bunny()` | Bunny Fonts (GDPR 準拠) |
| `fontProviders.local()` | ローカルフォントファイル |

## CSS 変数の変更

`app.css` のフォント変数定義は Astro `fonts` 設定が自動生成するため不要になる:

```css
/* Before: 手動定義 */
:root {
  --font-sans: "Noto Sans JP", "Hiragino Kaku Gothic Pro", system-ui, sans-serif;
  --font-heading: "M PLUS Rounded 1c", "Noto Sans JP", sans-serif;
}

/* After: Astro fonts が自動生成 — 手動定義を削除 */
```

Tailwind CSS v4 のフォント設定はそのまま `--font-sans` / `--font-heading` を参照できる。

## CSP ヘッダーの更新

フォントがセルフホストされるため、CSP から外部ドメインを削除:

```typescript
// Before
"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com"

// After
"style-src 'self' 'unsafe-inline'; font-src 'self'"
```

## 移行チェックリスト

- [ ] `astro.config.ts` に `fonts` 設定を追加
- [ ] `Base.astro` の `<link>` タグによる Google Fonts 読み込みを削除
- [ ] `app.css` のフォント変数定義を削除 (Astro 自動生成に委譲)
- [ ] `middleware.ts` の CSP ヘッダーから `fonts.googleapis.com` / `fonts.gstatic.com` を削除
- [ ] `font-src 'self'` のみに変更
- [ ] FOUT がないことを視覚的に確認
- [ ] Lighthouse CLS スコアの改善を確認
