# Lint / Quality Check

## 概要

このドキュメントは、リポジトリで実施する品質チェックの最小セットを定義します。  
コードとドキュメントの両方で、PR前に同じ手順を実行してください。

## 必須チェック（全変更共通）

変更後は、次のコマンドを必ず実行します。

```bash
./scripts/post-edit-check.sh
```

`post-edit-check.sh` は以下を順に実行します。

```bash
pnpm build
pnpm biome
pnpm textlint
pnpm knip
pnpm type-check
pnpm test
pnpm security-scan
```

## ドキュメント変更時の追加チェック

`docs/` を更新した場合は、次も確認してください。

1. [docs/design/writing.md](../design/writing.md) の執筆ルールに沿っている
2. 見出し構造（`#` -> `##` -> `###`）が崩れていない
3. 用語のゆれがない（同じ概念は同じ語を使う）
4. 参照リンクが存在し、相対パスが正しい
5. `pnpm textlint` が成功する

textlint の運用方針と導入例は [docs/security/textlint.md](./textlint.md) を参照してください。

## アーキテクチャ lint ルール（AI レビュー対象）

以下のルールは自動 lint では完全に検出できませんが、コードレビューで確認します。
`/code-review` スキルがこれらのルールをチェックします。

| ルール | 対象 | 検出方法 |
| --- | --- | --- |
| UseCase→UseCase 呼び出し禁止 | `usecase/` | AI レビュー |
| UseCase 内の環境変数直接参照禁止 | `usecase/` | AI レビュー + grep `process.env` |
| UseCase 内の直接メッセージキュー操作禁止 | `usecase/` | AI レビュー |
| Domain 関数に JSDoc（事前条件・事後条件）必須 | `domain/` | AI レビュー |
| UseCase 関数に冪等性（`@idempotent`）記述必須 | `usecase/` | AI レビュー |
| try-catch 禁止（Result 型必須） | 全体 | AI レビュー |
| interface 直接定義禁止（Zod Schema First） | 全体 | AI レビュー |

詳細は以下を参照してください。

- [UseCase 実装ルール](../backend/usecase-rules.md)
- [関数ドキュメント規約](../backend/function-documentation.md)
