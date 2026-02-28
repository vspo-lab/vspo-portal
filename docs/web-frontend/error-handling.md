# Result-based Error Handling

This project uses a `Result` type to unify error handling without `try-catch` in
application code. Asynchronous boundaries are wrapped with `wrap`, which returns
`Ok` or `Err`.

## Implementation

[result.ts](../packages/errors/result.ts)
[base.ts](../packages/errors/base.ts)
[error.ts](../packages/errors/error.ts)

## Usage
Example:

```ts
// third-party async function with potential to throw
const textResult = await wrap(
  response.text(),
  (error) =>
    new AppError({
      message: "Failed to read asset text",
      code: "INTERNAL_SERVER_ERROR",
      cause: error,
    }),
);

if (textResult.err) {
  return Err(textResult.err);
}

return Ok(textResult.val);
```

## How It Works
`Result<T, E>`: A union type where success holds `val` and failure holds `err`.

`wrap`: Takes a promise, awaits it, and returns `Ok(val)` or `Err(err)` with
the error created by `errorFactory`.

Benefit: This keeps error handling concise and type-safe for async operations.

## Benefits
- Type Safety: TypeScript narrows based on `result.err`.
- Simplicity: Replaces verbose try/catch blocks for promises.
- Flexibility: Customize error types with `AppError` or domain errors.

## Async Handling Rules

**Always use `await`, never use `.then()`**

```ts
// ✅ Good: Use await
const result = await wrap(fetchData(), errorFactory);

// ❌ Bad: Don't use .then()
wrap(fetchData(), errorFactory).then((result) => { ... });
```

Reason:
- `await` makes control flow explicit and easier to follow
- Error handling with Result type works naturally with `await`
- `.then()` chains lead to nested callbacks and harder debugging

Notes
- Use `wrap` at async boundaries; avoid `try-catch` in app logic.
- `wrap` treats thrown values as `Error`; refine the factory if you need stricter typing.

---

## Domain Error Handling

ドメイン固有のエラーをフロントエンドで適切に表示するためのエラーハンドリング設計。

### 設計方針

1. **ドメインエラーは数値コード**: `E1001`形式（4桁、ドメインプレフィックス付き）
2. **汎用エラーは既存のまま**: `BAD_REQUEST`, `NOT_FOUND`等は変更しない
3. **サーバーのmessageは開発者向け**: ユーザーには表示しない（デバッグ用）
4. **フロントエンドでメッセージ制御**: エラーコードごとにユーザー向けメッセージを管理
5. **型安全なcontext**: エラーコードごとに異なるcontextスキーマを定義

### エラーコード体系

```
E1xxx - リソース関連
  E1001: リソース期限切れ
  E1002: リソース未作成/進行中ではない
  E1003: リソース処理済み

E2xxx - リソース制限関連
  E2001: リソース上限超過
  E2002: リソース利用期限切れ

E3xxx - Auth関連
  E3001: 認証コード期限切れ
  E3002: 認証コード不正

E4xxx - バリデーション関連
  E4001: 必須設定未完了
  E4002: 必須項目未検証
```

### アーキテクチャ

```
packages/errors/
├── code.ts           # 汎用+ドメインの統合ErrorCodeSchema
├── domain-code.ts    # ドメインエラーコード定義（E1xxx〜E4xxx）
├── domain-context.ts # エラーコードごとのcontext型定義
└── error.ts          # AppError（ドメインコード対応）

services/api/
└── infra/http/hono/error.ts  # contextを含むエラーレスポンス返却

services/web/
└── shared/lib/
    ├── errors/
    │   ├── error-messages.ts    # エラーコード→ユーザー向けメッセージ
    │   └── api-error-handler.ts # エラー解決・context補間ロジック
    └── parseResponse.ts         # 構造化エラーレスポンス対応
```

### エラーレスポンス形式

```json
{
  "error": {
    "code": "E2001",
    "message": "User xxx exceeded resource limit",
    "requestId": "req_xxx",
    "context": {
      "resourceType": "item",
      "limit": 100,
      "currentUsage": 100
    }
  }
}
```

- `code`: エラーコード（汎用 or ドメイン）
- `message`: 開発者向けデバッグメッセージ（ユーザーには表示しない）
- `requestId`: エラー追跡用ID
- `context`: ドメインエラーの場合のみ、型安全なコンテキスト情報

### サーバー側の使用例

```typescript
// services/api/usecase/item.ts
import { AppError, Err } from "@my-app/errors";

// リソース上限超過
if (currentUsage >= resourceLimit) {
  return Err(
    new AppError({
      code: "E2001",
      message: `User ${userId} exceeded resource limit`,
      context: {
        resourceType: "item",
        limit: resourceLimit,
        currentUsage,
      },
    }),
  );
}

// リソース期限切れ
if (resource.isExpired()) {
  return Err(
    new AppError({
      code: "E1001",
      message: `Resource ${resourceId} expired`,
      context: {
        resourceId,
        expiredAt: resource.expiredAt.toISOString(),
      },
    }),
  );
}
```

### フロントエンド側の使用例

```typescript
// features/item/hooks/useItem.ts
const createItem = async () => {
  const result = await itemApi.create(data);

  if (result.err) {
    // userFacingErrorはparseResponseで自動生成される
    const userError = result.err.context?.userFacingError;

    toast.error(userError?.title ?? "エラー", {
      description: userError?.description ?? result.err.message,
    });

    // エラーコードに応じたアクション
    if (result.err.code === "E2001") {
      router.push("/");
    }
    return;
  }

  setItem(result.val);
};
```

### エラーメッセージの追加方法

1. **エラーコードを追加** (`packages/errors/domain-code.ts`)
```typescript
export const DomainErrorCodeSchema = z.enum([
  // ...既存のコード
  "E1004", // 新しいエラーコード
]);
```

2. **context型を定義** (`packages/errors/domain-context.ts`)
```typescript
export const DomainErrorContextSchemas = {
  // ...既存の定義
  E1004: z.object({
    someField: z.string(),
  }),
};
```

3. **ユーザー向けメッセージを追加** (`services/web/shared/lib/errors/error-messages.ts`)
```typescript
export const ERROR_MESSAGES = {
  // ...既存のメッセージ
  E1004: {
    title: "エラータイトル",
    description: (ctx) => `動的メッセージ: ${ctx.someField}`,
    action: "推奨アクション",
  },
};
```

### 関連ファイル

- [domain-code.ts](../packages/errors/domain-code.ts) - ドメインエラーコード定義
- [domain-context.ts](../packages/errors/domain-context.ts) - context型定義
- [error-messages.ts](../services/web/shared/lib/errors/error-messages.ts) - ユーザー向けメッセージ
