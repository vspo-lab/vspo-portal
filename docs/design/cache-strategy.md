# キャッシュ戦略

Next.js 16 + Cloudflare Workers でのキャッシュ戦略ガイド。

## 現状 (Phase 0)

### インフラ構成

```text
@opennextjs/cloudflare 1.17.1
├── incrementalCache: R2 + Regional Cache (long-lived)
├── tagCache: DO Sharded (baseShardSize: 12)
├── queue: DO Queue
└── enableCacheInterception: true
```

### ページ別キャッシュ状態

| ページ | レンダリング | revalidate | 理由 |
|--------|-------------|-----------|------|
| schedule/[status] | `force-dynamic` | - | cookies依存 (timezone, favorite, sessionId) |
| clips (4ページ) | `force-dynamic` | - | searchParams依存 → ISR不可 |
| freechat | ISR | 1800s (30分) | 公開データ、低頻度更新 |
| multiview | ISR | 60s (1分) | 公開データ、ライブ配信リスト |
| site-news/[id] | ISR | 3600s (1時間) | 静的コンテンツ |
| about, terms, privacy | Static | ∞ | generateStaticParams |

### 制約事項

- `cacheComponents: true` は `@opennextjs/cloudflare` 1.17.1 で未サポート
- `enableCacheInterception` は PPR と非互換
- `next-intl` は `cacheComponents` 未対応 ([issue #1493](https://github.com/amannn/next-intl/issues/1493))
- `searchParams` を読むページは ISR 不可（Full Route Cache からオプトアウト）

---

## Phase 1: ISR 最大活用 (現在)

`force-dynamic` を使わずに済むページでISRを有効化。

### 適用済み

- **freechat**: `export const revalidate = 1800` — freechat一覧は全ユーザー共通
- **multiview**: `export const revalidate = 60` — ライブ配信リストは全ユーザー共通

### 適用不可

- **schedule**: cookies (timezone, favorite) でレスポンスが変わる
- **clips**: searchParams (period, order, page) で ISR 無効化

---

## Phase 2: `experimental.useCache` による data-level キャッシュ (検証中)

`cacheComponents: true` の代わりに `experimental: { useCache: true }` を使う。
PPR/dynamicIO を有効化せずに `'use cache'` ディレクティブだけを使える可能性がある。

### 検証項目

- [ ] `@opennextjs/cloudflare` での `experimental.useCache` 動作確認
- [ ] `next-intl` との互換性確認
- [ ] R2 incremental cache に `'use cache'` 結果が保存されるか確認
- [ ] `enableCacheInterception: true` との互換性確認

### 想定実装パターン

```typescript
// service/vspo-schedule/v2/web/src/features/shared/api/clip.ts
import { cacheLife, cacheTag } from "next/cache";

export const fetchClipsCached = async (
  params: FetchClipsParams,
): Promise<{ clips: Clip[]; pagination: Pagination }> => {
  "use cache";
  cacheLife("minutes");
  cacheTag("clips", `clips-${params.platform}`);

  // 'use cache' 内では throw ベース（Result型は返せない）
  const result = await fetchClips(params);
  if (result.err) throw result.err;
  return result.val;
};
```

### cacheLife プロファイル設計

| プロファイル | stale | revalidate | expire | 対象データ |
|------------|-------|-----------|--------|----------|
| `seconds` | 0 | 1s | 1min | ライブ配信ステータス |
| `minutes` | 5min | 1min | 1h | クリップ一覧、配信スケジュール |
| `hours` | 5min | 1h | 1d | メンバー一覧、freechat |
| `days` | 5min | 1d | 1w | サイトニュース、about |

### cacheTag 命名規則

| パターン | 例 | 説明 |
|---------|---|------|
| リソース名 | `clips`, `livestreams`, `freechats` | コレクション全体 |
| リソース-フィルタ | `clips-youtube`, `livestreams-live` | フィルタ条件別 |
| ページ | `schedule`, `multiview` | ページ単位 |

### `'use cache'` 内の制約

- **返り値をシリアライズ可能にすること**: クラスインスタンス (AppError, Date) は不可
- **Result型は返せない**: `Err(AppError)` がシリアライズ不可。throw ベースを使う
- **副作用禁止**: 読み取り専用関数のみ
- **呼び出し側で `wrap` を使ってフォールバック**

```typescript
// 呼び出し側
const clips = await wrap(fetchClipsCached(params), errorFactory);
const clipList = clips.err ? [] : clips.val;
```

---

## Phase 3: `cacheComponents: true` 完全移行 (将来)

`@opennextjs/cloudflare` と `next-intl` の対応後に実施。

### 前提条件

- [ ] `@opennextjs/cloudflare` が `cacheComponents` をサポート
- [ ] `next-intl` が `cacheComponents` をサポート
- [ ] `enableCacheInterception` を無効化 or PPR互換版リリース

### 移行内容

1. `next.config.js` に `cacheComponents: true` を追加
2. `export const dynamic = "force-dynamic"` を全削除
3. `export const revalidate` を全削除
4. 各 data-fetching 関数に `'use cache'` + `cacheLife` + `cacheTag` を追加
5. cookies/searchParams 依存コンポーネントを `<Suspense>` で分離 (PPR)
6. `enableCacheInterception: false` に変更

### Schedule ページの理想形 (PPR)

```typescript
// page.tsx — Static Shell (cached)
export default function SchedulePage({ params }) {
  const { locale, status } = await params;
  return (
    <ContentLayout title={...}>
      {/* Static: cached layout */}
      <Suspense fallback={<ScheduleSkeleton />}>
        {/* Dynamic: streams per request (depends on cookies) */}
        <ScheduleContent locale={locale} status={status} />
      </Suspense>
    </ContentLayout>
  );
}

// ScheduleContent — deferred to request time
async function ScheduleContent({ locale, status }) {
  const cookieStore = await cookies();
  // ... fetch with user's timezone/favorites
}
```

---

## 参考リンク

- [Next.js Cache Components](https://nextjs.org/docs/app/getting-started/cache-components)
- [OpenNext Cloudflare Caching](https://opennext.js.org/cloudflare/caching)
- [cacheLife API](https://nextjs.org/docs/app/api-reference/functions/cacheLife)
- [cacheTag API](https://nextjs.org/docs/app/api-reference/functions/cacheTag)
