---
name: integration-testing
description: Integrationテストを実DBと実アプリ配線で構築し、内部はモックせず外部境界のみ最小モックで検証するときに使う。
---

# トリガー条件

- UseCase と Repository の連携を検証するとき
- DB を含む結合テストを追加・更新するとき

# 実行チェックリスト

1. `docs/testing/integration-testing.md` を確認する
2. 実DBを使う前提でシナリオをテーブル化する
3. 外部依存だけ境界で置き換える
4. `test:integration` で再現可能性を確認する

# 参照ドキュメント

- `docs/testing/integration-testing.md`
- `docs/web-frontend/twada-tdd.md`
