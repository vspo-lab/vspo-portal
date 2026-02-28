# Unit Testing 実装方針

## 目的

- 純粋関数・ドメインモデル・小さなユースケースの振る舞いを高速に保証する
- 仕様の粒度を小さく保ち、TDD の最短フィードバックループを回す

## 対象

- `packages/*` の純粋ロジック
- `services/api/domain/**` のドメインロジック
- `services/web/shared/lib/**` のユーティリティ

## 実装ルール

1. 1テスト1振る舞いを守る
2. `it.each` / `test.each` によるテーブルドリブンを標準にする
3. `Red -> Green -> Refactor` を1ケースずつ進める
4. 実装詳細（private関数、内部state）ではなく、入出力契約を検証する

## モック方針

- デフォルト: モックしない
- 許可: 時刻、乱数、外部通信のような非決定要素のみ最小限で固定する
- 禁止: 内部モジュールの過剰モックで実装詳細に結びつけること

## テーブルドリブンの基本形

```ts
import { describe, expect, it } from "vitest";

describe("normalizeText", () => {
  const cases = [
    { name: "trim only", input: "  foo  ", expected: "foo" },
    { name: "collapse spaces", input: "foo   bar", expected: "foo bar" },
  ];

  it.each(cases)("$name", ({ input, expected }) => {
    expect(normalizeText(input)).toBe(expected);
  });
});
```

## 実行コマンド

- 全体: `pnpm test:unit`
- APIのみ: `pnpm --filter api test:run`
- Webのみ: `pnpm --filter web vitest run`

## 参考（一次情報）

- Vitest `test.each`: https://vitest.dev/api/#test-each
- Vitest Mocking（過剰モックの注意）: https://vitest.dev/guide/mocking.html
- t_wada方針: `docs/web-frontend/twada-tdd.md`
