# Date/Time Handling Guidelines

このドキュメントでは、アプリケーションの日時処理規約を定義します。

## 基本原則

1. **UTC を標準とする**: サーバーサイドのタイムスタンプと保存日時はすべて UTC を使用する
2. **表示は JST**: フロントエンドでは日本のユーザー向けに JST（Asia/Tokyo）で日時を表示する
3. **`@my-app/dayjs` を使用する**: ネイティブの `Date` オブジェクトの代わりに共有 dayjs パッケージを常に使用する

## パッケージ: `@my-app/dayjs`

`@my-app/dayjs` パッケージは、アプリケーション全体で一貫した日時ユーティリティを提供します。

### インストール

`services/api` と `services/web` の両方に既に含まれています。

```typescript
import {
  getCurrentUTCDate,
  getCurrentTimestamp,
  formatToJST,
  formatToLocalizedDate,
} from "@my-app/dayjs";
```

## サーバーサイド（バックエンド）

### 現在時刻の取得

```typescript
import { getCurrentUTCDate, getCurrentTimestamp } from "@my-app/dayjs";

// 現在時刻を Date オブジェクト（UTC）として取得
const now = getCurrentUTCDate();

// 現在のタイムスタンプをミリ秒で取得（Date.now() の代替）
const timestamp = getCurrentTimestamp();
```

### データベース操作

データベースのタイムスタンプはすべて UTC で保存します。

```typescript
import { getCurrentUTCDate } from "@my-app/dayjs";

// レコード作成時
await db.insert(table).values({
  createdAt: getCurrentUTCDate(),
  updatedAt: getCurrentUTCDate(),
});
```

### トークン/セッションの有効期限

```typescript
import { addMillisecondsFromNow, convertToUTC } from "@my-app/dayjs";

// 有効期限の作成
const TOKEN_EXPIRE_MS = 30 * 60 * 1000; // 30分
const expireTime = convertToUTC(addMillisecondsFromNow(TOKEN_EXPIRE_MS));
```

## フロントエンド（クライアントサイド）

### 現在時刻の取得

```typescript
import { getCurrentUTCDate, getCurrentTimestamp } from "@my-app/dayjs";

// タイムスタンプ計算用（例: 経過時間）
const startTime = getCurrentTimestamp();
// ... 後で
const elapsed = getCurrentTimestamp() - startTime;
```

### ユーザーへの日時表示

日本のユーザー向けには JST フォーマットを使用します。

```typescript
import { formatToJST, formatToJSTShort } from "@my-app/dayjs";

// フルフォーマット: "2024年1月15日 10時30分00秒"
const fullDate = formatToJST(utcDate);

// ショートフォーマット: "2024/01/15"
const shortDate = formatToJSTShort(utcDate);
```

多言語対応の場合:

```typescript
import { formatToLocalizedDate } from "@my-app/dayjs";

// 言語コードに基づいて自動フォーマット
const localizedDate = formatToLocalizedDate(utcDate, "ja"); // 日本語
const localizedDate = formatToLocalizedDate(utcDate, "en"); // 英語
```

### ファイル名の生成

```typescript
import { formatToISODate, formatToFilenameSafeISO, getCurrentUTCDate } from "@my-app/dayjs";

// 日付のみのファイル名: "2024-01-15"
const dateStr = formatToISODate(getCurrentUTCDate());
const filename = `export-${sessionId}-${dateStr}.webm`;

// タイムスタンプ付きファイル名: "2024-01-15T10-30-00-000Z"
const timestamp = formatToFilenameSafeISO(getCurrentUTCDate());
const filename = `recording-${timestamp}.webm`;
```

### 日付フィルタリング

```typescript
import {
  getCurrentUTCDate,
  subtractDays,
  convertToUTCDate,
  isBefore,
} from "@my-app/dayjs";

// 過去7日間のアイテムをフィルタリング
const now = getCurrentUTCDate();
const cutoffDate = subtractDays(now, 7);
const filteredItems = items.filter(
  (item) => !isBefore(convertToUTCDate(item.date), cutoffDate)
);
```

## 利用可能な関数

### 時刻取得

| 関数 | 戻り値の型 | 説明 |
|-----|-----------|------|
| `getCurrentUTCDate()` | `Date` | 現在の UTC 時刻を Date オブジェクトで返す |
| `getCurrentUTCString()` | `string` | 現在の UTC 時刻を ISO 文字列で返す |
| `getCurrentTimestamp()` | `number` | 現在の UTC タイムスタンプをミリ秒で返す |
| `getCurrentYear()` | `number` | 現在の年（UTC）を返す |

### 変換関数

| 関数 | 戻り値の型 | 説明 |
|-----|-----------|------|
| `convertToUTC(input)` | `string` | UTC ISO 文字列に変換する |
| `convertToUTCDate(input)` | `Date` | UTC Date オブジェクトに変換する |
| `convertToUTCTimestamp(input, tz)` | `string` | タイムゾーンから UTC に変換する |

### フォーマット関数

| 関数 | 戻り値の型 | 説明 |
|-----|-----------|------|
| `formatToISODate(input)` | `string` | "YYYY-MM-DD" 形式にフォーマットする |
| `formatToFilenameSafeISO(input)` | `string` | "YYYY-MM-DDTHH-mm-ss-SSSZ" 形式にフォーマットする |
| `formatToJST(input)` | `string` | JST 表示用にフォーマットする（フル） |
| `formatToJSTShort(input)` | `string` | JST 表示用にフォーマットする（YYYY/MM/DD） |
| `formatToLocalizedDate(input, lang)` | `string` | 言語に基づいてフォーマットする |

### 日付演算

| 関数 | 戻り値の型 | 説明 |
|-----|-----------|------|
| `addMillisecondsFromNow(ms)` | `Date` | 現在時刻にミリ秒を加算する |
| `addMinutes(input, minutes)` | `Date` | 日時に分を加算する |
| `subtractDays(input, days)` | `Date` | 日時から日数を減算する |
| `subtractMinutes(input, minutes)` | `Date` | 日時から分を減算する |

### 比較関数

| 関数 | 戻り値の型 | 説明 |
|-----|-----------|------|
| `isBefore(date1, date2)` | `boolean` | date1 が date2 より前かどうかを判定する |

## 対応言語/タイムゾーン

| コード | ロケール | タイムゾーン |
|-------|---------|------------|
| `ja` | ja-JP | Asia/Tokyo |
| `en` | en-US | UTC |
| `ko` | ko-KR | Asia/Seoul |
| `cn` | zh-CN | Asia/Shanghai |
| `tw` | zh-TW | Asia/Taipei |
| `fr` | fr-FR | Europe/Paris |
| `de` | de-DE | Europe/Berlin |
| `es` | es-ES | Europe/Madrid |
| `default` | ja-JP | Asia/Tokyo |

## ネイティブ Date からの移行

### 移行前

```typescript
// これらは使わない
const now = new Date();
const timestamp = Date.now();
const year = new Date().getFullYear();
const isoString = new Date().toISOString();
```

### 移行後

```typescript
import {
  getCurrentUTCDate,
  getCurrentTimestamp,
  getCurrentYear,
  getCurrentUTCString,
} from "@my-app/dayjs";

const now = getCurrentUTCDate();
const timestamp = getCurrentTimestamp();
const year = getCurrentYear();
const isoString = getCurrentUTCString();
```

## テスト

時間依存のコードをテストする場合は、Vitest のフェイクタイマーを使用します。

```typescript
import { beforeEach, afterEach, vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-15T10:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});
```

注意: `@my-app/dayjs` の関数は内部で dayjs を使用しており、モックされたシステム時刻を尊重するため、Vitest のフェイクタイマーで正しく動作します。
