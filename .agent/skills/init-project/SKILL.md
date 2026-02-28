---
name: プロジェクト初期化
description: テンプレートから新プロジェクトを立ち上げる。対話でドメイン仕様を策定し docs/domain/ に書き出す。
user_invocable: true
---

# 概要

テンプレートリポジトリを新プロジェクトとして初期化する skill。
`/domain-spec-kickoff` が使える場合はそちらを優先し、未対応環境では本 skill で同等の初期化を行う。

# 実行手順

## Step 1: ヒアリング

以下を1回でまとめて確認する。

1. プロジェクト名（表示名 / 識別子）
2. プロジェクト概要（何を作るか）
3. ターゲットユーザー
4. 主要エンティティ（3-5個）
5. MVPユースケース（3-5個）
6. 用語集（ユビキタス言語）
7. In Scope / Out of Scope
8. 未確定事項と決定期限

## Step 2: ドメインドキュメント生成

回答を元に以下を更新する。

- `docs/domain/overview.md`
- `docs/domain/entities.md`
- `docs/domain/usecases.md`
- `docs/domain/glossary.md`
- `docs/domain/decisions.md`

## Step 3: 置換ガイド出力

`@my-app` をプロジェクト識別子へ置換する対象を案内する。

- `package.json`（root + packages/* + services/*）
- `infrastructure/terraform/`
- `renovate.json` / `renovate/default.json`
- `compose.test.yaml`
- `.github/workflows/`

# 参照ドキュメント

- `docs/domain/README.md`
- `docs/backend/domain-modeling.md`
- `docs/web-frontend/typescript.md`
