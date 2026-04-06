# Astro Actions パターン改善

## 現状

### Actions 定義 (`src/actions/index.ts`)

```typescript
export const server = {
  addChannel: defineAction({
    accept: "form",
    input: z.object({
      guildId: z.string(),
      channelId: z.string(),
    }),
    handler: async (input, context) => {
      requireAuth(context);
      const result = await AddChannelUsecase.execute({ ... });
      unwrapOrThrow(result);
      return { success: true as const };
    },
  }),
  // updateChannel, resetChannel, deleteChannel も同様
};
```

### ユーティリティ

```typescript
// 各 handler で手動呼び出し
const requireAuth = (context) => {
  if (!context.locals.user) {
    throw new ActionError({ code: "UNAUTHORIZED" });
  }
};

// Result → ActionError 変換
const unwrapOrThrow = <T>(result) => {
  if (result.err) {
    throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: result.err.message });
  }
  return result.val as T;
};
```

### 課題

1. **認証の手動呼び出し**: `requireAuth()` を各ハンドラで呼ぶ必要があり、漏れのリスク
2. **エラーコード不足**: `UNAUTHORIZED` と `INTERNAL_SERVER_ERROR` のみ。`NOT_FOUND`, `BAD_REQUEST` 等の区別なし
3. **入力バリデーション不足**: `guildId` / `channelId` が単なる `z.string()` — Discord Snowflake のフォーマット検証なし
4. **フォームエラー表示**: `isInputError()` / `isActionError()` ユーティリティ未活用
5. **`getActionResult()` 未活用**: フォーム送信後のエラー表示が Flash メッセージのみ

## 改善 1: getActionContext() による認証ゲーティング

### 概要

`getActionContext()` (Astro 5.0+) を middleware 内で使用し、全 Action に対する認証を一元管理。

### 実装

```typescript
// src/middleware.ts
import { getActionContext } from "astro:actions";

const actionAuth = defineMiddleware(async (context, next) => {
  const { action, setActionResult, serializeActionResult } = getActionContext(context);

  // Action リクエストでない場合はスキップ
  if (!action) {
    return next();
  }

  // 全 Action に認証を要求
  if (!context.locals.user) {
    const result = { data: undefined, error: new ActionError({ code: "UNAUTHORIZED" }) };
    setActionResult(action.name, serializeActionResult(result));
    return next();
  }

  // フォーム送信の場合は middleware でハンドラを実行し、結果をセット
  if (action.calledFrom === "form") {
    const result = await action.handler();
    setActionResult(action.name, serializeActionResult(result));
  }

  return next();
});

export const onRequest = sequence(securityHeaders, locale, auth, actionAuth);
```

### Actions 側の変更

```typescript
// Before: 各 handler で requireAuth() 手動呼び出し
handler: async (input, context) => {
  requireAuth(context);  // 忘れるとセキュリティホール
  // ...
}

// After: middleware で保証済み — requireAuth() 削除
handler: async (input, _context) => {
  // 認証は middleware で保証されている
  // ...
}
```

### action.calledFrom の活用

| 値 | 意味 | 用途 |
|---|------|------|
| `"form"` | HTML `<form action={...}>` からの送信 | CSRF 保護あり、middleware でハンドラ実行可能 |
| `"rpc"` | `actions.xxx()` クライアント呼び出し | JSON-RPC 形式 |

## 改善 2: 詳細なエラーコード

### ActionErrorCode 一覧

Astro が提供する全エラーコード:

| コード | HTTP | 用途 |
|--------|------|------|
| `BAD_REQUEST` | 400 | 入力バリデーションエラー |
| `UNAUTHORIZED` | 401 | 未認証 |
| `FORBIDDEN` | 403 | 権限不足 |
| `NOT_FOUND` | 404 | リソースが見つからない |
| `TIMEOUT` | 408 | タイムアウト |
| `CONFLICT` | 409 | 重複操作 |
| `PRECONDITION_FAILED` | 412 | 前提条件不成立 |
| `PAYLOAD_TOO_LARGE` | 413 | ペイロード超過 |
| `TOO_MANY_REQUESTS` | 429 | レートリミット |
| `INTERNAL_SERVER_ERROR` | 500 | サーバーエラー |
| `SERVICE_UNAVAILABLE` | 503 | サービス停止中 |
| `GATEWAY_TIMEOUT` | 504 | 上流タイムアウト |

### 改善例

```typescript
const unwrapOrThrow = <T>(result: Result<T>): T => {
  if (result.err) {
    // エラーの種類に応じた適切なコードを選択
    const code = mapErrorCode(result.err);
    throw new ActionError({ code, message: result.err.message });
  }
  return result.val;
};

const mapErrorCode = (error: AppError): ActionErrorCode => {
  switch (error.type) {
    case "NOT_FOUND": return "NOT_FOUND";
    case "VALIDATION": return "BAD_REQUEST";
    case "PERMISSION": return "FORBIDDEN";
    case "RATE_LIMIT": return "TOO_MANY_REQUESTS";
    default: return "INTERNAL_SERVER_ERROR";
  }
};
```

## 改善 3: 入力バリデーション強化

### Discord Snowflake バリデーション

```typescript
// features/shared/domain/discord.ts
const discordSnowflake = z.string().regex(/^\d{17,20}$/, "Invalid Discord Snowflake ID");

// actions/index.ts
addChannel: defineAction({
  accept: "form",
  input: z.object({
    guildId: discordSnowflake,
    channelId: discordSnowflake,
  }),
  handler: async (input, _context) => { ... },
}),
```

### メリット

- Zod バリデーションエラーが自動的に `isInputError()` で取得可能
- フォーム送信前にクライアント側でも `input` スキーマを共有して検証できる

## 改善 4: フォームエラー表示の改善

### isInputError() の活用

```astro
---
// pages/dashboard/[guildId].astro
import { actions, isInputError } from "astro:actions";

const result = Astro.getActionResult(actions.addChannel);
const inputErrors = isInputError(result?.error) ? result.error.fields : {};
---

{result?.error && !isInputError(result.error) && (
  <div class="alert alert-error">
    {result.error.code === "UNAUTHORIZED"
      ? t.errors.unauthorized
      : t.errors.general}
  </div>
)}

<form method="POST" action={actions.addChannel}>
  <input name="channelId" />
  {inputErrors.channelId && (
    <p class="text-red-500 text-sm">{inputErrors.channelId.join(", ")}</p>
  )}
  <button type="submit">{t.addChannel}</button>
</form>
```

### isActionError() の活用 (React Island)

```tsx
// features/channel/components/ChannelAddForm.tsx
import { actions, isActionError } from "astro:actions";

const handleSubmit = async (formData: FormData) => {
  const { data, error } = await actions.addChannel(formData);

  if (isActionError(error)) {
    switch (error.code) {
      case "UNAUTHORIZED":
        window.location.href = "/";
        break;
      case "BAD_REQUEST":
        setFieldErrors(error.fields ?? {});
        break;
      case "CONFLICT":
        setError("このチャンネルは既に追加されています");
        break;
      default:
        setError("エラーが発生しました");
    }
    return;
  }

  // 成功時の処理
};
```

## 改善 5: orThrow() パターン

### プロトタイピング時の簡略化

```typescript
// 開発時 — エラーハンドリングを後回しにする場合
const data = await actions.addChannel.orThrow({ guildId, channelId });
// data は直接結果を返す (エラー時は例外をスロー)
```

### 本番では data/error パターンを推奨

```typescript
// 本番 — 適切なエラーハンドリング
const { data, error } = await actions.addChannel({ guildId, channelId });
if (error) {
  // エラー処理
  return;
}
// data を使用
```

## 改善 6: View Transitions でのフォーム入力保持

### エラー時の入力値消失問題

フォーム送信エラー時、MPA リロードで入力値が失われる。

### 解決: transition:persist

```astro
<form method="POST" action={actions.updateChannel}>
  <input
    name="channelId"
    value={channelId}
    transition:persist
  />
  <select name="language" transition:persist>
    <option value="ja">日本語</option>
    <option value="en">English</option>
  </select>
  <button type="submit">保存</button>
</form>
```

**前提**: View Transitions (`<ClientRouter />`) が有効であること。

## 移行チェックリスト

- [ ] `getActionContext()` による認証ミドルウェアを追加
- [ ] `requireAuth()` の手動呼び出しを各 Action ハンドラから削除
- [ ] `unwrapOrThrow()` に詳細なエラーコードマッピングを追加
- [ ] Discord Snowflake バリデーションを Zod スキーマに追加
- [ ] `Astro.getActionResult()` + `isInputError()` でフォームエラー表示を改善
- [ ] React Island での `isActionError()` によるエラーハンドリングを実装
- [ ] `transition:persist` でフォーム入力保持を有効化
- [ ] Action ハンドラのレスポンスにビジネスロジック固有のエラーコードを追加
