# UI Testing 実装方針

## 目的

- コンポーネントを「ユーザーがどう使うか」の視点で検証する
- DOM 構造の変更に強いテストを作る

## 対象

- `services/web/shared/components/**`
- `services/web/features/**` の Container/Presentational 境界

## 実装ルール

1. Role/Label/Text を優先して要素を取得する
2. `user-event` 相当の操作でイベントを再現する
3. テーブルドリブンで props / state バリエーションを検証する
4. 実装詳細（class名、内部state）ではなく、見える結果を検証する

## モック方針

- デフォルト: モックしない（子コンポーネントも可能な限り実体）
- 例外: ネットワーク境界のみ固定レスポンス化（MSW 等）
- 目的: UIロジックの検証であって、外部SaaSの可用性検証ではない

## クエリ優先順位

1. `getByRole`
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByDisplayValue`
6. `getByTestId`（最後の手段）

## 実行コマンド

- `pnpm --filter web vitest run`

## 参考（一次情報）

- Testing Library Guiding Principles: https://testing-library.com/docs/guiding-principles
- Testing Library Query Priority: https://testing-library.com/docs/queries/about/#priority
- Next.js Testing（Vitest + Testing Library）: https://nextjs.org/docs/app/guides/testing/vitest
