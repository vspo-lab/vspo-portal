import { expect, test } from "./fixtures";
import {
  closeDrawer,
  drawerLink,
  openDrawer,
  UPCOMING_STREAM,
} from "./helpers";

test.describe("共通レイアウト", () => {
  test("ヘッダーにサイト名・説明・X リンクが表示される", async ({ page }) => {
    await page.goto("/schedule/all");
    const banner = page.getByRole("banner");
    await expect(
      banner.getByRole("heading", { name: "すぽじゅーる" }),
    ).toBeVisible();
    await expect(
      banner.getByText("ぶいすぽっ！配信スケジュール"),
    ).toBeVisible();
    await expect(
      banner.getByRole("link", { name: "X (Twitter)" }),
    ).toHaveAttribute("href", "https://twitter.com/vspodule");
    await expect(
      banner.getByRole("link", { name: /すぽじゅーる/ }),
    ).toHaveAttribute("href", "/schedule/all");
  });

  test.describe("初回訪問", () => {
    // The shared storageState pre-dismisses the alert; these tests need a clean origin.
    test.use({ storageState: { cookies: [], origins: [] } });

    test("Discord Bot のお知らせは閉じると再訪問時も表示されない", async ({
      page,
    }) => {
      await page.goto("/schedule/all");
      const alert = page
        .getByRole("alert")
        .filter({ hasText: "Discord Bot公開中" });
      await expect(alert).toBeVisible();
      await alert.getByRole("button", { name: "close" }).click();
      await expect(alert).toBeHidden();

      await page.reload();
      await expect(page.getByRole("main")).toBeVisible();
      await expect(alert).toBeHidden();
    });
  });

  test("フッターとボトムナビのリンク先が正しい", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("link", { name: "ホーム" })).toHaveAttribute(
      "href",
      "/schedule/all",
    );
    await expect(page.getByRole("link", { name: "利用規約" })).toHaveAttribute(
      "href",
      "/terms",
    );
    await expect(
      page.getByRole("link", { name: "プライバシーポリシー" }),
    ).toHaveAttribute("href", "/privacy-policy");
    await expect(page.getByText(/© すぽじゅーる \d{4}/)).toBeVisible();

    await expect(page.getByRole("link", { name: "配信一覧" })).toHaveAttribute(
      "href",
      "/schedule/all",
    );
    await expect(page.getByRole("link", { name: "切り抜き" })).toHaveAttribute(
      "href",
      "/clips",
    );
    await expect(
      page.getByRole("link", { name: "マルチビュー" }),
    ).toHaveAttribute("href", "/multiview");
  });

  test("ドロワーの各リンクが対応するページへ遷移する", async ({ page }) => {
    await page.goto("/schedule/all");
    const drawer = await openDrawer(page);

    const expected: Array<[string, string]> = [
      ["配信中", "/schedule/live"],
      ["配信予定", "/schedule/upcoming"],
      ["アーカイブ", "/schedule/archive"],
      ["フリーチャット", "/freechat"],
      ["マルチビュー", "/multiview"],
      ["切り抜き一覧", "/clips"],
      ["すぽじゅーるについて", "/about"],
      ["お知らせ", "/site-news"],
    ];
    for (const [name, href] of expected) {
      await expect(drawerLink(drawer, name)).toHaveAttribute("href", href);
    }
    await expect(
      drawer.getByRole("button", { name: "お問い合わせ", includeHidden: true }),
    ).toBeVisible();
    await expect(
      drawer.getByRole("button", { name: "Discord Bot", includeHidden: true }),
    ).toBeVisible();

    await drawerLink(drawer, "アーカイブ").click();
    await expect(page).toHaveURL(/\/schedule\/archive$/);
    await closeDrawer(page, drawer);
    await expect(page.getByRole("banner")).toContainText(
      "ぶいすぽっ！アーカイブ",
    );
  });

  test("言語を英語に切り替えると /en 配下に遷移し英語表示になる", async ({
    page,
  }) => {
    await page.goto("/schedule/all");
    const drawer = await openDrawer(page);
    await drawer.locator("#language-select").click();
    await page.getByRole("option", { name: "English" }).click();

    await expect(page).toHaveURL(/\/en\/schedule\/all$/);
    await expect(
      page.getByRole("banner").getByRole("heading", { name: "Spodule" }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Upcoming" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("タイムゾーンを変えると配信時刻が変換される", async ({
    page,
    context,
  }) => {
    await page.goto("/schedule/all");
    const card = page
      .getByRole("main")
      .getByRole("button", { name: UPCOMING_STREAM.title });
    await expect(card).toContainText("23:45~");

    const drawer = await openDrawer(page);
    const tz = drawer.locator("#time-zone-select");
    await tz.fill("New_York");
    await page.getByRole("option", { name: /America\/New_York/ }).click();
    await expect(tz).toHaveValue("America/New_York");
    await closeDrawer(page, drawer);

    await expect
      .poll(async () => {
        const cookies = await context.cookies();
        return cookies.find((c) => c.name === "time-zone")?.value;
      })
      .toBe("America%2FNew_York");

    // The same-URL router.replace is served from the client cache, so the new zone shows after reload.
    await page.reload();
    await expect(card).toContainText("10:45~");
  });

  test("背景テーマを切り替えるとダークモードになり保持される", async ({
    page,
  }) => {
    await page.goto("/schedule/all");
    await expect(page.locator("html")).toHaveClass(/light/);

    const drawer = await openDrawer(page);
    await drawer.getByRole("switch", { includeHidden: true }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("存在しないパスは 404 ページを表示する", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "404 - Page Not Found" }),
    ).toBeVisible();
  });
});
