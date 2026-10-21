import { expect, test } from "@playwright/test";
import {
  DEV_GUILD_ID,
  openUserMenu,
  switchLanguage,
  waitForIsland,
} from "./helpers";

test.describe("サーバー一覧", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("ログイン済みならトップからサーバー一覧へリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("Bot 導入済みサーバーがチャンネル概要付きで表示される", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "サーバー一覧" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Bot 導入済み" }),
    ).toBeVisible();

    const card = page
      .locator("div")
      .filter({
        has: page.getByRole("heading", { level: 3, name: "Dev Server 1" }),
      })
      .filter({ has: page.getByRole("link", { name: "設定を管理" }) })
      .last();
    await expect(card.getByText("導入済み", { exact: true })).toBeVisible();
    await expect(card.getByText("4 チャンネル設定済み")).toBeVisible();
    // Only enabled channels are previewed: "archives" is paused and must not appear.
    for (const name of [
      "#vspo-notifications",
      "#schedule-en",
      "#custom-picks",
    ]) {
      await expect(card.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(card.getByText("#archives", { exact: true })).toHaveCount(0);
    await expect(
      card.getByRole("link", { name: "設定を管理" }),
    ).toHaveAttribute("href", `/dashboard/${DEV_GUILD_ID}`);
  });

  test("管理者権限のないサーバーは一覧に表示されない", async ({ page }) => {
    // The mock user owns Dev Server 1 only; Dev Server 2 is filtered out before rendering.
    await expect(
      page.getByRole("heading", { level: 3, name: "Dev Server 1" }),
    ).toBeVisible();
    await expect(page.getByText("Dev Server 2")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 2, name: "Bot 未導入" }),
    ).toHaveCount(0);
  });

  test("「設定を管理」からサーバー詳細へ遷移できる", async ({ page }) => {
    await page.getByRole("link", { name: "設定を管理" }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/${DEV_GUILD_ID}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: "Dev Server 1" }),
    ).toBeVisible();
  });

  test("サイドバーは現在地をハイライトし、折りたたみ状態を記憶する", async ({
    page,
  }) => {
    await waitForIsland(page, "DesktopSidebarIsland");
    const nav = page.getByRole("navigation", {
      name: "サーバーナビゲーション",
    });
    await expect(
      nav.getByRole("link", { name: "サーバー一覧" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "お知らせ" })).toHaveAttribute(
      "href",
      "/dashboard/announcements",
    );
    const contact = nav.getByRole("link", { name: "お問い合わせ" });
    await expect(contact).toHaveAttribute(
      "href",
      "https://example.com/contact",
    );
    await expect(contact).toHaveAttribute("target", "_blank");

    const toggle = page.getByRole("button", { name: "サイドバーを折りたたむ" });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.locator("aside").getByRole("link", { name: "すべてのサーバー" }),
    ).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(
      page.locator("aside").getByRole("link", { name: "すべてのサーバー" }),
    ).toBeHidden();

    await page.reload();
    await waitForIsland(page, "DesktopSidebarIsland");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  test("ユーザーメニューに言語・テーマ・ログアウトが表示され、外側クリックで閉じる", async ({
    page,
  }) => {
    await openUserMenu(page);
    const ja = page.getByRole("button", { name: "日本語" });
    const en = page.getByRole("button", { name: "English" });
    await expect(ja).toHaveAttribute("aria-pressed", "true");
    await expect(en).toHaveAttribute("aria-pressed", "false");
    await expect(
      page.getByRole("button", { name: "テーマ", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "ログアウト" }),
    ).toBeVisible();

    await page.getByRole("heading", { level: 1, name: "サーバー一覧" }).click();
    await expect(page.getByRole("button", { name: "ログアウト" })).toBeHidden();
  });

  test("ユーザーメニューの言語ボタンで英語表示に切り替わる", async ({
    page,
  }) => {
    await openUserMenu(page);
    await page.getByRole("button", { name: "English" }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("heading", { level: 1, name: "Servers" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Bot Installed" }),
    ).toBeVisible();
  });

  test("ヘッダーの言語メニューは元のページに戻る", async ({ page }) => {
    await page.goto(`/dashboard/${DEV_GUILD_ID}`);
    await switchLanguage(page, "English");
    await expect(page).toHaveURL(new RegExp(`/dashboard/${DEV_GUILD_ID}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: "Dev Server 1" }),
    ).toBeVisible();
    await expect(
      page.getByText("Channel Settings", { exact: true }).first(),
    ).toBeVisible();
  });

  test("ユーザーメニューのテーマボタンで dark モードに切り替わる", async ({
    page,
  }) => {
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);
    await openUserMenu(page);
    await page.getByRole("button", { name: "テーマ", exact: true }).click();
    await expect(html).toHaveClass(/dark/);
  });

  test("テーマは ClientRouter によるページ遷移後も維持される", async ({
    page,
  }) => {
    await waitForIsland(page, "ThemeToggle");
    await page.getByRole("button", { name: "テーマ切替" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.getByRole("link", { name: "設定を管理" }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/${DEV_GUILD_ID}$`));
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("モバイル幅ではハンバーガーメニューからナビゲーションを開閉できる", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    await expect(page.locator("aside")).toBeHidden();
    const summary = page.locator("summary[aria-label='メニュー']");
    await summary.click();

    const nav = page.getByRole("navigation", {
      name: "サーバーナビゲーション",
    });
    await expect(nav.getByRole("link", { name: "サーバー一覧" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "お知らせ" })).toBeVisible();

    // Click well below the dropdown so the outside-click handler closes it.
    await page.mouse.click(300, 780);
    await expect(nav).toBeHidden();
  });
});
