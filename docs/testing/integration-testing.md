# Integration Testing 実装方針

## 目的

- UseCase と Repository、DB を含む複数モジュール連携の挙動を保証する
- 単体テストでは見えない境界不整合（永続化、トランザクション、変換）を検出する

## 対象

- `services/api/usecase/**`
- `services/api/infra/repository/**`
- DB を含むアプリケーションフロー

## 実装ルール

1. アプリ内部（UseCase/Repository/DB）は実体を使う
2. 外部サービス依存のみ境界でモックする
3. テーブルドリブンで業務シナリオを列挙する
4. 各テストを独立させ、前のケースのデータに依存しない

## データ管理

- テスト前に migrate/seed を実行する
- テストごとに必要データを作成し、不要な共有状態を避ける
- CI では `compose.test.yaml` 経由で再現可能にする

## モック方針

- デフォルト: モックしない（特に DB は実体）
- 例外: 決済、メール、外部SaaSなど制御不能な外部境界のみ

## ファイル配置

- `services/api/test/integration/**/*.test.ts`
- `services/api/vitest.integration.config.ts` の `include` に合わせる

## 実行コマンド

- 全体: `pnpm test:integration`
- APIのみ: `pnpm --filter api test:integration`

## 参考（一次情報）

- Playwright Test Isolation: https://playwright.dev/docs/browser-contexts
- Next.js Testing（テスト種類の整理）: https://nextjs.org/docs/app/guides/testing
- t_wada方針: `docs/web-frontend/twada-tdd.md`
