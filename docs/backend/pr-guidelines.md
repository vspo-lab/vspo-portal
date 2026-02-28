# PR ガイドライン

## 概要

Pull Request の品質を一定に保つための規約です。
PR の説明に必要な情報を記載することで、レビュー効率の向上と変更意図の明確化を図ります。

## PR 説明の必須項目

PR の Description には以下の 3 項目を記載します。

### 1. 現状 (Current State)

変更前の状態を簡潔に記述します。

### 2. 問題 (Problem)

このまま変更しない場合に起きる問題を記述します。
「なぜこの変更が必要か」を明確にします。

### 3. 実装内容 (Implementation)

何をどう変更したかを記述します。
技術的な変更点を箇条書きで示します。

## 1 PR 1 関心事

1 つの PR には 1 つの関心事だけを含めます。

```
# ✅ Good: 1つの関心事
- PR: "アイテム作成 API を追加"
  - domain/item.ts, usecase/item.ts, repository/item.ts, http/item.ts

# ❌ Bad: 複数の関心事を混在
- PR: "アイテム作成 API 追加 + リファクタリング + テスト修正"
```

複数の変更が混在すると以下の問題が起きます。

- レビュー負荷が増大する
- バグ発生時の原因特定が困難になる
- revert が難しくなる

## 影響範囲

変更が他のモジュールや機能に影響する場合は影響範囲を記載します。

## PR テンプレート

`.github/pull_request_template.md` に定義されたテンプレートを使用してください（GitHub が PR 作成時に自動適用します）。

## 関連ドキュメント

- [Server Architecture](./server-architecture.md) - アーキテクチャ全体
- [UseCase 実装ルール](./usecase-rules.md) - UseCase の実装規約
- [コードレビュースキル](../../.agent/skills/code-review/SKILL.md) - `/code-review` で実行
