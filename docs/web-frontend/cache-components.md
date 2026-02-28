# Cache Components ガイドライン (Next.js 16)

## 前提

本テンプレートの `services/web/next.config.ts` では、次をデフォルトで有効化する。

- `reactCompiler: true`
- `cacheComponents: true`

この前提で、App Router の設計は「Server Components + Cache Components + Suspense 境界」を基本にする。

## 設計原則

1. **キャッシュ可能な処理を明示する**
   - キャッシュ対象の Server Component / 関数に `'use cache'` を付ける。
   - キャッシュ更新戦略を `cacheLife` と `cacheTag` で明示する。
2. **動的データ境界を先に決める**
   - `cookies()`, `headers()`, `searchParams` などリクエスト依存データを読む箇所は動的境界として扱う。
   - 動的境界の下位に `<Suspense>` を置き、静的シェルを先に返す。
3. **パーソナライズと共有キャッシュを分離する**
   - ユーザー固有データは `'use cache: private'` を使う。
   - 共有可能データは通常の `'use cache'` で扱う。
4. **`'use cache'` は責務の小さい単位で使う**
   - ページ全体を一括キャッシュせず、意味のあるサブツリー/関数単位で適用する。
   - 再利用しやすい「データ関数 + Presenter」に分離する。

## 推奨パターン

### 1. キャッシュ可能な読み取り関数を分離

```tsx
import { cacheLife, cacheTag } from "next/cache";

export async function getCatalog() {
  "use cache";
  cacheTag("catalog");
  cacheLife({ stale: 300 });

  const response = await fetch("https://example.com/catalog");
  return response.json();
}
```

### 2. 動的データは非キャッシュ層で取得して引き渡す

```tsx
import { cookies } from "next/headers";

async function ProfileContent() {
  const sessionId = (await cookies()).get("session-id")?.value ?? "guest";
  return <CachedProfile sessionId={sessionId} />;
}

async function CachedProfile({ sessionId }: { sessionId: string }) {
  "use cache";
  const profile = await getProfile(sessionId);
  return <ProfilePresenter profile={profile} />;
}
```

### 3. ユーザー固有情報は private cache を使う

```tsx
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";

async function getRecommendations(productId: string) {
  "use cache: private";
  cacheTag(`recommendations:${productId}`);
  cacheLife({ stale: 60 });

  const sessionId = (await cookies()).get("session-id")?.value ?? "guest";
  return fetchRecommendations(productId, sessionId);
}
```

## 避ける実装

- `cookies()` や `headers()` を読んだ同じ関数に、そのまま共有キャッシュを置く
- キャッシュ更新条件 (`cacheTag` / `cacheLife`) を定義せずに `'use cache'` だけで運用する
- キャッシュ境界なしで大きなページ全体を動的レンダリングに倒す

## 参照

- Next.js `cacheComponents`: https://nextjs.org/docs/app/getting-started/cache-components
- Next.js `'use cache'`: https://nextjs.org/docs/app/api-reference/directives/use-cache
- Next.js `'use cache: private'`: https://nextjs.org/docs/app/api-reference/directives/use-cache-private
