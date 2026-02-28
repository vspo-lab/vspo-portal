# E2E Testing 実装方針

## 目的

- 本番相当の実行経路で主要ユーザーフローを保証する
- 画面、API、認証、DB を跨ぐ不整合を最終段で検出する

## 対象

- ログイン、主要作成フロー、更新/削除フロー、権限制御
- 失敗系（権限不足、バリデーション失敗、ネットワーク異常）

## 実装ルール

1. Playwright の Locator と Web-first assertion を使う
2. テストは相互独立にする（共有状態を持たない）
3. 認証は `storageState` を使って再利用し、ログイン操作を重複させない
4. テストデータ準備は API 経由で行い、UI操作の前提を最小化する

## モック方針

- デフォルト: モックしない（アプリ内部経路は実体）
- 例外: 外部依存（第三者API）のみ `page.route()` で固定化する

## テストケースの粒度

1 テストケースにつき 1 つの観察ポイントを検証します。
テストが失敗したときに「何が壊れたか」が即座に特定できるようにします。

### Good: 1 テスト 1 観察ポイント

```typescript
test("新規アイテムが作成できる", async ({ page }) => {
  await page.getByRole("button", { name: "作成" }).click();
  await page.getByRole("textbox", { name: "名前" }).fill("テストアイテム");
  await page.getByRole("button", { name: "保存" }).click();

  await expect(page.getByText("作成しました")).toBeVisible();
});

test("名前が空のときにエラーが表示される", async ({ page }) => {
  await page.getByRole("button", { name: "作成" }).click();
  await page.getByRole("button", { name: "保存" }).click();

  await expect(page.getByText("名前は必須です")).toBeVisible();
});
```

### Bad: 1 テストに複数の観察ポイント

```typescript
// ❌ 失敗時にどの観察ポイントが壊れたか不明
test("アイテム作成フロー全体", async ({ page }) => {
  // 作成成功を確認
  await expect(page.getByText("作成しました")).toBeVisible();
  // バリデーションエラーも確認
  await expect(page.getByText("名前は必須です")).toBeVisible();
  // 一覧に表示されることも確認
  await expect(page.getByText("テストアイテム")).toBeVisible();
});
```

## 失敗を減らすための運用

- リトライは一時しのぎにせず、原因（待機不足、データ競合）を解消する
- テスト名を業務シナリオで書く（例: 「新規注文が作成できる」）
- 主要シナリオを少数精鋭で維持し、網羅は Unit/Integration/API で補完する

## 推奨ファイル構成

- `services/web/e2e/auth.setup.ts`
- `services/web/e2e/*.spec.ts`
- `services/web/playwright.config.ts`

## 参考（一次情報）

- Playwright Best Practices: https://playwright.dev/docs/best-practices
- Playwright Isolation: https://playwright.dev/docs/browser-contexts
- Playwright Authentication: https://playwright.dev/docs/auth
- Playwright API Testing: https://playwright.dev/docs/api-testing
