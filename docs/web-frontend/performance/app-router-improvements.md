# App Router パフォーマンス・UI/UX 向上設計書

> **作成日:** 2026-03-24
> **対象:** `service/vspo-schedule/v2/web/` (Next.js 16.1.7 + Cloudflare Workers)
> **目的:** 公式ドキュメント・計測データに基づく改善案の整理。各施策に期待効果・判断基準・Cloudflare 制約を明記する。

---

## 1. 現状分析

### 1.1 技術スタック

| 項目 | 現状 | 備考 |
|------|------|------|
| Framework | Next.js 16.1.7 (React 19.2.4) | React Compiler ON |
| Deploy | Cloudflare Workers | @opennextjs/cloudflare, Worker 10 MiB 制限 (有料プラン) |
| Styling | MUI v7.3.9 + Emotion 11.14.x | `AppRouterCacheProvider` で App Router 統合 |
| Cache (infra) | R2 incremental + Regional (long-lived) + DOShardedTagCache (baseShardSize: 12) | `enableCacheInterception: true` |
| Cache (app) | `staleTimes: { dynamic: 30, static: 180 }` | Client Router Cache |
| Streaming | Suspense + Skeleton fallback (4 ページ) | schedule, clips, freechat, multiview |
| PWA | Serwist 9.5.7 | `skipWaiting`, `clientsClaim`, `navigationPreload`, `defaultCache` |
| i18n | next-intl (en, ja, cn, tw, ko) | middleware でルーティング |

### 1.2 実装済みの最適化

| カテゴリ | 実装内容 | 該当コード |
|----------|----------|-----------|
| Server Components | デフォルト利用。Client Component は約 80 ファイル（インタラクティブ部分のみ） | — |
| Streaming | 主要 4 ページで Suspense + Skeleton fallback | `schedule/[status]/page.tsx:202-204` 等 |
| 並列 Fetch | `Promise.allSettled()` でウォーターフォール回避 | `scheduleService.ts:45-63`, `clipService.ts:32-69` |
| Tree Shaking | `optimizePackageImports` で MUI / date-fns / FontAwesome 最適化 | `next.config.js:30-35` |
| 遅延ロード | `next/dynamic` で VideoModal, TweetEmbed, MarkdownContent, MultiviewGrid を分離 | — |
| SEO | Metadata API + `generateMetadata()` (動的メタデータ 13 ファイル) | — |
| Security | X-Frame-Options: DENY, CSP, nosniff, Referrer-Policy | `next.config.js:77-109` |
| Static Cache | `_next/static/*` に immutable ヘッダー | `next.config.js:77-109` |

### 1.3 レンダリング戦略の現状

| ルート | 戦略 | 理由 |
|--------|------|------|
| `/schedule/[status]` | `force-dynamic` | API 依存の即時データ。ライブ配信状態が随時変化 |
| `/clips` | `force-dynamic` | 再生数ランキングが頻繁に変動 |
| `/freechat` | `revalidate = 1800` | 30 分周期で十分。フリーチャット枠の更新頻度は低い |
| `/multiview` | `revalidate = 60` | マルチビュー対象のライブ配信一覧 |
| `/site-news/[id]` | `revalidate = 3600` | お知らせ記事。更新頻度が低い |
| 静的ページ | 完全 SSG | privacy-policy, terms, about |

---

## 2. 改善案

### 優先度定義

| 優先度 | 定義 | 判断基準 |
|--------|------|----------|
| **P0** | 即着手可能 | 既存コードの再利用で完結。設計不要、リスク低 |
| **P1** | 設計・検証が必要 | 効果大だが、Cloudflare 環境での動作確認や設計判断が伴う |
| **P2** | 中期施策 | バックエンド連携やルーティング変更など、スコープが大きい |
| **P3** | 将来施策 | OpenNext の制約で現時点では実装不可 |

---

### P0-1: ルートごとの loading.tsx 追加

> **期待効果:** ナビゲーション時の即時フィードバック。Next.js の Partial Prefetching が有効になり、遷移が即座に開始される。
>
> 参考: [Next.js Linking and Navigating - Instant Loading States](https://nextjs.org/docs/app/getting-started/linking-and-navigating#instant-loading-states)

**現状の問題:**

`[locale]/loading.tsx` が `return null` を返すのみ (3 行)。ルート遷移時にブラウザの UI フィードバックがなく、ユーザーは応答を待っているのか判断できない。

**改善内容:**

各ルートに既存の Skeleton コンポーネントを再利用した `loading.tsx` を配置する。

```text
src/app/[locale]/(content)/schedule/[status]/loading.tsx  → <ScheduleSkeleton />
src/app/[locale]/(content)/freechat/loading.tsx           → <FreechatSkeleton />
src/app/[locale]/(standalone)/clips/loading.tsx           → <ClipsSkeleton />
src/app/[locale]/(standalone)/multiview/loading.tsx       → <MultiviewSkeleton />
```

```tsx
// 例: schedule/[status]/loading.tsx
import { ScheduleSkeleton } from "@/features/shared/components/Elements/Loading/ScheduleSkeleton";

export default function Loading() {
  return <ScheduleSkeleton />;
}
```

**loading.tsx と Suspense fallback の関係:**

- `loading.tsx` は **page コンポーネント自体のロード中** に表示される (ナビゲーション直後)
- page 内の `<Suspense fallback={<ScheduleSkeleton />}>` は **データフェッチ中** に表示される
- 両者は異なるタイミングで動作するため二重表示にはならない
- ただし、同じ Skeleton を使うことで視覚的な一貫性を保つ

**工数:** XS (4 ファイル追加のみ。既存 Skeleton を import するだけ)

---

### P0-2: next/font による Web Font 最適化

> **期待効果:** CLS 低減、外部 DNS/TLS ラウンドトリップ排除による TTFB/FCP 改善。
>
> セルフホスティングにより外部サーバーへの DNS ルックアップ + TLS ハンドシェイクを排除し、テキストレンダリングを高速化する。
>
> 参考: [Self host Google fonts for better Core Web Vitals](https://www.corewebvitals.io/pagespeed/self-host-google-fonts), [DebugBear: Font Performance](https://www.debugbear.com/blog/website-font-performance)

**現状の問題:**

`next/font` 未使用。フォントはブラウザデフォルトに依存し、言語切り替え時に見た目が不統一。

**改善内容:**

```tsx
// src/app/fonts.ts
import { Noto_Sans_JP, Inter } from "next/font/google";

export const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: true,
});

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});
```

**MUI テーマとの統合が必要:**

```tsx
// src/context/Theme.tsx の createTheme に追加
typography: {
  fontFamily: `${inter.style.fontFamily}, ${notoSansJP.style.fontFamily}, sans-serif`,
},
```

**Cloudflare Workers での動作:**

`next/font` はビルド時にフォントファイルをダウンロードし `_next/static` に配置する。Workers 環境でもビルド済み static assets として配信されるため問題なし。

**工数:** S (フォント定義 + テーマ統合 + レイアウト適用)

---

### P0-3: DNS Prefetch / Preconnect の拡充

> **期待効果:** サードパーティリソースへの接続を 100-500ms 短縮。
>
> `preconnect` は DNS + TCP + TLS を先行実行し、100-500ms の短縮が見込める。`dns-prefetch` は DNS のみで 20-120ms の短縮。
>
> 参考: [web.dev: Preconnect and dns-prefetch](https://web.dev/preconnect-and-dns-prefetch/), [Chrome DevTools: Preconnect to required origins](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect)

**現状:** `[locale]/layout.tsx:28-36` で以下のみ設定済み。

```tsx
// 既存
<link rel="preconnect" href="https://yt3.ggpht.com" crossOrigin="anonymous" />
<link rel="preconnect" href="https://www.googletagmanager.com" />
<link rel="dns-prefetch" href="https://yt3.ggpht.com" />
<link rel="dns-prefetch" href="https://i.ytimg.com" />
<link rel="dns-prefetch" href="https://www.googletagmanager.com" />
```

**追加すべきドメイン:**

| ドメイン | 用途 | ヒント種別 | 理由 |
|----------|------|-----------|------|
| `i.ytimg.com` | YouTube サムネイル | `preconnect` | 全ページで大量に読み込む。現在 dns-prefetch のみ |
| `static-cdn.jtvnw.net` | Twitch サムネイル | `dns-prefetch` | Clips ページで使用 |
| `clips-media-assets2.twitch.tv` | Twitch クリップ | `dns-prefetch` | Clips ページで使用 |
| `imagegw03.twitcasting.tv` | TwitCasting サムネイル | `dns-prefetch` | Schedule ページで使用 |

**判断基準:** `preconnect` は最重要ドメイン (YouTube) のみ。過剰な `preconnect` はかえって帯域を圧迫する。それ以外は `dns-prefetch` で DNS 解決のみ先行。

**工数:** XS (layout.tsx に link タグ追加のみ)

---

### P0-4: not-found.tsx の改善

**現状:** ルートレベルの `not-found.tsx` のみ。インラインスタイルで最小限の UI。i18n 非対応。

**改善内容:**

- サイトのデザインシステム (MUI) に準拠したスタイリング
- ナビゲーションリンク追加 (ホーム、スケジュール)
- `[locale]` 配下に移動して i18n 対応 (next-intl の `useTranslations` を利用)

**工数:** S

---

### P1-1: Dynamic OG Image 生成

> **期待効果:** SNS シェア時の CTR 向上。BuzzSumo の調査では画像付き投稿はエンゲージメント 2.3 倍、OG 画像未設定はクリック率最大 40% 低下との報告がある。
>
> 参考: [ClickRank: OpenGraph Tags Guide](https://www.clickrank.ai/seo-academy/on-page-optimization/opengraph-tags/), [Ryte: Open Graph tags and CTR](https://en.ryte.com/magazine/open-graph/)

**現状の問題:**

`metadata.openGraph.images` が静的な `page-icon.png` のみ (root `layout.tsx:18`)。全ページで同じサムネイルが表示され、コンテンツの区別がつかない。

**改善内容:**

```text
src/app/[locale]/(content)/schedule/[status]/opengraph-image.tsx
src/app/[locale]/(content)/site-news/[id]/opengraph-image.tsx
```

```tsx
// schedule/[status]/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Vspo Schedule";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: { params: Promise<{ status: string; locale: string }> }) {
  const { status, locale } = await params;
  const labels: Record<string, string> = {
    live: "LIVE NOW",
    upcoming: "UPCOMING",
    archive: "ARCHIVE",
    all: "ALL STREAMS",
  };

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #7266cf 0%, #2d4b70 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700 }}>ぶいすぽっ！</div>
        <div style={{ fontSize: 48, marginTop: 24, opacity: 0.9 }}>
          {labels[status] ?? "SCHEDULE"}
        </div>
      </div>
    ),
    { ...size },
  );
}
```

**Cloudflare Workers 制約:**

- `next/og` は Edge Runtime (Satori + resvg-wasm) で動作する
- OpenNext Cloudflare で Edge Runtime は Workers にマッピングされるため、基本的には動作する
- **リスク:** 日本語フォント埋め込み時の WASM サイズ。Satori のデフォルトフォントは英語のみ。日本語テキストを含む場合、Noto Sans JP のサブセット (約 4-8 MiB) のバンドルが必要になり、Worker の 10 MiB 制限に抵触する可能性がある
- **回避策:** 日本語フォントは Google Fonts CDN から fetch で取得し、キャッシュする方法を検討

**工数:** M (OG 画像デザイン + Cloudflare 動作検証)

---

### P1-2: View Transitions API

> **期待効果:** ページ遷移のなめらかさ向上。ベンチマークではローエンド端末で 2-3 倍スムーズに感じるとの報告。ブラウザネイティブの GPU アクセラレーションで JS ライブラリ不要。
>
> 参考: [Next.js viewTransition Config](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition), [DEV: Comparing Page Transition Strategies](https://dev.to/alessandro-grosselle/comparing-page-transition-strategies-in-nextjs-a-performance-study-19i0)

**現状:** ページ遷移アニメーションなし。schedule のタブ切り替え時に画面が瞬間的に再描画される。

**改善内容:**

```js
// next.config.js に追加
experimental: {
  viewTransition: true,
}
```

```css
/* globals.css に追加 */
::view-transition-old(root) {
  animation: fade-out 150ms ease-in;
}

::view-transition-new(root) {
  animation: fade-in 150ms ease-out;
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**ブラウザサポート (2026年3月時点):**

| ブラウザ | Same-document | Cross-document |
|----------|:-------------:|:--------------:|
| Chrome / Edge | 111+ | 126+ |
| Safari | 18+ | 未対応 |
| Firefox | 未対応 | 未対応 |

Progressive Enhancement として動作するため、未対応ブラウザではアニメーションなしで通常通り遷移する。破壊的変更なし。

**Cloudflare 制約:** クライアントサイドのみの機能。Workers 環境への影響なし。

**工数:** S (config 1 行 + CSS 追加のみ)

---

### P1-3: generateStaticParams (site-news)

> **期待効果:** ビルド時にページをプリレンダリングし、初回アクセスの TTFB を削減。ISR と組み合わせることで、R2 キャッシュにプリウォームされた状態でデプロイ可能。
>
> 参考: [Next.js ISR Guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration)

**現状:** `site-news/[id]` は `revalidate = 3600` だが `generateStaticParams` 未実装。初回アクセスは必ず SSR → キャッシュ生成の流れになる。

**改善内容:**

```tsx
// site-news/[id]/page.tsx に追加
export async function generateStaticParams() {
  const result = await fetchSiteNews({ limit: 50 });
  if (result.err) return [];
  return result.val.map((news) => ({ id: news.id }));
}
```

**適用判断:**

| ルート | generateStaticParams 適用 | 理由 |
|--------|:------------------------:|------|
| `/site-news/[id]` | 適用 | コンテンツ数が少なく、更新頻度低い。ISR で 1 時間ごと再検証 |
| `/schedule/[status]` | 不適用 | `force-dynamic`。ライブ状態がリアルタイムに変化するため静的化不可 |
| `/clips` | 不適用 | `force-dynamic`。ランキングが頻繁変動 |

**工数:** S

---

### P1-4: エラーバウンダリの細粒度化

**現状:** `[locale]/error.tsx` が 1 つのみ。英語固定の汎用メッセージとリトライボタン (17 行)。

```tsx
// 現在の error.tsx — 全ルート共通
<div style={{ textAlign: "center", padding: "4rem" }}>
  <h1>Something went wrong</h1>
  <button type="button" onClick={reset}>Try again</button>
</div>
```

**問題点:**

- エラーの原因がユーザーに伝わらない (スケジュール取得失敗とクリップ取得失敗の区別がつかない)
- i18n 非対応 (英語固定)
- デザインシステム (MUI) に準拠していない
- 他ページへの導線がない

**改善内容:**

```text
src/app/[locale]/(content)/schedule/[status]/error.tsx  — スケジュール取得失敗時
src/app/[locale]/(standalone)/clips/error.tsx           — クリップ取得失敗時
```

各エラーページで:

- `useTranslations("error")` で i18n 対応したメッセージ
- MUI の `Container`, `Typography`, `Button` を使ったスタイリング
- リトライボタン (`reset()`)
- ホーム・他ページへのナビゲーションリンク
- エラーの文脈に応じた具体的メッセージ (例: 「配信スケジュールの読み込みに失敗しました」)

**工数:** S

---

### P1-5: バンドルサイズ分析・最適化

> **背景:** Cloudflare Workers は有料プランで Worker あたり 10 MiB、起動時のグローバルスコープ実行は 1 秒以内の制限がある。バンドルサイズの継続的な監視が必要。
>
> 参考: [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/), [OpenNext Troubleshooting](https://opennext.js.org/cloudflare/troubleshooting)

**現状:** `@next/bundle-analyzer` 未導入。バンドル構成が不可視。

**主要な依存パッケージ (バンドルサイズへの影響度順):**

| パッケージ | 用途 | 懸念 |
|-----------|------|------|
| `@mui/material` 7.3.9 | UI コンポーネント | ランタイム CSS-in-JS。`"use client"` 強制 |
| `@emotion/react` + `@emotion/styled` | MUI のスタイリングエンジン | Server Components と非互換。ランタイムコスト |
| `@mui/icons-material` | アイコン | `optimizePackageImports` で対応済みだが効果未検証 |
| `react-grid-layout` | マルチビューグリッド | `next/dynamic` で遅延ロード済み |
| `react-markdown` + `remark-gfm` | About ページ | `next/dynamic` で遅延ロード済み |

**改善内容:**

1. `@next/bundle-analyzer` を devDependencies に追加

2. next.config.js に条件付き有効化を追加

   ```js
   const withBundleAnalyzer = require("@next/bundle-analyzer")({
     enabled: process.env.ANALYZE === "true",
   });
   ```

3. 分析実行後、以下を重点的にチェック:

   - MUI + Emotion のクライアントバンドル占有率
   - `"use client"` 境界が不必要に高い位置にないか
   - 重複してバンドルされている依存関係

**工数:** M (ツール導入 S + 分析・改善 M)

---

### P2-1: revalidateTag によるオンデマンドキャッシュ無効化

> **期待効果:** 時間ベースの revalidate では「更新直後はキャッシュが古い」問題が不可避。タグベースの無効化でデータ更新時に即座にキャッシュをパージできる。
>
> 参考: [Next.js Caching](https://nextjs.org/docs/app/getting-started/caching)

**現状:**

- インフラ側: `DOShardedTagCache` (baseShardSize: 12) が `open-next.config.ts` で設定済み
- アプリ側: タグベースの無効化は未実装。時間ベースの `revalidate` のみ

**改善内容:**

```tsx
// データフェッチ時にタグ付け (サービス層)
const res = await fetch(`${API_URL}/schedules`, {
  next: { tags: ["schedules", `schedule-${status}`] },
});

// Webhook 受信時に無効化 (API Route)
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  const { type } = await req.json();
  if (type === "schedule_updated") {
    revalidateTag("schedules");
  }
  return Response.json({ revalidated: true });
}
```

**前提条件:**

- バックエンド (Go API) 側にデータ更新時の Webhook 通知機構が必要
- 現在 `force-dynamic` のルートでは効果がない。`revalidate` への切り替えとセットで検討

**工数:** M (API Route 追加 + サービス層のフェッチにタグ追加 + バックエンド Webhook 連携)

---

### P2-2: Intercepting Routes によるモーダルパターン

**現状:** `VideoModal` は `next/dynamic` で遅延ロードされ、Context (`VideoModalContextProvider`) で開閉を管理。URL と連動しない。

**改善による UX 向上:**

| 現状 | 改善後 |
|------|--------|
| モーダルが URL に紐づかない | URL が変わる → ブラウザバックで閉じられる |
| 動画を共有するにはページ URL しかない | 動画個別の URL を共有可能 (ディープリンク) |
| リロードするとモーダルが閉じる | リロードしても動画ページとして表示 |

**ルーティング構造:**

```text
src/app/[locale]/(content)/schedule/[status]/
  @modal/
    (.)video/[id]/page.tsx    ← Intercepting Route (モーダルで表示)
    default.tsx               ← モーダル非表示時
  layout.tsx                  ← Parallel Routes の slot を受け取る
src/app/[locale]/video/[id]/page.tsx  ← 直接アクセス時のフルページ
```

**工数:** L (ルーティング構造変更 + VideoModal の Context 依存からの切り替え + 既存リンクの更新)

---

### P2-3: Service Worker キャッシュ戦略の最適化

**現状:** Serwist の `defaultCache` をそのまま使用 (`sw.ts:15`)。カスタムキャッシュ戦略は未設定。

```tsx
// 現在の sw.ts — defaultCache のみ
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,  // ← Serwist デフォルト任せ
});
```

**改善案:**

| リソース | 戦略 | 理由 |
|----------|------|------|
| YouTube / Twitch サムネイル | CacheFirst (maxAge: 24h) | 画像は変わらない。オフラインでも表示可能に |
| API レスポンス (`/api/*`) | StaleWhileRevalidate (maxAge: 5min) | 即表示 + バックグラウンドで更新 |
| ナビゲーション | NetworkFirst + オフラインフォールバック | オフライン時に「オフラインです」ページを表示 |

**工数:** M

---

### P3-1: `"use cache"` ディレクティブ

> Next.js 16 の新しいキャッシュモデル。コンポーネント・関数レベルでキャッシュを宣言的に制御する。`revalidate` export を置き換える次世代 API。
>
> 参考: [Next.js Caching - use cache](https://nextjs.org/docs/app/getting-started/caching)

```tsx
// 将来の実装イメージ
async function ScheduleContent() {
  "use cache";
  cacheLife("minutes");
  cacheTag("schedules");
  const data = await fetchSchedule(/* ... */);
  return <SchedulePresenter data={data} />;
}
```

**現状の制約:** OpenNext Cloudflare アダプターが `"use cache"` に未対応。

> OpenNext 公式ドキュメントより:
> "The use cache directive is not yet supported in the Cloudflare adapter."
>
> 参照: [OpenNext Cloudflare Caching](https://opennext.js.org/cloudflare/caching)

**アクション:** OpenNext のリリースノートを監視。サポートされ次第 `revalidate` export → `"use cache"` + `cacheLife()` への段階的移行を開始する。

---

### P3-2: Partial Prerendering (PPR)

> 静的シェル (ヘッダー、ナビゲーション、Skeleton) をビルド時に生成し即座に配信。動的部分のみ Suspense 境界内でストリーミングする。TTFB を静的サイト並みに短縮可能。
>
> 参考: [Next.js PPR](https://nextjs.org/docs/app/getting-started/partial-prerendering)

**現状の制約:**

- OpenNext Cloudflare で PPR は未サポート ("cache interception does not work with PPR")
- 参照: [cloudflare-barriers.md](../approuter/cloudflare-barriers.md) Barrier #3

**PPR が使えた場合の影響:**

| ルート | 現状 | PPR 適用後 |
|--------|------|-----------|
| `/schedule/[status]` | `force-dynamic` → 全体が SSR | 静的シェル即時配信 + データ部分のみストリーミング |
| `/clips` | `force-dynamic` → 全体が SSR | 同上 |

**アクション:** `"use cache"` サポート後に PPR の対応状況を再評価する。

---

### P3-3: Server Actions

**現状:** 未使用。データ変更は外部 API クライアント (`@vspo-lab/api`) 経由。

**導入判断:**

- 現在の Web アプリは**読み取り専用** (スケジュール閲覧、クリップ閲覧)
- Server Actions + `useOptimistic` / `useActionState` が有効になるのは、ユーザー書き込み機能 (お気に入り、通知設定、コメント等) が追加される場合
- 現時点では **導入不要**

---

### P3-4: MUI → ゼロランタイム CSS 移行

**背景:** MUI + Emotion (CSS-in-JS) は Server Components との相性に課題がある。Emotion のランタイムが Client Component を強制し、バンドルサイズを増大させる。`AppRouterCacheProvider` で対応しているが根本解決ではない。

**選択肢の比較:**

| ライブラリ | ゼロランタイム | Server Components 互換 | MUI からの移行コスト | 成熟度 |
|-----------|:---:|:---:|:---:|:---:|
| Pigment CSS (MUI公式後継) | Yes | Yes | 低 (MUI API 互換) | 開発中 |
| Tailwind CSS v4 | Yes | Yes | 高 (全スタイル書き換え) | 安定 |
| vanilla-extract | Yes | Yes | 高 (全スタイル書き換え) | 安定 |

**現時点の判断:**

大規模なスタイリング移行は ROI が低い。MUI v7 + `optimizePackageImports` + React Compiler の現構成を維持し、Pigment CSS が安定したタイミングで再評価する。

---

## 3. 実装ロードマップ

### Phase 1: Quick Wins (1-2 日)

| # | 施策 | 工数 | CWV への影響 |
|---|------|:----:|-------------|
| P0-1 | loading.tsx 追加 | XS | 体感速度 (Perceived) |
| P0-2 | next/font 導入 | S | CLS 低減, LCP 改善 |
| P0-3 | preconnect 拡充 | XS | LCP 改善 (100-500ms) |
| P0-4 | not-found.tsx 改善 | S | UX 品質 |

### Phase 2: 検証・設計 (3-5 日)

| # | 施策 | 工数 | CWV への影響 |
|---|------|:----:|-------------|
| P1-1 | Dynamic OG Image | M | SNS CTR (エンゲージメント 2.3x) |
| P1-2 | View Transitions | S | 体感速度 (Progressive Enhancement) |
| P1-3 | generateStaticParams | S | TTFB 改善 (site-news) |
| P1-4 | Error Boundary 細粒度化 | S | エラー時 UX |
| P1-5 | バンドル分析 | M | バンドルサイズ可視化 |

### Phase 3: 中期 (1-2 週間)

| # | 施策 | 工数 | CWV への影響 |
|---|------|:----:|-------------|
| P2-1 | revalidateTag | M | キャッシュ鮮度 |
| P2-2 | Intercepting Routes | L | URL 共有, ナビゲーション UX |
| P2-3 | SW キャッシュ最適化 | M | オフライン体験, 体感速度 |

### Phase 4: OpenNext 依存 (時期未定)

| # | 施策 | ブロッカー | 期待効果 |
|---|------|-----------|----------|
| P3-1 | `"use cache"` | OpenNext 未対応 | 宣言的キャッシュ制御 |
| P3-2 | PPR | OpenNext 未対応 | TTFB を静的サイト並みに短縮 |

---

## 4. Core Web Vitals への影響マトリクス

| 指標 | 現状の課題 | 改善施策 | 期待効果 |
|------|-----------|----------|----------|
| **LCP** | 外部フォント取得の遅延、サムネイル接続の DNS/TLS コスト | P0-2 (next/font), P0-3 (preconnect) | フォント: DNS/TLS ラウンドトリップ排除。画像: 100-500ms 短縮 |
| **CLS** | フォント swap 時のレイアウトシフト | P0-2 (next/font + `display: swap`) | `size-adjust` によるフォールバック一致で CLS ≒ 0 |
| **INP** | React Compiler 適用済みで良好 | 維持 | — |
| **TTFB** | `force-dynamic` ページは毎回 SSR | P1-3 (generateStaticParams), P3-2 (PPR) | site-news: プリレンダリングで TTFB 大幅改善。PPR は将来 |
| **Perceived** | ナビゲーション時のフィードバック不足 | P0-1 (loading.tsx), P1-2 (View Transitions) | 即時 Skeleton 表示 + GPU アニメーション |

---

## 5. 参考資料

### Next.js 公式

- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Next.js Caching](https://nextjs.org/docs/app/getting-started/caching)
- [Next.js ISR Guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration)
- [Next.js viewTransition Config](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition)
- [Next.js Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)

### Cloudflare / OpenNext

- [OpenNext Cloudflare Caching](https://opennext.js.org/cloudflare/caching)
- [OpenNext Cloudflare Troubleshooting](https://opennext.js.org/cloudflare/troubleshooting)
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)

### パフォーマンス・CWV

- [web.dev: Preconnect and dns-prefetch](https://web.dev/preconnect-and-dns-prefetch/)
- [Chrome DevTools: Preconnect to required origins](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect)
- [Self host Google fonts for better Core Web Vitals](https://www.corewebvitals.io/pagespeed/self-host-google-fonts)
- [DebugBear: Font Performance Optimization](https://www.debugbear.com/blog/website-font-performance)

### OG Image / SNS

- [ClickRank: OpenGraph Tags Guide](https://www.clickrank.ai/seo-academy/on-page-optimization/opengraph-tags/)
- [Ryte: Open Graph tags and CTR](https://en.ryte.com/magazine/open-graph/)
