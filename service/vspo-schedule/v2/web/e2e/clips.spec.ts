import { expect, test } from "./fixtures";
import { closeVideoModal, openVideoModal } from "./helpers";

const periodButtons = ["すべて", "24時間", "1週間", "1ヶ月", "1年"];

test.describe("切り抜き", () => {
  test("切り抜きホームにセクションと期間フィルタが表示される", async ({
    page,
  }) => {
    await page.goto("/clips");
    await expect(page.getByRole("banner")).toContainText(
      "ぶいすぽっ!クリップコレクション",
    );
    const main = page.getByRole("main");
    await expect(
      main.getByRole("heading", { name: "期間でフィルタ" }),
    ).toBeVisible();
    for (const name of periodButtons) {
      await expect(
        main.getByRole("button", { name, exact: true }),
      ).toBeVisible();
    }
    await expect(
      main.getByRole("heading", { name: "人気の切り抜き" }),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "人気のショート動画" }),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "人気のTwitchクリップ" }),
    ).toBeVisible();
  });

  test("期間フィルタは period クエリとして反映される", async ({ page }) => {
    await page.goto("/clips");
    await page
      .getByRole("main")
      .getByRole("button", { name: "24時間", exact: true })
      .click();
    await expect(page).toHaveURL(/period=day/);
    await page
      .getByRole("main")
      .getByRole("button", { name: "1年", exact: true })
      .click();
    await expect(page).toHaveURL(/period=year/);
  });

  test("もっと見るで各一覧ページに期間を引き継いで遷移する", async ({
    page,
  }) => {
    await page.goto("/clips?period=week");
    const main = page.getByRole("main");
    await main.getByRole("button", { name: "もっと見る" }).nth(2).click();
    await expect(page).toHaveURL(/\/clips\/twitch\?period=week/);

    await page.goto("/clips");
    await main.getByRole("button", { name: "もっと見る" }).nth(1).click();
    await expect(page).toHaveURL(/\/clips\/youtube\/shorts\?type=shorts/);

    await page.goto("/clips");
    await main.getByRole("button", { name: "もっと見る" }).first().click();
    await expect(page).toHaveURL(/\/clips\/youtube(\?|$)/);
  });

  test("YouTube 切り抜き一覧は新着・人気の並び替えとページ送りができる", async ({
    page,
  }) => {
    await page.goto("/clips/youtube");
    await expect(page.getByRole("banner")).toContainText(
      "ぶいすぽっ！切り抜き一覧",
    );
    const main = page.getByRole("main");
    await expect(main.getByRole("tab", { name: "新着" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      main.getByRole("link", { name: "YouTubeで視聴" }).first(),
    ).toBeVisible();

    await main.getByRole("tab", { name: "人気" }).click();
    await expect(page).toHaveURL(/orderKey=viewCount/);
    await expect(page).toHaveURL(/page=0/);
    await expect(main.getByRole("tab", { name: "人気" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.getByRole("button", { name: "2ページ目に移動" }).click();
    await expect(page).toHaveURL(/page=1/);
    await page.getByRole("button", { name: "次のページに移動" }).click();
    await expect(page).toHaveURL(/page=2/);
  });

  test("Twitch クリップ一覧は Twitch の視聴リンクを表示する", async ({
    page,
  }) => {
    await page.goto("/clips/twitch");
    await expect(page.getByRole("banner")).toContainText(
      "ぶいすぽっ！クリップ一覧",
    );
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "Twitchで視聴" })
        .first(),
    ).toHaveAttribute("href", /twitch\.tv\/.+\/clip\//);
  });

  test("ショート動画一覧が表示される", async ({ page }) => {
    await page.goto("/clips/youtube/shorts");
    await expect(page.getByRole("banner")).toContainText(
      "ぶいすぽっ！ショート動画一覧",
    );
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "YouTubeで視聴" })
        .first(),
    ).toBeVisible();
  });

  test("切り抜きカードから詳細モーダルを開ける", async ({ page }) => {
    await page.goto("/clips/youtube");
    const title =
      "はっきり言っちゃうみみたや、うろ覚えすぎるはなびに爆笑するつな【ぶいすぽっ！切り抜き】";
    const dialog = await openVideoModal(page, title);
    await expect(
      dialog.getByRole("tablist", { name: "clip tabs" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "クラウン【切り抜き】" }),
    ).toBeVisible();
    await expect(dialog.getByRole("link", { name: /視聴/ })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=MMHcEzGWfz8",
    );
    await closeVideoModal(dialog);
  });
});
