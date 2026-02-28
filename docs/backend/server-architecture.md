# Server Architecture

## Overview

サーバーは **Clean Architecture** と **Domain-Driven Design (DDD)** の原則に基づいて設計されています。
Hexagonal Architecture (Ports & Adapters) パターンを採用し、ビジネスロジックを外部システムから分離しています。

## ディレクトリ構成

```
services/api/
├── domain/              # ドメイン層 - ビジネスロジック
├── usecase/             # ユースケース層 - アプリケーションロジック
├── infra/               # インフラストラクチャ層 - 外部システムとの接続
│   ├── di/              # 依存性注入コンテナ
│   ├── repository/      # データアクセス層
│   ├── http/            # HTTP/REST API
│   ├── ai/              # AI サービス連携
│   ├── external/        # 外部API連携
│   └── auth/            # 認証
├── cmd/                 # エントリーポイント
└── pkg/                 # 共有ユーティリティ
```

## レイヤー構成

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP Handlers                            │
│                   (Hono + OpenAPI)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Use Case Layer                            │
│              (アプリケーションロジック)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Domain Layer                              │
│                 (ビジネスロジック)                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                 Infrastructure Layer                         │
│     (Repository, AI Service, Message Queue, etc.)           │
└─────────────────────────────────────────────────────────────┘
```

## 設計原則

### 1. 依存性逆転の原則 (DIP)

- 上位レイヤーは下位レイヤーに依存しない
- 抽象（型定義）に依存し、具象（実装）には依存しない
- ドメイン層は他のレイヤーに依存しない

```typescript
// UseCase は Repository の型（抽象）に依存
type Dependencies = Readonly<{
  itemRepository: ItemRepository;  // 型定義
  txManager: TxManager;
}>;

// 具象は DI コンテナで注入
const itemUseCase = ItemUseCase.from({
  itemRepository: ItemRepository,  // 実装
  txManager: TxManager,
});
```

### 2. Result 型によるエラーハンドリング

`try-catch` を使用せず、すべてのエラーを `Result<T, E>` 型で表現します。

```typescript
// Result 型の定義
type Result<T, E extends BaseError> = OkResult<T> | ErrResult<E>;

// 使用例
const itemResult = await itemRepository.from({ tx }).getById(itemId);
if (itemResult.err) {
  return itemResult;  // エラーを伝播
}
const item = itemResult.val;  // 成功時の値
```

**メリット:**
- エラーフローが明示的
- 型システムでエラーハンドリングを強制
- 予期しない例外が発生しにくい

### 3. Zod Schema First

すべての型定義は Zod スキーマから導出します。

```typescript
// スキーマが型の源泉
const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  // ...
});

// 型はスキーマから推論
type Item = z.infer<typeof itemSchema>;
```

### 4. イミュータブルな更新

ドメインオブジェクトは不変で、更新操作は新しいオブジェクトを返します。

```typescript
// 現在のユーザーを更新して新しいユーザーを返す
const updatedUser = Item.update(item, { name: "新しい名前" });
const completedTask = Item.archive(item);
```

---

## Domain Layer

### 集約 (Aggregate)

DDDの集約パターンを採用し、関連するエンティティをグループ化します。

```
domain/
├── [your-domain]/           # アプリケーション固有の集約
│   ├── [aggregate-root].ts  # 集約ルート
│   ├── [entity].ts          # 子エンティティ
│   └── [value-object].ts    # 値オブジェクト
└── [reference-data].ts     # 参照データ（マスタデータなど）
```

### コンパニオンオブジェクトパターン

ドメインモデルは、同名のコンパニオンオブジェクトにファクトリメソッドやビジネスロジックを持ちます。

```typescript
// 型定義
const itemSchema = z.object({ ... });
export type Item = z.infer<typeof itemSchema>;

// コンパニオンオブジェクト（ドメインロジック）
export const Item = {
  new: (props: CreateUserProps): User => { ... },
  update: (user: User, props: UpdateProps): User => { ... },
  recordLogin: (user: User): User => { ... },
} as const;
```

### Discriminated Union

複雑な状態を持つ値オブジェクトは Discriminated Union で表現します。

```typescript
// ItemStatus は status によって異なる型
type ActiveItem = {
  status: "active";
  publishedAt: Date;
  viewCount: number;
  // ...
};

type ArchivedItem = {
  status: "archived";
  archivedAt: Date;
  // ...
};

type DraftItem = {
  status: "draft";
  lastEditedAt: Date;
  // ...
};

type ItemStatus = ActiveItem | ArchivedItem | DraftItem;

// 型ガード
export const ItemStatus = {
  isActive: (item: ItemStatus): item is ActiveItem =>
    item.status === "active",
  isArchived: (item: ItemStatus): item is ArchivedItem =>
    item.status === "archived",
} as const;
```

---

## UseCase Layer

詳細な実装ルールは [UseCase 実装ルール](./usecase-rules.md) を参照。

### ファクトリパターンによる依存性注入

```typescript
type Dependencies = Readonly<{
  itemRepository: ItemRepository;
  txManager: TxManager;
}>;

type ItemUseCaseType = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    getById: (input: GetItemInput) => Promise<Result<Item, AppError>>;
    update: (input: UpdateItemInput) => Promise<Result<Item, AppError>>;
  }>;
}>;

export const ItemUseCase = {
  from: ({ orderRepository, txManager }: Dependencies) => ({
    getById: async ({ itemId }) => {
      return await txManager.runTx(async (tx) => {
        return await itemRepository.from({ tx }).getById(itemId);
      });
    },
    // ...
  }),
} as const satisfies ItemUseCaseType;
```

### トランザクション管理

すべてのデータベース操作は `txManager.runTx()` でトランザクションにラップします。

```typescript
return await txManager.runTx(async (tx) => {
  // 複数のリポジトリ操作が同一トランザクション内で実行される
  const itemRepo = itemRepository.from({ tx });
  const orderRepo = itemRepository.from({ tx });

  const itemResult = await itemRepo.complete(task);
  if (itemResult.err) return taskResult;

  const itemResult = await orderRepo.incrementCount(user);
  if (itemResult.err) return itemResult;

  return Ok(result);
});
```

### 複合操作のオーケストレーション

UseCase は複数のドメイン操作とリポジトリ操作を調整します。

```typescript
// OrderUseCase.completeTask
return await txManager.runTx(async (tx) => {
  // 1. タスクを完了状態に更新
  const completedTask = Item.archive(item);
  await itemRepo.update(completedTask);

  // 2. ユーザーの使用回数をインクリメント
  const updatedUser = User.incrementCount(user);
  await orderRepo.update(updatedUser);

  // 3. 結果のプレースホルダーを作成
  const pendingResult = Result.createPending({ taskId });
  await resultRepo.create(pendingResult);

  // 4. 非同期処理タスクを発行
  await messageQueue.publishProcessingTask({ taskId, resultId });

  return Ok(result);
});
```

---

## Infrastructure Layer

### Repository パターン

リポジトリはファクトリパターンでトランザクションを受け取ります。

```typescript
type Dependencies = Readonly<{ tx: Transaction }>;

export type ItemRepository = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    create: (item: Item) => Promise<Result<Item, AppError>>;
    getById: (id: string) => Promise<Result<Item, AppError>>;
    update: (item: Item) => Promise<Result<Item, AppError>>;
    delete: (id: string) => Promise<Result<Item, AppError>>;
  }>;
}>;
```

### Method Naming Convention for Repository and UseCase

Use **primitive, short method names** when the context makes the operation self-evident.

#### Principle

Since the repository/usecase is already scoped to a specific domain (e.g., `OrderRepository`, `ItemUseCase`), method names should not redundantly include the domain name.

#### Good Examples

```typescript
// OrderRepository - domain context is clear
export type OrderRepository = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    create: (feedback: Feedback) => Promise<Result<Feedback, AppError>>;
    getById: (id: string) => Promise<Result<Feedback, AppError>>;
    update: (feedback: Feedback) => Promise<Result<Feedback, AppError>>;  // ✅ Not "updateFeedback"
    delete: (id: string) => Promise<Result<void, AppError>>;
  }>;
}>;

// ItemUseCase - domain context is clear
const ItemUseCase = {
  from: (deps: Dependencies) => ({
    getById: async (userId: string) => { ... },  // ✅ Not "getById"
    update: async (user: User) => { ... },       // ✅ Not "update"
    delete: async (userId: string) => { ... },   // ✅ Not "deleteUser"
  }),
};
```

#### Bad Examples

```typescript
// ❌ Redundant - "Feedback" is already in the repository name
OrderRepository.updateFeedback(feedback);
OrderRepository.getFeedbackById(id);
OrderRepository.deleteFeedback(id);

// ❌ Redundant - "User" is already in the usecase name
ItemUseCase.getById(id);
ItemUseCase.update(user);
```

#### Exceptions

When methods operate on **related but different entities**, include the entity name for clarity:

```typescript
// OrderRepository may also manage LineItems
export type OrderRepository = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    getById: (id: string) => Promise<Result<Order, AppError>>;
    update: (order: Order) => Promise<Result<Order, AppError>>;
    // LineItems are related entities - include name for clarity
    getLineItemsByOrderId: (orderId: string) => Promise<Result<LineItem[], AppError>>;
    saveLineItems: (orderId: string, items: LineItem[]) => Promise<Result<void, AppError>>;
  }>;
}>;
```

#### Standard CRUD Method Names

| Operation | Method Name | Parameters |
|-----------|-------------|------------|
| Create | `create` | Domain object |
| Read by ID | `getById` | ID string |
| Read multiple | `list`, `getAll`, `findBy*` | Query params |
| Update | `update` | Domain object |
| Delete | `delete` | ID string |
| Check existence | `exists` | ID string |

#### Anti-pattern: Mixing Multiple Domains in One Repository

Do NOT combine multiple domain entities into a single repository. This forces redundant method names and violates single responsibility.

```typescript
// ❌ Bad - Multiple domains in one repository forces verbose naming
export type BillingRepository = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    createSubscription: (subscription: Subscription) => Promise<...>;
    updateSubscription: (subscription: Subscription) => Promise<...>;
    createPaymentHistory: (payment: PaymentHistory) => Promise<...>;
    getPaymentHistoryByUserId: (userId: string) => Promise<...>;
  }>;
}>;

// ✅ Good - Separate repositories with clean naming
export type SubscriptionRepository = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    create: (subscription: Subscription) => Promise<...>;
    update: (subscription: Subscription) => Promise<...>;
    getByUserId: (userId: string) => Promise<...>;
  }>;
}>;

export type PaymentHistoryRepository = Readonly<{
  from: (deps: Dependencies) => Readonly<{
    create: (payment: PaymentHistory) => Promise<...>;
    getByUserId: (userId: string, limit?: number) => Promise<...>;
  }>;
}>;
```

### drizzle-zod スキーマの活用

DB からドメインへの変換には drizzle-zod が生成するスキーマを DTO として活用します。

```typescript
import { selectHighlightsSchema } from "./mysql/schema";

// drizzle-zod スキーマを直接使用
return Ok(selectItemsSchema.parse(result.val[0]));

// 集約の子エンティティにも使用
const toTaskAggregate = (task, steps) => ({
  ...task,
  steps: steps.map((row) => selectStepsSchema.parse(row)),
});
```

### N+1 問題の回避

複数の関連エンティティは一括取得してクライアント側でグループ化します。

```typescript
// Good: 一括取得
const taskIds = tasks.map((t) => t.id);
const stepsResult = await tx
  .select()
  .from(stepsTable)
  .where(inArray(stepsTable.taskId, taskIds));

// グループ化
const stepsByTaskId = new Map<string, SelectStep[]>();
for (const step of stepsResult.val) {
  const existing = stepsByTaskId.get(step.taskId) ?? [];
  existing.push(step);
  stepsByTaskId.set(step.taskId, existing);
}

// Bad: N+1 クエリ
for (const task of tasks) {
  const steps = await tx
    .select()
    .from(stepsTable)
    .where(eq(stepsTable.taskId, task.id));
}
```

### 集約の永続化

集約ルートとその子エンティティをアトミックに保存します。

```typescript
saveAggregate: async (task: Task) => {
  // 1. タスクヘッダーを更新
  await tx.update(tasksTable)
    .set({ status: task.status, ... })
    .where(eq(tasksTable.id, task.id));

  // 2. 既存の steps を削除
  await tx.delete(stepsTable)
    .where(eq(stepsTable.taskId, task.id));

  // 3. 新しい steps を挿入
  if (task.steps.length > 0) {
    await tx.insert(stepsTable)
      .values(task.steps.map(step => ({ ... })));
  }

  return Ok(task);
}
```

---

## 依存性注入 (DI)

### 手動によるファクトリベース DI

外部の DI フレームワークを使用せず、手動でコンテナを構築します。

```typescript
// infra/di/container.ts
export const createContainer = (): Container => {
  // 1. インフラストラクチャ層のインスタンス化
  const txManager = TxManager;
  const orderRepository = UserRepository;
  const orderRepository = OrderRepository;

  // 2. ユースケース層のインスタンス化（依存性を注入）
  const itemUseCase = ItemUseCase.from({
    orderRepository,
    txManager,
  });

  const orderUseCase = OrderUseCase.from({
    itemRepository,
    txManager,
  });

  // 3. コンテナを返却
  return {
    userUseCase,
    orderUseCase,
    // ...
  };
};
```

### Hono ミドルウェアでの注入

```typescript
// HTTP リクエストごとにコンテナを注入
app.use("*", async (c, next) => {
  const container = createContainer();
  c.set("container", container);
  await next();
});

// ハンドラーで使用
app.openapi(route, async (c) => {
  const container = c.get("container");
  const result = await container.userUseCase.getById({ itemId });
  // ...
});
```

---

## エラーハンドリング

### AppError

```typescript
class AppError extends BaseError {
  constructor(params: {
    message: string;
    code: ErrorCode;
    cause?: unknown;
    context?: Record<string, unknown>;
  }) { ... }
}

// エラーコード
type ErrorCode =
  | "NOT_FOUND"
  | "NOT_UNIQUE"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INTERNAL_SERVER_ERROR";
```

### wrap ユーティリティ

Promise を Result 型に変換します。

```typescript
const result = await wrap(
  tx.select().from(itemsTable).where(eq(itemsTable.id, id)).limit(1),
  (err) => new AppError({
    message: "Failed to get item",
    code: "INTERNAL_SERVER_ERROR",
    cause: err,
  }),
);
```

### HTTP エラーハンドリング

グローバルエラーハンドラーで AppError を HTTP レスポンスに変換します。

```typescript
// エラーコードから HTTP ステータスへのマッピング
const statusMap: Record<ErrorCode, number> = {
  NOT_FOUND: 404,
  NOT_UNIQUE: 409,
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
};

// レスポンス形式
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "requestId": "req_abc123"
  }
}
```

---

## 外部サービス連携

### AI サービス

```typescript
// infra/ai/contentGenerator.ts
export const ContentGenerator = {
  generate: async (params: GenerateParams): Promise<Result<ContentOutput, AppError>> => {
    // 1. プロンプト構築
    const prompt = buildPrompt(params);

    // 2. AI サービス API 呼び出し
    const response = await aiClient.generateContent(prompt);

    // 3. レスポンスをパース・バリデーション
    const parsed = contentOutputSchema.safeParse(response);
    if (!parsed.success) {
      return Err(new AppError({ ... }));
    }

    // 4. ドメインオブジェクトに変換
    const items = ContentItem.fromAIOutput(parsed.data);
    return Ok({ items, ... });
  },
};
```

### メッセージキュー

非同期処理にはメッセージキューを使用します。

```typescript
// タスク発行
await messageQueue.publishProcessingTask({
  itemId,
  requestId,
});

// ワーカーでの購読
await messageQueue.subscribe(async (message) => {
  const task = processingTaskSchema.parse(message.data);
  await contentGenerator.generate(task);
  message.ack();
});
```

---

## テスト戦略

### レイヤー別テスト

| レイヤー | テスト対象 | アプローチ |
|---------|-----------|-----------|
| Domain | ビジネスロジック | 純粋な単体テスト |
| UseCase | オーケストレーション | モックリポジトリを使用 |
| Repository | データアクセス | テスト用DBを使用 |
| HTTP | API エンドポイント | 統合テスト |

### 依存性のモック

ファクトリパターンにより、テスト時に依存性を差し替え可能です。

```typescript
const mockItemRepository = {
  from: () => ({
    getById: async () => Ok(mockItem),
    update: async (item) => Ok(item),
  }),
};

const useCase = ItemUseCase.from({
  orderRepository: mockItemRepository,
  txManager: mockTxManager,
});
```

---

## まとめ

このアーキテクチャの主な特徴：

1. **明確なレイヤー分離**: Domain/UseCase/Infrastructure の責務が明確
2. **型安全性**: Zod スキーマと TypeScript による完全な型推論
3. **エラーハンドリング**: Result 型による明示的なエラーフロー
4. **テスタビリティ**: ファクトリパターンによる依存性の差し替え
5. **トランザクション管理**: 複数操作のアトミック性を保証
6. **イミュータブル更新**: 予測可能な状態管理
7. **集約パターン**: 整合性境界の明確化
