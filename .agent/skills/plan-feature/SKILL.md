---
name: 機能仕様策定
description: あいまいな要件から docs/plan/<feature>/ に構造化された仕様ドキュメントを生成する。
user_invocable: true
---

# 概要

機能開発の仕様を策定する skill。
あいまいな要件をヒアリングし、Clean Architecture のレイヤーに沿った仕様ドキュメントを `docs/plan/<feature>/` に生成する。

# 実行手順

## Step 1: 要件ヒアリング

以下を1回の質問でまとめて確認する。

1. 機能名（英語ケバブケース: 例 `user-profile`）
2. 機能の目的と背景（なぜ作るのか）
3. 対象ユーザーと利用シナリオ
4. In Scope / Out of Scope
5. 影響するエンティティ（新規 or 既存変更）
6. 主要ユースケース（1-5個）
7. API エンドポイント（想定）
8. フロントエンドの画面構成（想定）
9. 未確定事項

## Step 2: 仕様ドキュメント生成

回答をもとに `docs/plan/<feature>/` に以下のファイルを作成する。
各ファイルの記載項目は `docs/plan/README.md` の仕様ファイル概要を参照すること。

- `00_OVERVIEW.md` - 機能概要、目的、スコープ
- `01_DOMAIN_MODEL.md` - エンティティ変更、ビジネスルール
- `02_DATA_ACCESS.md` - リポジトリ・DB変更
- `03_USECASE.md` - UseCase層の変更
- `04_API_INTERFACE.md` - APIエンドポイント仕様
- `05_FRONTEND.md` - フロントエンドUI仕様

バックエンドのみ/フロントエンドのみの場合は不要なファイルを省略してよい。
未確定の部分は `TBD` と明記する。

## Step 3: 仕様レビューサマリー

生成後に以下を提示する。

1. 生成したファイル一覧
2. 確定事項のサマリー
3. 未確定事項と次に決めるべき論点
4. `docs/domain/` への反映が必要な場合の案内

# ルール

- 仕様は `docs/plan/<feature>/` に集約する（他の場所に分散させない）
- エンティティ定義は Zod Schema First（`docs/backend/domain-modeling.md` 準拠）
- 重要な判断は `docs/domain/decisions.md` にも転記を案内する

# 参照ドキュメント

- `docs/plan/README.md`
- `docs/domain/README.md`
- `docs/backend/server-architecture.md`
- `docs/backend/domain-modeling.md`
- `docs/backend/api-design.md`
- `docs/web-frontend/architecture.md`
