---
name: e2e-testing
description: Playwright でE2Eテストを構築し、主要ユーザーフローを本番相当経路で保証するときに使う。内部モックは避け、外部境界のみ最小モックに限定する。
---

# トリガー条件

- 主要ユーザーフローの回帰を保証したいとき
- リリース前に画面/API/認証を跨ぐシナリオを追加するとき

# 実行チェックリスト

1. `docs/testing/e2e-testing.md` を確認する
2. 業務シナリオ単位でケースを分割する
3. 認証状態は `storageState` で再利用する
4. 外部依存のみ `page.route()` で固定する

# 参照ドキュメント

- `docs/testing/e2e-testing.md`
- `docs/web-frontend/twada-tdd.md`
