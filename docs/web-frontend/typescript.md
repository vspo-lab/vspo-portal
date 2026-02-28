# TypeScript Type System Usage Instructions

## 基本方針

1. Zod スキーマを型定義の Single Source of Truth として使用する
2. 明示的な interface ではなく、スキーマから型を推論する
3. ユーティリティではジェネリクスを使い、アプリコードを JavaScript ライクに保つ
4. 推論による型の流れを確保し、冗長なアノテーションを避ける
5. `as` はライブラリ境界に限定し、アプリロジックでは使わない
6. やむを得ない `as` は utils に隔離し、コメントを残す

## TypeScript 実装

### Schema-First 開発

- Zod スキーマをデータ構造の Single Source of Truth として定義する
- `z.infer<typeof schemaName>` でスキーマから TypeScript 型を推論する
- スキーマを拡張する場合は、ベーススキーマをインポートして `z.extend()` やユニオン型を使用する
- 複雑な型にはスキーマ合成を使用する

例:

```typescript
// ベーススキーマ（Single Source of Truth）
const baseSchema = z.object({
  id: z.string(),
  createdAt: z.date()
});

// 拡張スキーマ
const extendedSchema = baseSchema.extend({
  additionalField: z.boolean()
});

// 推論された型
type Base = z.infer<typeof baseSchema>;
type Extended = z.infer<typeof extendedSchema>;
```

### 型安全性

- `tsconfig.json` で `strict` を有効にして型安全性を最大化する
- スキーマ/型のバリエーションには `Partial`, `Pick`, `Omit` を活用する
- ライブラリ内の動的な変換にはマッピング型を使用する
- `as` は utils に隔離し、アプリロジックでは使わない
- 早期リターンによる制御フロー解析で型の絞り込みを行う
- **オブジェクトリテラルの型チェックには `satisfies` を使用する**（以下参照）

### `satisfies` オペレータによるオブジェクトリテラルの型チェック

オブジェクトリテラルを定義する際は、型アノテーション（`: Type`）ではなく `satisfies` を常に使用します。型の広がり（widening）を防ぎつつ、コンパイル時の型チェックを維持できます。

**`satisfies` を使う理由:**

1. コンパイル時にオブジェクトの形状を検証する（プロパティの過不足を検出）
2. リテラル型を保持する（例: `"candidate"` が `string` に広がらない）
3. Discriminated Union の網羅性チェックが有効になる
4. API レスポンス変換時のフィールド漏れバグを防ぐ

**パターン: 型アノテーションの代わりに `satisfies` を使用する**

```typescript
// ❌ BAD: 型アノテーションはリテラル型を広げる
const turn: LiveTranscript = {
  role: "candidate",  // 型が string になる（"candidate" ではなく）
  text: "Hello"
};

// ✅ GOOD: satisfies はリテラル型を保持する
const turn = {
  role: "candidate",  // 型は "candidate"（リテラル）
  text: "Hello"
} satisfies LiveTranscript;
```

**パターン: 関数の戻り値での `satisfies`**

```typescript
// ❌ BAD: プロパティ不足が定義箇所で検出されない
function createProfile(): UserProfile {
  return {
    name: "John",
    // 'email' を忘れている - エラーが呼び出し側で出る
  };
}

// ✅ GOOD: satisfies がエラーを即座に検出する
function createProfile(): UserProfile {
  return {
    name: "John",
    // error: Property 'email' is missing
  } satisfies UserProfile;
}
```

**パターン: Discriminated Union**

```typescript
// ✅ GOOD: satisfies がリテラル型を保持し、判別が可能になる
function processResult(success: boolean) {
  if (success) {
    return { isMerged: true, data: result } satisfies MergeResult;
  }
  return { isMerged: false, error: "Failed" } satisfies MergeResult;
}
```

**パターン: 設定オブジェクト**

```typescript
// ✅ GOOD: 推論を保持しつつ設定の形状を検証する
const config = {
  apiEndpoint: "/api/v1",
  timeout: 5000,
  retries: 3,
} satisfies ApiConfig;
```

**`satisfies` を使うべき場合:**

- すべてのオブジェクトリテラル代入: `const x = {...} satisfies Type`
- オブジェクトリテラルを含む return 文: `return {...} satisfies Type`
- 設定オブジェクトと定数
- API レスポンスの変換
- Discriminated Union 型のオブジェクト

**型アノテーションが適切な場合:**

- 初期値なしの変数宣言: `let x: Type;`
- 関数パラメータ: `function foo(x: Type)`
- ジェネリクスの型パラメータ: `useState<Type>()`

### スキーマパターン

1. **フィールド選択パターン**:

```typescript
// ベーススキーマ
const dataSchema = z.object({ /* ... */ });

// 選択スキーマ
const selectionSchema = z.object({
  field1: z.boolean().optional(),
  field2: z.union([z.boolean(), z.array(z.number())]).optional()
});

type Selection = z.infer<typeof selectionSchema>;
```

2. **メタデータパターン**:

```typescript
const MetadataSchema = z.object({
  total: z.number(),
  results: z.array(z.object({
    status: z.enum(["success", "failed"]),
    data: z.any()
  }))
});

type Metadata = z.infer<typeof MetadataSchema>;
```

### ベストプラクティス

1. ベーススキーマは必ずその Single Source of Truth からインポートする
2. 型の合成よりスキーマの合成を優先する
3. Zod の組み込みバリデーションを活用する
4. バリデーションロジックはスキーマ定義に含める
5. 複雑な状態のハンドリングには Discriminated Union を使用する

複雑なパターンの例:

```typescript
// タスク結果パターン
const TaskResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    data: z.any()
  }),
  z.object({
    ok: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string()
    })
  })
]);

type TaskResult = z.infer<typeof TaskResultSchema>;
```
