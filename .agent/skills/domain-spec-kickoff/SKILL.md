---
name: ドメイン仕様キックオフ
description: 1回のヒアリングで docs/domain を初期化し、MVPと未確定事項を整理する。
user_invocable: true
---

# 概要

テンプレートリポジトリを新規プロジェクトとして開始するときに使う skill。
1回のヒアリングで `docs/domain/` をプロジェクト固有に初期化する。

# 実行手順

## Step 1: 一括ヒアリング

以下を1回の質問でまとめて確認する。

1. プロジェクト名（表示名 / 識別子）
2. 解決したい課題と提供価値
3. ターゲットユーザー
4. In Scope / Out of Scope
5. 主要エンティティ（3-5個）
6. MVPユースケース（3-5個）
7. 用語集（ユビキタス言語）
8. 未確定事項と決定期限

## Step 2: docs/domain の初期化

回答をもとに次を更新する。

- `docs/domain/overview.md`
- `docs/domain/entities.md`
- `docs/domain/usecases.md`
- `docs/domain/glossary.md`
- `docs/domain/decisions.md`

未確定事項は `TBD` のままにせず、`usecases.md` または `decisions.md` に論点として残す。

## Step 3: 実装前チェック

更新後に以下を明確化して提示する。

1. MVPで実装する範囲
2. 実装を保留する範囲
3. 次に決めるべき論点（期限付き）

# 参照ドキュメント

- `docs/domain/README.md`
- `docs/backend/domain-modeling.md`
- `docs/web-frontend/typescript.md`
