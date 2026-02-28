---
name: unit-testing
description: Unitテストを Vitest のテーブルドリブンで実装し、モック最小でドメイン/ユーティリティの振る舞いを検証するときに使う。
---

# トリガー条件

- `*.test.ts` で単体テストを追加・更新するとき
- ドメインモデルや純粋関数をTDDで実装するとき

# 実行チェックリスト

1. `docs/testing/unit-testing.md` を確認する
2. 1振る舞いの失敗テスト（Red）を先に書く
3. `it.each` / `test.each` でケースを拡張する
4. リファクタリング後に全ケース再実行する

# 参照ドキュメント

- `docs/testing/unit-testing.md`
- `docs/web-frontend/twada-tdd.md`
