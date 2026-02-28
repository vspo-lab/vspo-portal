---
name: 実装チェックリスト生成
description: docs/plan/<feature>/ の仕様を読み込み、フェーズ分けされた実装チェックリストを生成する。
user_invocable: true
---

# 概要

`/plan-feature` で生成された仕様ドキュメントを読み込み、ボトムアップの実装チェックリスト（`CHECKLIST.md`）を生成する skill。

# 実行手順

## Step 1: 仕様の読み込み

1. ユーザーに対象の機能名（`docs/plan/<feature>/` のディレクトリ名）を確認する
2. `docs/plan/<feature>/` 内の全 `.md` ファイルを読み込む
3. 仕様の整合性を確認する（未定義の参照、矛盾がないか）

## Step 2: チェックリスト生成

`docs/plan/<feature>/CHECKLIST.md` を `docs/plan/README.md` のチェックリスト構造テンプレートに従って生成する。

- 仕様の内容に応じて各フェーズのチェックリストを具体化する
- 仕様に記載のない層のフェーズは省略する（例: バックエンドのみの機能なら Phase 5 を省略）
- 仕様に `TBD` がある場合は、該当タスクに `[TBD]` を付記する

## Step 3: 実装ガイド提示

生成後に以下を提示する。

1. 全フェーズの概要と推定タスク数
2. 最初に着手すべきフェーズ（Phase 1: Domain Model）
3. フェーズ間の依存関係
4. リマインド: 仕様変更が必要な場合は、まず仕様ドキュメントを更新してからコードを変更する

# ルール

- 実装順序は必ずボトムアップ: Domain → Data Access → UseCase → API → Frontend
- 各フェーズにテストコマンドを含める
- Session Notes は空の状態で生成する（実装時に記録する）
- Session Notes には Done / Next / Risks・TODO の3項目を必ず含める

# 参照ドキュメント

- `docs/plan/README.md`
- `docs/plan/<feature>/` の全仕様ファイル
- `docs/testing/README.md`
- `docs/backend/server-architecture.md`
- `docs/web-frontend/architecture.md`
