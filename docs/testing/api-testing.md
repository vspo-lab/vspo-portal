# API Testing 実装方針

## 目的

- HTTP エンドポイントの契約（status/header/body）を壊さない
- OpenAPI と実装の乖離を早期検出する

## 対象

- `services/api/presentation/**` のルート
- 認証、バリデーション、レスポンス整形

## 実装ルール

1. `testClient` または `app.request()` で Hono アプリを直接叩く
2. 200系だけでなく、4xx/5xx の失敗契約を必ず含める
3. テーブルドリブンで入力バリエーションを網羅する
4. OpenAPI `/doc` を契約テストの入力源として使う

## モック方針

- デフォルト: モックしない（ルート -> UseCase -> Repository を実体で通す）
- 例外: 外部API呼び出しのみ境界で置き換える

## 契約テスト

- API ケース: Vitest + Hono testClient
- OpenAPI 契約: Schemathesis などで `/doc` を検証

## 実行コマンド

- APIユニット/結合: `pnpm --filter api test:run`
- API結合（設定別）: `pnpm --filter api test:integration`

## 参考（一次情報）

- Hono Testing Helper: https://hono.dev/docs/helpers/testing
- Hono `app.request()`: https://hono.dev/docs/api/hono#request
- Playwright API Testing: https://playwright.dev/docs/api-testing
- Schemathesis CLI: https://schemathesis.readthedocs.io/en/stable/reference/cli/
