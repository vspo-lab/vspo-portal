# メタ情報ガイドライン

## 概要

メタ情報は、検索エンジンやSNSでのサイト表示を最適化するための重要な設定です。本ガイドラインでは、favicon、OGP、apple-touch-icon、manifestの設定方法を定めます。

## Favicon

### 推奨仕様

| 項目 | 推奨値 |
|------|--------|
| サイズ | 48 × 48 px |
| フォーマット | PNG |
| カラーモード | RGB（透過対応） |

### なぜ48×48pxか

- **高解像度ディスプレイ対応**: Retinaディスプレイなど高ピクセル密度のディスプレイに対応
- **Google検索での表示**: Googleは48×48pxの倍数を推奨
- **スケーラビリティ**: 小さいサイズが必要な場合、ブラウザが自動で縮小

### なぜPNGか

- 主要なモダンブラウザはすべてPNGフォーマットをサポート
- ICOフォーマットより扱いやすく、透過もサポート
- 単一ファイルで管理可能

### 実装

```html
<link rel="icon" href="/favicon.png" type="image/png" />
```

## Apple Touch Icon

### 推奨仕様

| 項目 | 推奨値 |
|------|--------|
| サイズ | 180 × 180 px |
| フォーマット | PNG |
| 角丸 | 不要（OSが自動で適用） |

### なぜ180×180pxか

[Apple公式ドキュメント](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)によると、Retina iPadで推奨されているサイズであり、それより小さいサイズのアイコンが必要な場合はこのサイズのアイコンから自動生成されます。

### 実装

```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

## OGP（Open Graph Protocol）

### 基本設定

```html
<meta property="og:title" content="ページタイトル" />
<meta property="og:description" content="ページの説明文" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://example.com/page" />
<meta property="og:image" content="https://example.com/ogp.png" />
<meta property="og:site_name" content="サイト名" />
<meta property="og:locale" content="ja_JP" />
```

### OGP画像の推奨仕様

| 項目 | 推奨値 |
|------|--------|
| サイズ | 1200 × 630 px |
| アスペクト比 | 1.91:1 |
| フォーマット | PNG または JPG |
| ファイルサイズ | 1MB以下 |

### 注意事項

- URLは `https://` で始まる絶対パスで指定する
- `og:description` は `<meta name="description">` と一致させることを推奨

## Twitterカード

OGPとは別に、X（旧Twitter）専用のメタタグを設定します。

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@アカウント名" />
<meta name="twitter:title" content="ページタイトル" />
<meta name="twitter:description" content="ページの説明文" />
<meta name="twitter:image" content="https://example.com/twitter-card.png" />
```

### カードタイプ

| タイプ | 説明 |
|--------|------|
| `summary` | 小さい正方形の画像 |
| `summary_large_image` | 大きい横長の画像（推奨） |

## Web Manifest

PWA対応やホーム画面追加時のアイコン設定に使用します。

### manifest.webmanifest

```json
{
  "name": "サイト名",
  "short_name": "短縮名",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "theme_color": "#F7F6F3",
  "background_color": "#F7F6F3",
  "display": "standalone"
}
```

### Maskableアイコン

`purpose: "maskable"` を指定したアイコンは、Androidなどで円形やその他の形状にマスクされて表示されます。

| 項目 | 推奨値 |
|------|--------|
| サイズ | 512 × 512 px |
| セーフエリア | 中心80%に重要な要素を配置 |

### 実装

```html
<link rel="manifest" href="/manifest.webmanifest" />
```

## ログイン/非ログイン時の考慮

OGP画像やメタ情報は、ページの状態（ログイン有無など）によって動的に変更が必要な場合があります。

| シーン | 考慮事項 |
|--------|----------|
| 公開ページ | 標準のOGP設定を使用 |
| 会員限定ページ | 「ログインが必要です」等の汎用OGPを設定 |
| ユーザー生成コンテンツ | 動的にOGPを生成（サーバーサイドレンダリング） |

## ファイル構成

```
public/
├── favicon.png           # 48×48px
├── apple-touch-icon.png  # 180×180px
├── ogp.png              # 1200×630px
├── icon-192.png         # 192×192px
├── icon-512.png         # 512×512px
├── icon-maskable.png    # 512×512px (maskable)
└── manifest.webmanifest
```

## 参考リンク

- [Google Favicon ガイドライン](https://developers.google.com/search/docs/appearance/favicon-in-search?hl=ja)
- [Apple - Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
