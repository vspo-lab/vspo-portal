# Testing Strategy Overview

このディレクトリは、テスト種別ごとの実装方針の Single Source of Truth。

## 共通原則

- t_wada ベースの `Red-Green-Refactor` を短いサイクルで回す
- テーブルドリブンテスト（`it.each` / `test.each`）を基本形にする
- デフォルトは「モックしない」。内部依存は実体を通す
- 例外として、外部SaaS・決済・メールなど自分たちが制御できない境界のみモックする
- 実装詳細ではなく、利用者から見える振る舞いを検証する

## テストタイプと責務

| 種別 | 目的 | 主なツール | 方針 |
| --- | --- | --- | --- |
| Unit | 関数/ドメインの局所的な振る舞い確認 | Vitest | 高速・純粋・副作用最小 |
| Integration | 複数モジュール連携の確認 | Vitest + 実DB | Repository/UseCase/DB を通す |
| API | エンドポイント契約と入出力保証 | Hono testClient + OpenAPI | ルートを実体で叩く |
| UI | コンポーネントの利用者視点検証 | Vitest + Testing Library | Role ベース選択・実DOM重視 |
| VRT | 見た目の退行検知 | Storybook + Playwright | スナップショット安定化 |
| E2E | ユーザーフロー全体保証 | Playwright | 本番相当環境で経路検証 |

## カバレッジポリシー

| 対象パッケージ | 最低カバレッジ | CI 強制 |
| --- | --- | --- |
| `services/api/domain/**` | 60% | Yes |
| `packages/**` | 60% | Yes |
| `services/web/shared/lib/**` | 50% | No（推奨） |

- カバレッジが閾値を下回る PR は CI で失敗させる
- 閾値は段階的に引き上げる（初期設定は控えめに）
- カバレッジのための無意味なテストは書かない。振る舞いを検証するテストで自然に到達する

## ドキュメント一覧

- [unit-testing.md](./unit-testing.md)
- [integration-testing.md](./integration-testing.md)
- [api-testing.md](./api-testing.md)
- [ui-testing.md](./ui-testing.md)
- [vrt-testing.md](./vrt-testing.md)
- [e2e-testing.md](./e2e-testing.md)
