import { expect, test } from "./fixtures";

test.describe("静的コンテンツ", () => {
  test("すぽじゅーるについてのアコーディオンが開閉できる", async ({ page }) => {
    await page.goto("/about");
    const main = page.getByRole("main");
    const summary = main.getByRole("button", { name: "本サイトの概要" });
    await expect(summary).toBeVisible();
    await expect(
      main.getByRole("button", { name: "便利機能について" }),
    ).toBeVisible();

    const expandedBefore = await summary.getAttribute("aria-expanded");
    await summary.click();
    await expect(summary).toHaveAttribute(
      "aria-expanded",
      expandedBefore === "true" ? "false" : "true",
    );
  });

  test("お知らせ一覧がテーブルとパンくずで表示される", async ({ page }) => {
    await page.goto("/site-news");
    await expect(page.getByRole("banner")).toContainText(
      "すぽじゅーるからのお知らせ",
    );
    const table = page.getByRole("table");
    await expect(
      table.getByRole("columnheader", { name: "内容" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "更新日" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "タグ" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "breadcrumb" })
        .getByText("お知らせ"),
    ).toBeVisible();
  });

  test("お知らせ詳細へ遷移でき、パンくずから一覧へ戻れる", async ({ page }) => {
    await page.goto("/site-news");
    await page
      .getByRole("table")
      .getByRole("link", {
        name: "マルチビュー機能をリリースしました！複数配信の同時視聴が可能に",
      })
      .click();
    await expect(page).toHaveURL(/\/site-news\/15$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "マルチビュー機能をリリースしました！複数配信の同時視聴が可能に",
      }),
    ).toBeVisible();
    await expect(page.getByText("更新日: 2025年6月26日")).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "breadcrumb" })
        .getByRole("link", { name: "お知らせ" }),
    ).toHaveAttribute("href", "/site-news");
  });

  test("利用規約とプライバシーポリシーが表示される", async ({ page }) => {
    await page.goto("/terms");
    await expect(
      page.getByRole("heading", { level: 1, name: "利用規約" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "第1条（適用）" }),
    ).toBeVisible();

    await page.goto("/privacy-policy");
    await expect(
      page.getByRole("heading", { level: 1, name: "プライバシーポリシー" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "第1条（プライバシー情報）" }),
    ).toBeVisible();
  });

  test("英語ロケールでは静的コンテンツも英語になる", async ({ page }) => {
    await page.goto("/en/site-news");
    await expect(page.getByRole("banner")).toContainText("Spodule");
    await expect(
      page.getByRole("table").getByRole("columnheader").first(),
    ).not.toHaveText("内容");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.goto("/en/terms");
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(
      "利用規約",
    );
  });
});
