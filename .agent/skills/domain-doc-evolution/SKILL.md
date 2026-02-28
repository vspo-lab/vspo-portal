---
name: ドメイン仕様育成
description: 機能追加や仕様変更に合わせて docs/domain を更新し、仕様判断の履歴を残す。
user_invocable: true
---

# 概要

実装中にドメイン仕様を継続的に育てるための skill。
コード変更に追従して `docs/domain` の整合を維持する。

# 実行手順

## Step 1: 変更点の把握

- 対象機能と影響範囲（エンティティ / ユースケース / 用語）を特定する
- 既存の `docs/domain/*.md` と矛盾がないか確認する

## Step 2: docs/domain の更新

必要なファイルだけを最小差分で更新する。

- `overview.md`: 目的やスコープが変わる場合のみ更新
- `entities.md`: 属性・ルール・関係の変更を反映
- `usecases.md`: ユースケース追加/変更、優先度更新
- `glossary.md`: 新語追加、同義語整理
- `decisions.md`: 仕様判断を追記

## Step 3: 判断理由の記録

仕様判断が発生したら、`decisions.md` に以下を必ず残す。

1. 決定内容
2. 理由
3. 代替案
4. 影響範囲

# 参照ドキュメント

- `docs/domain/README.md`
- `docs/backend/domain-modeling.md`
- `docs/web-frontend/typescript.md`
