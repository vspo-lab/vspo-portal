---
name: ui-testing
description: UIテストを Testing Library 優先クエリとテーブルドリブンで実装し、ユーザー視点を保ちながらモック最小で検証するときに使う。
---

# トリガー条件

- React コンポーネント/画面の挙動テストを追加するとき
- 実装詳細ではなく利用者視点でUIを検証したいとき

# 実行チェックリスト

1. `docs/testing/ui-testing.md` を確認する
2. `getByRole` 優先で要素を取得する
3. `it.each` で state/props バリエーションを列挙する
4. ネットワーク境界のみ必要最小限で固定する

# 参照ドキュメント

- `docs/testing/ui-testing.md`
- `docs/web-frontend/twada-tdd.md`
