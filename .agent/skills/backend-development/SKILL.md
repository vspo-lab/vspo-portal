---
name: バックエンド開発
description: Hono API + Clean Architecture + DDDによるバックエンド開発。ファクトリパターンDI、コンパニオンオブジェクトパターン。
---

# トリガー条件

- `services/api/` 配下のファイルを作成・編集するとき
- 新しいドメインモデル、ユースケース、リポジトリを作成するとき
- API エンドポイントを追加・変更するとき

# 実行チェックリスト

1. UseCase は上から下への逐次実行になっているか確認する
2. UseCase→UseCase 呼び出しがないか確認する
3. Domain/UseCase の公開関数に JSDoc（事前条件・事後条件）を書く
4. 新規ドメインモデルは Zod Schema + コンパニオンオブジェクトで定義する
5. エラーは Result 型で返す（try-catch 禁止）
6. リポジトリは `from({ tx })` パターンで作成する

# 参照ドキュメント

- `docs/backend/server-architecture.md` - Clean Architecture + DDD（Domain/UseCase/Infra層）
- `docs/backend/usecase-rules.md` - UseCase実装ルール（逐次実行、禁止事項、冪等性）
- `docs/backend/domain-modeling.md` - ドメインモデル設計（集約、Zod Schema First、コンパニオンオブジェクト）
- `docs/backend/function-documentation.md` - 関数ドキュメント規約（JSDoc、事前条件・事後条件）
- `docs/backend/api-design.md` - REST API設計原則（リソース指向URL、CRUD命名規則）
- `docs/backend/pr-guidelines.md` - PRガイドライン（現状・問題・実装内容の必須記載）
- `docs/backend/datetime-handling.md` - UTC/JST日時処理
