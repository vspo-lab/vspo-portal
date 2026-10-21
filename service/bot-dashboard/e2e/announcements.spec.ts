import { expect, test } from "@playwright/test";
import { DEV_GUILD_ID, switchLanguage } from "./helpers";

test.describe("お知らせ", () => {
  test("お知らせ一覧が種類・日付・本文付きで表示される", async ({ page }) => {
    await page.goto("/dashboard/announcements");
    await expect(
      page.getByRole("heading", { level: 1, name: "お知らせ" }),
    ).toBeVisible();

    const article = page.getByRole("article").first();
    await expect(
      article.getByText("アップデート", { exact: true }),
    ).toBeVisible();
    await expect(article.getByText("2026年4月1日")).toBeVisible();
    await expect(
      article.getByRole("heading", {
        name: "Webダッシュボードをリリースしました",
      }),
    ).toBeVisible();
    await expect(article).toContainText(
      "ブラウザからBot設定を管理できるようになりました",
    );

    const nav = page.getByRole("navigation", {
      name: "サーバーナビゲーション",
    });
    await expect(nav.getByRole("link", { name: "お知らせ" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("サーバー配下のお知らせはサイドバーにサーバー名を表示する", async ({
    page,
  }) => {
    await page.goto(`/dashboard/${DEV_GUILD_ID}/announcements`);
    await expect(
      page.getByRole("heading", { level: 1, name: "お知らせ" }),
    ).toBeVisible();
    await expect(
      page.locator("aside").getByRole("heading", { name: "Dev Server 1" }),
    ).toBeVisible();

    const nav = page.getByRole("navigation", {
      name: "サーバーナビゲーション",
    });
    await expect(
      nav.getByRole("link", { name: "チャンネル設定" }),
    ).toHaveAttribute("href", `/dashboard/${DEV_GUILD_ID}`);
    await expect(nav.getByRole("link", { name: "お知らせ" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("英語ではお知らせも英語で表示される", async ({ page }) => {
    await page.goto("/dashboard/announcements");
    await switchLanguage(page, "English");

    const article = page.getByRole("article").first();
    await expect(article.getByText("Update", { exact: true })).toBeVisible();
    await expect(article.getByText("April 1, 2026")).toBeVisible();
    await expect(
      article.getByRole("heading", { name: "Web Dashboard Released" }),
    ).toBeVisible();
  });
});
