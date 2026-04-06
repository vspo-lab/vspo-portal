# パフォーマンス最適化

## 現状の課題

1. **LP のTTFB** — Bot Stats API 呼び出しがページレンダリングをブロック
2. **JS バンドルサイズ** — vanilla JS は module split されていない。React 化で自動 code split
3. **フォント読み込み** — Google Fonts のプリロードが全ページで発生
4. **画像最適化** — `<img>` タグ直接使用、Astro の `<Image>` 未使用
5. **View Transitions** — prefetch が viewport 全体で積極的すぎる可能性

## Server Islands による遅延レンダリング

### Bot Stats (LP)

```astro
<!-- Before: ページ全体のTTFBに影響 -->
---
const stats = await fetchBotStats(); // blocking
---
<DigitRoll value={stats.serverCount} />

<!-- After: Server Island で遅延 -->
<BotStats server:defer>
  <div slot="fallback" class="animate-pulse h-16 w-32 bg-gray-200 rounded" />
</BotStats>
```

**効果**: LP の TTFB を 200-500ms 改善（API 応答時間分）

### GuildCard チャンネル数

```astro
<!-- Before: ギルド一覧取得時に全ギルドのチャンネル数も取得 -->
<GuildCard guild={guild} channelCount={counts[guild.id]} />

<!-- After: チャンネル数のみ遅延 -->
<GuildCard guild={guild}>
  <ChannelCount server:defer guildId={guild.id}>
    <span slot="fallback" class="animate-pulse">...</span>
  </ChannelCount>
</GuildCard>
```

### Server Islands の制約と挙動 (Astro MCP 検証済み)

- `server:defer` コンポーネントの props は serializable でなければならない
- props は暗号化されて query string に含まれる (GET リクエスト)
  - URL が 2048 バイトを超える場合は自動的に POST にフォールバック
  - `ASTRO_KEY` 環境変数でローリングデプロイ時の暗号化キーを制御可能
- 各 Server Island は独立したリクエストとして処理される → N+1 問題に注意
- `Astro.locals` や `Astro.request` にはアクセスできない → 認証情報は props で渡す
  - `Astro.url` は island のリクエスト URL を返す。元ページの URL は `Referer` ヘッダーから取得
- Cloudflare adapter は Server Islands をネイティブサポート

## Hydration ディレクティブの最適化

```
client:load    → 即座にハイドレーション。CLS を避けたいインタラクティブ要素
client:idle    → requestIdleCallback 後。優先度の低い UI
client:visible → IntersectionObserver。fold below の要素
client:only    → SSR なし。テーマトグル等 SSR 不要な要素
client:media   → メディアクエリ条件付き。モバイル専用 UI
```

### 推奨ディレクティブマッピング

| コンポーネント | ディレクティブ | 理由 |
|---------------|---------------|------|
| ChannelConfigModal | `client:load` | ユーザーが即座に操作する可能性 |
| ChannelAddModal | `client:load` | ボタンクリックで即座に表示 |
| DeleteChannelDialog | `client:load` | ボタンクリックで即座に表示 |
| ThemeToggle | `client:load` | FOUC 防止。ページ表示直後に正しいアイコンを表示 |
| FlashMessage | `client:idle` | ページロード後に表示されれば十分 |
| UserMenu | `client:idle` | 即座に操作されることは少ない |
| LanguageSelector | `client:idle` | 即座に操作されることは少ない |
| FeatureShowcase (LP) | `client:visible` | fold below にある場合 |
| DigitRoll (LP) | `client:visible` | fold below にある場合 |

## Prefetch 最適化

### 現状

```typescript
// astro.config.ts
prefetch: {
  prefetchAll: false,
  defaultStrategy: "viewport",
}
```

### 改善案

```typescript
prefetch: {
  prefetchAll: false,
  defaultStrategy: "hover", // viewport → hover に変更 (Astro デフォルトも "hover")
}
```

**理由**: `viewport` は画面内の全リンクをプリフェッチするため、モバイルではデータ消費量が増加。`hover` はユーザーのインテントがある場合のみプリフェッチ。Astro 公式もデフォルトは `hover` を推奨。

**注意**: `<ClientRouter />` 使用時は `prefetchAll: true` がデフォルトになる。`prefetchAll: false` を明示的に設定。

重要なナビゲーション（ダッシュボードのサイドバーリンク）には個別に `data-astro-prefetch="viewport"` を指定:

```astro
<a href={`/dashboard/${guildId}`} data-astro-prefetch="viewport">
  Channels
</a>
```

### Speculation Rules API (将来)

Chrome 向けに `experimental.clientPrerender` を有効化すると、`prefetch()` API で `eagerness` オプションが使用可能に。`<script type="speculationrules">` によるブラウザネイティブのプリレンダリングが可能:

```tsx
import { prefetch } from 'astro:prefetch';
// 重要なページは即座にプリレンダリング
prefetch('/dashboard', { eagerness: 'immediate' });
// リソースの重いページは控えめに
prefetch('/dashboard/settings', { eagerness: 'conservative' });
```

## ルートキャッシング (実験的)

Astro 6 の `experimental.routeCache` でサーバーレンダリング結果をキャッシュし、同一リクエストの再レンダリングを回避。

### ページ別キャッシュ戦略

| ページ | maxAge | swr | 理由 |
|--------|--------|-----|------|
| `/` (LP) | 3600s | - | 静的コンテンツ |
| `/announcements` | 1800s | - | 更新頻度低 |
| `/dashboard/guilds` | 300s | 3600s | ギルド一覧 |
| `/dashboard/[guildId]` | 60s | 300s | チャンネル設定 (更新頻度高) |

### Action 後のキャッシュ無効化

チャンネル追加・削除等の Action 実行後に `tags` ベースでキャッシュを無効化。ユーザー別キャッシュキー (`user:xxx`) で認証との整合性を保つ。

→ 詳細: [16_ADVANCED_FEATURES.md](./16_ADVANCED_FEATURES.md#1-実験的ルートキャッシング-astro-6)

## フォント最適化

→ 詳細: [13_FONTS_OPTIMIZATION.md](./13_FONTS_OPTIMIZATION.md)

Astro 6 の `fonts` 設定を使用してビルド時に Google Fonts をダウンロードし、セルフホスト。`optimizedFallbacks` で CLS を自動軽減。CSP から外部フォントドメインを削除可能。

## 画像最適化

### Astro Image の活用

```astro
---
import { Image } from "astro:assets";
import botLogo from "../assets/bot-logo.png";
---

<!-- Before -->
<img src="/bot-logo.png" alt="Bot Logo" />

<!-- After: <Image> で自動最適化 -->
<Image src={botLogo} alt="Bot Logo" width={200} height={200} format="webp" />
```

**効果**:
- WebP/AVIF 自動変換
- 適切なサイズへのリサイズ
- `width`/`height` 属性による CLS 防止
- lazy loading デフォルト (`loading="lazy"`, `decoding="async"`)

### `<Picture>` コンポーネントの活用

複数フォーマット対応が必要な場合:

```astro
---
import { Picture } from "astro:assets";
import heroImage from "../assets/hero.png";
---
<Picture src={heroImage} formats={['avif', 'webp']} alt="Hero" />
<!-- 出力: <picture> タグ with <source> for avif, webp + <img> fallback -->
```

### Cloudflare Images Binding

Cloudflare adapter では `imageService: 'cloudflare-binding'` がデフォルト。Cloudflare Images でオンデマンド変換:

```typescript
// astro.config.ts
adapter: cloudflare({
  imageService: 'cloudflare-binding', // デフォルト、明示不要
})
```

### アバター画像

Discord アバター URL は外部画像。Cloudflare Images Binding でランタイム変換可能だが、シンプルさのため HTML 属性で対応:
- `loading="lazy"` 属性
- `width`/`height` 属性で CLS 防止
- `decoding="async"` 属性

```astro
<img
  src={avatarUrl}
  alt={`${username}'s avatar`}
  width={32}
  height={32}
  loading="lazy"
  decoding="async"
/>
```

### SVG 最適化 (Astro 5.16+)

```typescript
// astro.config.ts
experimental: {
  svgo: true, // SVG コンポーネントの自動最適化
}
```

## React Island のバンドル最適化

### Code Splitting

Astro は各 island を自動的に個別のチャンクとしてバンドルする。追加設定不要。

### Shared Dependencies

複数の island が同じ依存を使う場合、Astro は共通チャンクとして抽出:
- `react`, `react-dom` — 全 island で共有
- `nanostores`, `@nanostores/react` — 全 island で共有
- `zod` — バリデーションを使う island で共有

### Dynamic Import

重いコンポーネントは dynamic import で遅延読み込み:

```tsx
import { lazy, Suspense } from "react";

const MemberPicker = lazy(() => import("./CustomMemberPicker"));

function ChannelConfigModal() {
  return (
    <dialog>
      <Suspense fallback={<Skeleton />}>
        <MemberPicker />
      </Suspense>
    </dialog>
  );
}
```

## Core Web Vitals 目標

| 指標 | 目標 | 現状の課題 |
|------|------|-----------|
| LCP | < 2.5s | Bot Stats API がブロッキング → Server Islands で解決 |
| FID/INP | < 200ms | vanilla JS の大きなスクリプトが parse blocking → React island で code split |
| CLS | < 0.1 | フォント FOUT → font-display: swap + サイズ指定 |
| TTFB | < 800ms | Cloudflare Workers は高速。問題なし |

## 計測ツール

```bash
# Lighthouse CI
pnpm add -D @lhci/cli

# astro.config.ts に追加
import { defineConfig } from "astro/config";
// Cloudflare Workers ではランタイム計測が制限されるため、
// staging 環境での Lighthouse CI を推奨
```
