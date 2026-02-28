---
name: コードレビュー
description: アーキテクチャルールに基づくPR/コードレビュー。UseCase実装ルール、Result型、JSDoc規約の違反を検出する。
user_invocable: true
---

# トリガー条件

- ユーザーからコードレビューを依頼されたとき
- PR の差分を確認するとき

# レビューチェックリスト

## アーキテクチャ違反

1. UseCase から UseCase を呼んでいないか
2. UseCase 内で環境変数に直接アクセスしていないか
3. UseCase 内で直接 PubSub/メッセージキューを操作していないか
4. UseCase が「上から下への逐次実行」になっているか
5. ループ内に複数条件分岐がないか

## コード規約

6. try-catch を使っていないか（Result 型必須）
7. interface を直接定義していないか（Zod Schema First）
8. Domain/UseCase の公開関数に JSDoc（事前条件・事後条件）があるか
9. UseCase 関数に冪等性（`@idempotent`）が記述されているか

## テスト

10. Domain 関数の追加・変更にテストが伴っているか

# 出力形式

各指摘を以下の形式で出力する:

- `違反箇所`: ファイルパス + 行番号
- `違反ルール`: docs/ 内の該当ドキュメント + セクション名
- `違反内容`: 1 文で具体化
- `修正案`: 最小変更での修正方針

ルール出典を示せない場合は「改善提案」として分離し、違反指摘として断定しない。

# 参照ドキュメント

- `docs/backend/usecase-rules.md` - UseCase実装ルール
- `docs/backend/function-documentation.md` - 関数ドキュメント規約
- `docs/backend/server-architecture.md` - アーキテクチャ全体
- `docs/backend/domain-modeling.md` - ドメインモデル設計
- `docs/backend/pr-guidelines.md` - PRガイドライン
- `docs/security/lint.md` - Lint / Quality Check
