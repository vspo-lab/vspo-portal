---
name: api-testing
description: Hono testClient と OpenAPI 契約検証を使って API テストを構築し、エンドポイント契約をモック最小で保証するときに使う。
---

# トリガー条件

- API エンドポイントのテストを追加・変更するとき
- ルートの入出力契約を固定したいとき

# 実行チェックリスト

1. `docs/testing/api-testing.md` を確認する
2. 正常系/異常系をテーブルで列挙する
3. `testClient` か `app.request()` でルートを直接叩く
4. `/doc` ベースの契約チェック対象を更新する

# 参照ドキュメント

- `docs/testing/api-testing.md`
- `docs/web-frontend/twada-tdd.md`
