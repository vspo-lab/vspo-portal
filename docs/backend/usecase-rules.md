# UseCase 実装ルール

## 概要

UseCase は「何を、どの順で実行するか」を宣言的に記述するオーケストレーション層です。
ビジネスロジックは Domain に、副作用は Infrastructure に委譲します。

UseCase の理想形は**上から下へ関数を 1 つずつ呼ぶだけ**の実装です。

## 基本原則: 上から下への逐次実行

UseCase 関数は上から順に関数を 1 つずつ実行します。
条件分岐はドメイン関数の前後での早期リターンに限定し、ネストを浅く保ちます。

### Good: 宣言的な逐次実行

```typescript
const createItem = async (input: CreateItemInput): Promise<Result<Item, AppError>> => {
  return await txManager.runTx(async (tx) => {
    // 1. バリデーション
    const validated = ItemInput.validate(input);
    if (!validated) {
      return Err(new AppError({ code: "VALIDATION_ERROR", message: "Invalid input" }));
    }

    // 2. ドメインオブジェクト生成
    const item = Item.new(validated);

    // 3. 永続化
    const saveResult = await itemRepository.from({ tx }).create(item);
    if (saveResult.err) return saveResult;

    return Ok(saveResult.val);
  });
};
```

### Bad: ループ内に複数の条件分岐

ループ内に複数の条件分岐や処理がある実装は黄色信号です。
ドメイン関数に抽出して UseCase をフラットに保ちます。

```typescript
// ❌ Bad: ループ内分岐が複雑
const processItems = async (items: Item[]) => {
  for (const item of items) {
    if (item.status === "active") {
      if (item.type === "premium") {
        await handlePremium(item);
      } else {
        await handleStandard(item);
      }
    } else if (item.status === "pending") {
      await handlePending(item);
    }
  }
};

// ✅ Good: ドメインに委譲して UseCase はフラット
const processItems = async (items: Item[]) => {
  const grouped = Item.groupByAction(items);

  const premiumResult = await itemRepository.from({ tx }).bulkUpdate(grouped.premium);
  if (premiumResult.err) return premiumResult;

  const standardResult = await itemRepository.from({ tx }).bulkUpdate(grouped.standard);
  if (standardResult.err) return standardResult;

  return Ok(undefined);
};
```

## 禁止ルール

### 1. UseCase から UseCase を呼ばない

UseCase 間の依存は暗黙の結合を生みます。共通ロジックは Domain 関数に抽出します。

```typescript
// ❌ Bad: UseCase から UseCase を呼ぶ
const orderUseCase = OrderUseCase.from(deps);
const result = await orderUseCase.create(input); // UseCase→UseCase

// ✅ Good: 共通ロジックは Domain に抽出
const order = Order.new(input);
const result = await orderRepository.from({ tx }).create(order);
```

### 2. UseCase 内で環境変数に直接アクセスしない

環境依存は DI コンテナで注入します。UseCase は純粋なオーケストレーションに徹します。

```typescript
// ❌ Bad: 環境変数を直接参照
const apiKey = process.env.API_KEY;

// ✅ Good: DI で注入
type Dependencies = Readonly<{
  config: AppConfig; // 環境変数は config 経由
  itemRepository: ItemRepository;
}>;
```

### 3. UseCase 内で直接メッセージキューや PubSub を操作しない

副作用は Infrastructure のインターフェース経由で実行します。

```typescript
// ❌ Bad: 直接 publish
await pubsub.topic("items").publish(message);

// ✅ Good: インターフェース経由
await messageQueue.publishItemCreated({ itemId });
```

## 冪等性の文書化

UseCase 関数には冪等性の有無を JSDoc で明示します。
これによりレビュー時に冪等性を考慮した指摘が行えるようになります。

```typescript
/**
 * アイテムを作成する。
 *
 * @idempotent false - 同一入力で複数回呼ぶと重複作成される
 */
const create = async (input: CreateItemInput): Promise<Result<Item, AppError>> => {
  // ...
};

/**
 * アイテムのステータスを更新する。
 *
 * @idempotent true - 同一入力で複数回呼んでも結果は同じ
 */
const updateStatus = async (input: UpdateStatusInput): Promise<Result<Item, AppError>> => {
  // ...
};
```

## 関連ドキュメント

- [Server Architecture](./server-architecture.md) - レイヤー構成の全体像
- [関数ドキュメント規約](./function-documentation.md) - JSDoc の書き方
- [Domain Model](./domain-modeling.md) - ドメイン層の設計方針
