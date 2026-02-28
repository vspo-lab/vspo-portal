---
name: twada-tdd
description: t_wadaベースのテスト駆動開発戦略を使い、Red-Green-Refactorで小さく安全に実装を進める。新機能実装、バグ修正、リファクタリング時にテストファーストで仕様を固定したいときに使う。
---

# トリガー条件

- 新機能を実装するとき
- バグ修正を再発防止テストから始めるとき
- 既存コードを安全にリファクタリングするとき

# 実行チェックリスト

1. `docs/web-frontend/twada-tdd.md` を確認し、対象を 1 振る舞いに絞る。
2. 失敗するテスト（Red）を先に書く。
3. テストを通す最小実装（Green）だけを入れる。
4. 重複除去と命名改善のリファクタリングを行う。
5. サイクルごとにテストを再実行し、次の振る舞いへ進む。

# 参照ドキュメント

- `docs/web-frontend/twada-tdd.md` - t_wadaベースTDD戦略（本プロジェクト向け）
- `docs/web-frontend/unit-testing.md` - Vitest運用、テーブルドリブンテスト
- `docs/web-frontend/api-testing.md` - API統合テスト
