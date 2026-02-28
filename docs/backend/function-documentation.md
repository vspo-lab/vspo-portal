# 関数ドキュメント規約

## 概要

Domain と UseCase の公開関数には JSDoc で仕様を明示します。
これによりコード生成、テスト生成、レビューの精度が向上します。

事前条件と事後条件を明記することで、境界値テストの設計が容易になります。

## 必須項目

### Domain 関数

| タグ | 説明 | 必須 |
|------|------|------|
| `@param` | 引数の意味と制約 | Yes |
| `@returns` | 戻り値の意味 | Yes |
| `@precondition` | 呼び出し前に成立すべき条件 | Yes |
| `@postcondition` | 呼び出し後に保証される条件 | Yes |

### UseCase 関数

Domain 関数の項目に加えて以下が必要です。

| タグ | 説明 | 必須 |
|------|------|------|
| `@idempotent` | 冪等性の有無と理由 | Yes |

## コード例

### Domain 関数

```typescript
/**
 * アイテムをアーカイブ状態に遷移する。
 *
 * @param item - アーカイブ対象のアイテム
 * @returns アーカイブ済みのアイテム
 * @precondition item.status === "active"
 * @postcondition return.status === "archived" && return.archivedAt !== undefined
 */
export const archive = (item: Item): Item => ({
  ...item,
  status: "archived",
  archivedAt: new Date(),
});
```

```typescript
/**
 * アイテム名を更新する。
 *
 * @param item - 更新対象のアイテム
 * @param name - 新しい名前（1文字以上、100文字以下）
 * @returns 名前が更新されたアイテム
 * @precondition name.length >= 1 && name.length <= 100
 * @postcondition return.name === name && return.updatedAt > item.updatedAt
 */
export const updateName = (item: Item, name: string): Item => ({
  ...item,
  name,
  updatedAt: new Date(),
});
```

### UseCase 関数

```typescript
/**
 * アイテムを新規作成する。
 *
 * @param input - 作成パラメータ
 * @returns 作成されたアイテム
 * @precondition input.name.length >= 1
 * @postcondition DB にアイテムが 1 件追加される
 * @idempotent false - 同一入力で複数回呼ぶと重複作成される
 */
export const create = async (input: CreateItemInput): Promise<Result<Item, AppError>> => {
  // ...
};
```

```typescript
/**
 * アイテムのステータスを更新する。
 *
 * @param input - アイテム ID と新しいステータス
 * @returns 更新後のアイテム
 * @precondition 指定 ID のアイテムが存在する
 * @postcondition アイテムのステータスが input.status に変更される
 * @idempotent true - 同一入力で複数回呼んでも結果は同じ
 */
export const updateStatus = async (input: UpdateStatusInput): Promise<Result<Item, AppError>> => {
  // ...
};
```

## テストとの関連

JSDoc の事前条件と事後条件はテスト設計に直結します。

| JSDoc | テストでの役割 |
|-------|--------------|
| `@precondition` | テストケースの前提条件。違反ケースも境界値テストとして追加する |
| `@postcondition` | assertion の根拠。テストの expect 文で検証する |
| `@idempotent` | 冪等なら同一入力の 2 回実行テスト、非冪等なら重複防止の確認 |

### テストへの反映例

```typescript
describe("Item.archive", () => {
  const cases = [
    {
      name: "active アイテムをアーカイブできる",
      input: { ...baseItem, status: "active" as const },
      expected: { status: "archived" },
    },
  ];

  it.each(cases)("$name", ({ input, expected }) => {
    const result = Item.archive(input);
    expect(result.status).toBe(expected.status);
    expect(result.archivedAt).toBeDefined(); // @postcondition
  });

  it("active 以外のアイテムは前提条件に違反する", () => {
    // @precondition 違反のテスト
    const draftItem = { ...baseItem, status: "draft" as const };
    expect(() => Item.archive(draftItem)).toThrow();
  });
});
```

## 関連ドキュメント

- [Server Architecture](./server-architecture.md) - レイヤー構成の全体像
- [UseCase 実装ルール](./usecase-rules.md) - UseCase 層の実装原則
- [Domain Model](./domain-modeling.md) - ドメイン層の設計方針
- [Unit Testing](../testing/unit-testing.md) - テーブルドリブンテストの実装方針
