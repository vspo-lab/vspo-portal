---
name: ドキュメント更新
description: コード変更に伴う docs/ の更新。docs/ を常に最新に保つ。
---

# トリガー条件

- 新機能の実装やアーキテクチャ変更を行った後
- 既存の仕様・規約を変更した後
- ユーザーから docs の更新を依頼されたとき

# ルール

- `docs/` が全ての技術ドキュメントの Single Source of Truth
- コード変更に伴い、関連する docs/ ファイルを必ず更新する
- 新しい概念・パターンを導入した場合は、対応する docs/ ファイルを新規作成する
- Skills の SKILL.md は docs/ へのポインタのみ。詳細を skills に書かない

# docs 構成

- `docs/domain/` - ドメイン仕様（概要、エンティティ、ユースケース、用語集）
- `docs/plan/` - 機能仕様（Spec-Driven Development、機能ごとの仕様・チェックリスト）
- `docs/testing/` - テスト実装方針（Unit/Integration/API/UI/VRT/E2E）
- `docs/web-frontend/` - フロントエンド（アーキテクチャ、hooks、CSS、a11y、テスト、エラーハンドリング、TypeScript）
- `docs/backend/` - バックエンド（サーバーアーキテクチャ、ドメインモデル、API設計、UseCase実装ルール、関数ドキュメント規約、PRガイドライン、日時処理）
- `docs/design/` - デザインシステム（トークン、カラー、タイポグラフィ、UIパターン、原則、a11y）
- `docs/infra/` - インフラ（Terraform、tfaction、CI/CD）
- `docs/security/` - セキュリティ（lint、スキャン）
