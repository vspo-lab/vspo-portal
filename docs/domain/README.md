# ドメイン仕様

プロジェクト固有のドメイン知識をここに集約する。

## 構成

| ファイル | 内容 |
| --- | --- |
| `overview.md` | プロジェクト概要・ビジョン・ターゲットユーザー・非機能要件 |
| `entities.md` | ドメインエンティティ・集約・関係・ルール |
| `usecases.md` | ユースケース一覧・優先度（MVP/Phase2/Phase3） |
| `glossary.md` | 用語集（ユビキタス言語） |
| `decisions.md` | 仕様決定ログ（なぜその仕様にしたか） |

## 作成・更新フロー

1. 初回仕様策定: `/domain-spec-kickoff`
2. 実装中の仕様育成: `/domain-doc-evolution`
3. 仕様変更が発生したら、まず `docs/domain` を更新してからコードを変更

## 方針

- このディレクトリをドメイン知識の Single Source of Truth とする
- エンティティ定義は Zod Schema First (`docs/web-frontend/typescript.md` 参照)
- 重要な仕様判断は `decisions.md` に理由付きで残す
- 未確定事項は `TBD` と明記し、次アクションを `usecases.md` または `decisions.md` に記録する

## 関連

- `docs/plan/` - 機能単位の仕様ドキュメント（Spec-Driven Development）
