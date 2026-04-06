# Astro 6 ビルトイン CSP

## 現状

### 手動 CSP ヘッダー (`middleware.ts`)

```typescript
const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  [
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://cdn.discordapp.com data:; connect-src 'self' https://discord.com; frame-ancestors 'none'",
  ],
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
];
```

### 課題

1. **`'unsafe-inline'` の使用**: スクリプトとスタイルに `'unsafe-inline'` を許可 — XSS 攻撃のリスク
2. **手動管理の煩雑さ**: CSP 文字列を直接編集。新しいスクリプト追加時にハッシュの手動計算が必要
3. **外部フォントドメイン**: `fonts.googleapis.com` / `fonts.gstatic.com` の許可が必要
4. **View Transitions との非互換**: `<ClientRouter />` 使用時のインラインスクリプトが CSP に対応困難
5. **ページ固有の CSP 不可**: 全ページに同一の CSP が適用される

## 改善: Astro 6 security.csp

### 概要

Astro 6 のビルトイン CSP は、ビルド時にスクリプトとスタイルのハッシュを自動計算し、`<meta http-equiv="content-security-policy">` タグとして各ページに挿入する。

### 主要な特長

1. **ハッシュベース**: `'unsafe-inline'` が不要になる — ブラウザはハッシュが一致するスクリプトのみ実行
2. **自動計算**: Astro がバンドルしたスクリプト/スタイルのハッシュを自動生成
3. **ページ固有**: 各ページに必要なハッシュのみが含まれる
4. **アルゴリズム選択**: SHA-256 (デフォルト), SHA-384, SHA-512

### 設定

```typescript
// astro.config.ts
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  security: {
    checkOrigin: true, // デフォルト: true — CSRF 保護
    csp: {
      algorithm: "SHA-256",
      directives: [
        "default-src 'self'",
        "img-src 'self' https://cdn.discordapp.com data:",
        "connect-src 'self' https://discord.com",
        "frame-ancestors 'none'",
        // font-src は fonts 移行後に 'self' のみ
        "font-src 'self'",
      ],
      // script-src と style-src は Astro が自動管理
      // → ハッシュが自動生成されるため、手動設定不要
    },
    // Actions のリクエストボディサイズ制限
    actionBodySizeLimit: 1048576, // 1 MB (デフォルト)
  },
});
```

### 生成される `<meta>` タグ

```html
<head>
  <meta
    http-equiv="content-security-policy"
    content="
      default-src 'self';
      img-src 'self' https://cdn.discordapp.com data:;
      connect-src 'self' https://discord.com;
      frame-ancestors 'none';
      font-src 'self';
      script-src 'self' 'sha256-abc123...' 'sha256-def456...';
      style-src 'self' 'sha256-ghi789...';
    "
  >
</head>
```

## 詳細設定

### scriptDirective

外部スクリプトやカスタムハッシュを追加:

```typescript
security: {
  csp: {
    scriptDirective: {
      // 外部スクリプトのソースを追加
      resources: ["'self'", "https://analytics.example.com"],
      // カスタムハッシュ (外部スクリプト用)
      hashes: ["sha256-externalScriptHash"],
      // 動的スクリプト注入を許可 (Server Islands が内部的に使用する場合)
      strictDynamic: false,
    },
  },
}
```

### styleDirective

外部スタイルやカスタムハッシュを追加:

```typescript
security: {
  csp: {
    styleDirective: {
      resources: ["'self'"],
      // Tailwind のインラインスタイル等のカスタムハッシュ
      hashes: [],
    },
  },
}
```

## security.checkOrigin — CSRF 保護

### 概要

Astro 4.9+ で導入。`Origin` ヘッダーを自動検証し、CSRF 攻撃を防止。

```typescript
security: {
  checkOrigin: true, // デフォルト: true
}
```

### 動作

- `POST`, `PATCH`, `DELETE`, `PUT` リクエストの `Origin` ヘッダーを検証
- 不一致の場合は 403 を返す
- `content-type` が `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain` の場合に適用
- Astro Actions (`accept: "form"`) は自動的に保護される

### 現状との比較

| 項目 | Before (手動) | After (checkOrigin) |
|------|--------------|---------------------|
| CSRF 保護 | Actions の `_astroAction` フィールドのみ | Origin ヘッダー検証 + Actions |
| 対象 | フォーム送信のみ | 全 POST/PATCH/DELETE/PUT |
| 設定 | 不要 (自動) | 不要 (デフォルト有効) |

## security.allowedDomains — Host Header 検証

### Cloudflare Workers での活用

```typescript
security: {
  allowedDomains: [
    {
      hostname: "discord.vspo-schedule.com",
      protocol: "https",
    },
    {
      hostname: "dev-discord.vspo-schedule.com",
      protocol: "https",
    },
  ],
}
```

### 効果

- `X-Forwarded-Host` ヘッダーの偽装を防止
- `Astro.url` が正しいホスト名を返すことを保証
- Cloudflare Workers の背後でのホストヘッダーインジェクション攻撃を防止

## security.actionBodySizeLimit

### デフォルト

```typescript
security: {
  actionBodySizeLimit: 1048576, // 1 MB
}
```

### カスタマイズ

ファイルアップロードを伴う Action がある場合に増加:

```typescript
security: {
  actionBodySizeLimit: 10 * 1024 * 1024, // 10 MB
}
```

現在のプロジェクトではファイルアップロードは不要のためデフォルトで十分。

## ミドルウェア CSP からの移行

### 移行手順

1. **`astro.config.ts` に `security.csp` を追加**
2. **middleware.ts の CSP ヘッダーを削除**:

```typescript
// Before: 手動 CSP
const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  ["Content-Security-Policy", "..."],  // ← 削除
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
];

// After: CSP 以外のヘッダーのみ
const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  // CSP は Astro が <meta> タグで管理
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
];
```

1. **`'unsafe-inline'` の削除確認**: Astro CSP はハッシュベースなので `'unsafe-inline'` は不要。`is:inline` スクリプトも自動的にハッシュが計算される。

### 制約事項

| 制約 | 影響 | 対策 |
|------|------|------|
| `<ClientRouter />` 非対応 | View Transitions SPA モード | ブラウザネイティブ View Transition API を使用 |
| Shiki 非対応 | コードハイライト | Prism を使用 (本プロジェクトでは該当なし) |
| `dev` モードで無効 | 開発中はテスト不可 | `build` + `preview` でテスト |
| 外部スクリプト | 自動ハッシュ計算対象外 | `scriptDirective.hashes` で手動追加 |

### CSP ヘッダー vs `<meta>` タグ

| 方式 | Astro CSP (meta) | middleware (header) |
|------|------------------|---------------------|
| `frame-ancestors` | `<meta>` では無効 | ヘッダーで有効 |
| `report-uri` | `<meta>` では無効 | ヘッダーで有効 |
| 動的ポリシー | ページ固有 | リクエスト全体 |

**重要**: `frame-ancestors` は `<meta>` タグでは無効。`X-Frame-Options: DENY` をミドルウェアで引き続き設定するか、Cloudflare Workers の応答ヘッダーで `frame-ancestors 'none'` を追加する。

## 移行チェックリスト

- [ ] `astro.config.ts` に `security.csp` 設定を追加
- [ ] `security.csp.directives` に `default-src`, `img-src`, `connect-src`, `font-src` を設定
- [ ] middleware.ts から `Content-Security-Policy` ヘッダーを削除
- [ ] `'unsafe-inline'` が不要になったことを確認 (ハッシュベースに移行)
- [ ] `X-Frame-Options: DENY` は middleware に維持 (`<meta>` では `frame-ancestors` 無効)
- [ ] `security.allowedDomains` に prod/dev ドメインを設定
- [ ] `security.checkOrigin: true` がデフォルト有効であることを確認
- [ ] `astro build && astro preview` で CSP 動作をテスト
- [ ] ブラウザの開発者ツールで CSP 違反がないことを確認
- [ ] fonts 移行 (13_FONTS_OPTIMIZATION.md) 完了後、`font-src` から外部ドメインを削除
