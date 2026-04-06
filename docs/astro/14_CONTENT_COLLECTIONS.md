# Content Collections の活用

## 現状

### お知らせデータ

`features/announcement/data/announcements.ts` に静的配列として定義:

```typescript
const announcements: readonly AnnouncementType[] = [
  {
    id: "2026-04-01-dashboard",
    title: { ja: "Webダッシュボードをリリースしました", en: "Web Dashboard Released" },
    body: { ja: "...", en: "..." },
    date: "2026-04-01T00:00:00Z",
    type: "update",
  },
];
```

- Zod スキーマで型定義
- TS ファイル内にデータ直書き
- ページ (`announcements.astro`) から直接 import

### 課題

1. **データとロジックの混在**: TS コード内にコンテンツデータが埋め込まれている
2. **拡張性**: 新しいお知らせ追加時にコード変更が必要
3. **型安全性**: 手動の Zod バリデーション (Content Collections なら自動)
4. **i18n**: 翻訳がオブジェクト内にインライン化されている

## 改善: Build-time Content Collections

### ファイル構造

```
src/
  content.config.ts              ← コレクション定義
  data/
    announcements/
      2026-04-01-dashboard.json  ← 個別のお知らせデータ
      2026-03-15-launch.json
```

### コレクション定義

```typescript
// src/content.config.ts
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { file } from "astro/loaders";

const announcements = defineCollection({
  loader: file("src/data/announcements/*.json"),
  schema: z.object({
    title: z.object({ ja: z.string(), en: z.string() }),
    body: z.object({ ja: z.string(), en: z.string() }),
    date: z.coerce.date(),
    type: z.enum(["info", "update", "maintenance"]),
  }),
});

export const collections = { announcements };
```

### データファイル

```json
// src/data/announcements/2026-04-01-dashboard.json
{
  "id": "2026-04-01-dashboard",
  "title": {
    "ja": "Webダッシュボードをリリースしました",
    "en": "Web Dashboard Released"
  },
  "body": {
    "ja": "ブラウザからBot設定を管理できるようになりました。",
    "en": "You can now manage Bot settings from your browser."
  },
  "date": "2026-04-01T00:00:00Z",
  "type": "update"
}
```

### ページでの使用

```astro
---
// pages/dashboard/announcements.astro
import { getCollection } from "astro:content";

const allAnnouncements = await getCollection("announcements");
// date でソート (新しい順)
const sorted = allAnnouncements.sort(
  (a, b) => b.data.date.getTime() - a.data.date.getTime()
);
---
```

### メリット

| 項目 | Before (TS 配列) | After (Content Collections) |
|------|------------------|----------------------------|
| 型安全性 | 手動 Zod | 自動 TypeScript 型生成 |
| データ形式 | TS ファイル | JSON/YAML/TOML |
| バリデーション | 実行時 | ビルド時 + エディタ補完 |
| クエリ API | 手動 filter/sort | `getCollection()` + フィルタ |
| エディタ支援 | なし | `contentIntellisense` で補完 |
| 非エンジニアの編集 | TS 知識必要 | JSON 編集のみ |

## Build-time vs Live Collections

### Build-time Collections (推奨)

お知らせデータのような**比較的静的なコンテンツ**に最適:

- ビルド時にデータを最適化・キャッシュ
- `getCollection()` / `getEntry()` で取得
- `src/content.config.ts` で定義
- JSON, YAML, Markdown, MDX 対応

### Live Collections (将来的な選択肢)

API やデータベースから**リアルタイムデータ**を取得する場合:

- リクエスト時にデータ取得
- `getLiveCollection()` / `getLiveEntry()` で取得
- `src/live.config.ts` で定義
- カスタム loader 実装が必要

```typescript
// src/live.config.ts (将来: Bot API からお知らせを動的取得する場合)
import { defineLiveCollection } from "astro:content";

const announcements = defineLiveCollection({
  loader: botApiAnnouncementLoader({
    apiBase: process.env.BOT_API_BASE_URL,
  }),
});

export const collections = { announcements };
```

**現時点の推奨**: お知らせは静的データのため build-time collection で十分。Bot API にお知らせ管理機能が追加された場合に live collection を検討。

## Creator データへの適用

`features/shared/domain/creator.ts` にも静的なクリエイターデータがあれば、同様に Content Collections 化を検討:

```typescript
// src/content.config.ts
const creators = defineCollection({
  loader: file("src/data/creators.json"),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    memberType: z.string(),
    avatarUrl: z.string().url().optional(),
  }),
});

export const collections = { announcements, creators };
```

## Intellisense 実験的機能

Content Collections のエディタ補完を有効化:

```typescript
// astro.config.ts
export default defineConfig({
  experimental: {
    contentIntellisense: true,
  },
});
```

VS Code 設定で `astro.content-intellisense: true` も有効にする。

## 移行チェックリスト

- [ ] `src/content.config.ts` を作成
- [ ] お知らせデータを `src/data/announcements/` に JSON ファイルとして分離
- [ ] `announcements.astro` ページを `getCollection()` API に移行
- [ ] `features/announcement/data/announcements.ts` を削除
- [ ] ビルドが正常に通ることを確認
- [ ] TypeScript 型が自動生成されることを確認
- [ ] (オプション) `contentIntellisense` を有効化
