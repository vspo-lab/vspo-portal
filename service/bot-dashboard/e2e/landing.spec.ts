import { expect, test } from "@playwright/test";
import { switchLanguage, waitForIsland } from "./helpers";

// The mock user is always logged in, so `?preview` is the only way to see the landing page.
test.describe("ランディングページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?preview");
  });

  test("ヒーローに見出し・説明・CTA が表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Discord",
    );
    await expect(
      page.getByText(
        "ぶいすぽっ!メンバーの配信予定をDiscordに自動で届けます。",
        {
          exact: false,
        },
      ),
    ).toBeVisible();

    const addBot = page
      .getByRole("link", { name: "サーバーに追加する" })
      .first();
    await expect(addBot).toHaveAttribute(
      "href",
      /^https:\/\/discord\.com\/oauth2\/authorize\?client_id=e2e-bot-id&/,
    );
    await expect(addBot).toHaveAttribute("target", "_blank");

    await expect(
      page.getByRole("link", { name: "Discordで管理画面へログイン" }).first(),
    ).toHaveAttribute("href", "/auth/discord");
  });

  test("Bot の統計（サーバー数・利用者数）が表示される", async ({ page }) => {
    const stats = page.locator(".hero-stats");
    await expect(stats.getByText("サーバー", { exact: true })).toBeVisible();
    await expect(stats.getByText("総利用者数", { exact: true })).toBeVisible();
    await expect(stats.locator(".stat-card")).toHaveCount(2);
    await expect(stats).toContainText("42");
    await expect(stats).toContainText("1,234");
  });

  test("導入手順と /setting コマンドの説明が表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "かんたん3ステップ" }),
    ).toBeVisible();
    for (const step of [
      "Bot をサーバーに追加",
      "/setting で初期設定",
      "配信予定が届く",
    ]) {
      await expect(page.getByRole("heading", { name: step })).toBeVisible();
    }

    await expect(
      page.getByRole("heading", { name: "/setting コマンド" }),
    ).toBeVisible();
    for (const card of [
      "Bot を追加",
      "Bot を削除",
      "言語設定",
      "メンバー選択",
    ]) {
      await expect(page.getByRole("heading", { name: card })).toBeVisible();
    }
  });

  test("機能カードを開くとダイアログが表示され、閉じるボタンで閉じる", async ({
    page,
  }) => {
    const card = page.getByRole("button", { name: /まとめて管理/ });
    await card.scrollIntoViewIfNeeded();
    await waitForIsland(page, "FeatureShowcase");
    await card.click();

    const dialog = page.getByRole("dialog", { name: "まとめて管理" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("img", { name: "まとめて管理" }),
    ).toBeVisible();
    await expect(
      dialog.getByText("複数サーバーの設定をひとつの画面で確認・変更"),
    ).toBeVisible();

    await dialog.getByRole("button", { name: "閉じる" }).click();
    await expect(dialog).toBeHidden();
  });

  test("機能ダイアログは背景クリックで閉じる", async ({ page }) => {
    const card = page.getByRole("button", { name: /通知対象を選べる/ });
    await card.scrollIntoViewIfNeeded();
    await waitForIsland(page, "FeatureShowcase");
    await card.click();

    const dialog = page.getByRole("dialog", { name: "通知対象を選べる" });
    await expect(dialog).toBeVisible();
    await dialog.click({ position: { x: 4, y: 4 } });
    await expect(dialog).toBeHidden();
  });

  test("フッターに外部リンクが表示される", async ({ page }) => {
    const footer = page.getByRole("navigation", { name: "Footer" });
    await expect(
      footer.getByRole("link", { name: "配信予定を確認する" }),
    ).toHaveAttribute("href", "https://www.vspo-schedule.com/schedule/all");
    await expect(
      footer.getByRole("link", { name: "利用規約" }),
    ).toHaveAttribute("href", "https://www.vspo-schedule.com/terms");
    await expect(
      footer.getByRole("link", { name: "プライバシーポリシー" }),
    ).toHaveAttribute("href", "https://www.vspo-schedule.com/privacy-policy");
  });

  test("認証エラーで戻ってきた場合はアラートが表示され、閉じられる", async ({
    page,
  }) => {
    await page.goto("/?error=auth_failed");
    const alert = page.getByRole("alert");
    await expect(alert).toContainText("Discord 認証に失敗しました");
    await expect(
      alert.getByRole("link", { name: "Discordで管理画面へログイン" }),
    ).toHaveAttribute("href", "/auth/discord");
    // The inline script strips the error param so a refresh does not repeat the alert.
    await expect(page).toHaveURL(/\/$/);

    await alert.getByRole("button", { name: "閉じる" }).click();
    await expect(alert).toBeHidden();
  });

  test("ヘッダーの言語メニューで英語表示に切り替わる", async ({ page }) => {
    await switchLanguage(page, "English");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "VSPO stream",
    );
    await expect(
      page
        .getByRole("link", { name: "Log in to Dashboard with Discord" })
        .first(),
    ).toBeVisible();
  });

  test("テーマ切替で dark クラスがトグルされ、再読み込み後も維持される", async ({
    page,
  }) => {
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);

    await waitForIsland(page, "ThemeToggle");
    await page.getByRole("button", { name: "テーマ切替" }).click();
    await expect(html).toHaveClass(/dark/);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("theme")))
      .toBe("dark");

    await page.reload();
    await expect(html).toHaveClass(/dark/);

    await waitForIsland(page, "ThemeToggle");
    await page.getByRole("button", { name: "テーマ切替" }).click();
    await expect(html).not.toHaveClass(/dark/);
  });
});
