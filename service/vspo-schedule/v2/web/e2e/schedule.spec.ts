import { expect, test } from "./fixtures";
import {
  closeVideoModal,
  LIVE_STREAM,
  openSearchDialog,
  openVideoModal,
  selectOption,
  statusTabs,
  UPCOMING_STREAM,
  videoCard,
} from "./helpers";

test.describe("配信スケジュール", () => {
  test("トップは /schedule/all にリダイレクトされる", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/schedule\/all$/);
    await expect(
      statusTabs(page).getByRole("tab", { name: /^すべて/ }),
    ).toHaveAttribute("aria-selected", "true");
  });

  test("イベント一覧と日付ごとの配信が表示される", async ({ page }) => {
    await page.goto("/schedule/all");
    const main = page.getByRole("main");
    await expect(
      main.getByRole("heading", { name: "イベント一覧" }),
    ).toBeVisible();
    await expect(main.getByText("一ノ瀬うるは誕生日")).toBeVisible();

    await expect(
      main.getByRole("heading", { name: "05/10 (土)" }),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "00:00 - 06:00" }).first(),
    ).toBeVisible();
    const card = videoCard(page, UPCOMING_STREAM.title);
    await expect(card).toContainText(UPCOMING_STREAM.channel);
    await expect(card).toContainText("23:45~");
    await expect(
      main.getByRole("link", { name: "YouTubeで視聴" }).first(),
    ).toHaveAttribute("href", /youtube\.com\/watch/);
    await expect(
      page.getByText("※メン限の配信は掲載しておりません。"),
    ).toBeVisible();
  });

  test("タブ切り替えで配信中・配信予定のみ表示される", async ({ page }) => {
    await page.goto("/schedule/all");
    await statusTabs(page).getByRole("tab", { name: "配信中" }).click();
    await expect(page).toHaveURL(/\/schedule\/live$/);
    await expect(
      statusTabs(page).getByRole("tab", { name: "配信中" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(videoCard(page, LIVE_STREAM.title)).toBeVisible();
    await expect(videoCard(page, UPCOMING_STREAM.title)).toBeHidden();

    await statusTabs(page).getByRole("tab", { name: "配信予定" }).click();
    await expect(page).toHaveURL(/\/schedule\/upcoming$/);
    await expect(
      page.getByRole("main").getByText("Live", { exact: true }),
    ).toHaveCount(0);
  });

  test("前日・翌日ボタンで date クエリが変わる", async ({ page }) => {
    await page.goto("/schedule/all?date=2025-05-10");
    const main = page.getByRole("main");
    await expect(
      main.getByRole("heading", { level: 5, name: /^\d\d\/\d\d/ }).first(),
    ).toHaveText("05/10 (土)");
    await main.getByRole("button", { name: "翌日" }).first().click();
    await expect(page).toHaveURL(/date=2025-05-11/);
    await page.goBack();
    await main.getByRole("button", { name: "前日" }).first().click();
    await expect(page).toHaveURL(/date=2025-05-09/);
  });

  test("配信カードから詳細モーダルを開閉できる", async ({ page }) => {
    await page.goto("/schedule/all");
    const dialog = await openVideoModal(page, UPCOMING_STREAM.title);

    await expect(dialog.getByRole("tab", { name: "概要" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      dialog.getByRole("heading", { name: UPCOMING_STREAM.title }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: UPCOMING_STREAM.channel }),
    ).toBeVisible();
    await expect(dialog.getByText("05/08 23:45~")).toBeVisible();
    await expect(dialog.getByRole("link", { name: /視聴/ })).toHaveAttribute(
      "href",
      UPCOMING_STREAM.link,
    );
    await expect(dialog.getByRole("button", { name: "共有" })).toBeVisible();
    await expect(dialog.locator("iframe")).toBeAttached();

    await closeVideoModal(dialog);
    await expect(page).toHaveURL(/\/schedule\/all$/);
  });

  test("配信中の YouTube 配信はモーダルにライブチャットタブがある", async ({
    page,
  }) => {
    await page.goto("/schedule/live");
    const dialog = await openVideoModal(
      page,
      "【 OW2 】えなこカップ本番！がんばるぞ！【 ぶいすぽっ！ / 小森めと 】",
    );
    await expect(
      dialog.getByRole("tab", { name: "ライブチャット" }),
    ).toBeVisible();
    await dialog.getByRole("tab", { name: "ライブチャット" }).click();
    await expect(
      dialog.getByRole("tab", { name: "ライブチャット" }),
    ).toHaveAttribute("aria-selected", "true");
    await closeVideoModal(dialog);
  });

  test("アーカイブページは配信を日付降順で表示する", async ({ page }) => {
    await page.goto("/schedule/archive");
    await expect(page.getByRole("banner")).toContainText(
      "ぶいすぽっ！アーカイブ",
    );
    await expect(statusTabs(page)).toBeHidden();
    const headings = page
      .getByRole("main")
      .getByRole("heading", { level: 5, name: /^\d\d\/\d\d/ });
    await expect(headings.first()).toHaveText("05/11 (日)");
    await expect(headings.nth(1)).toHaveText("05/10 (土)");
  });

  test("検索条件ダイアログで絞り込みとクリアができる", async ({ page }) => {
    await page.goto("/schedule/all");
    const dialog = await openSearchDialog(page);
    await expect(dialog.getByRole("button", { name: "検索" })).toBeDisabled();
    await expect(
      dialog.getByRole("button", { name: "現在の条件を保存" }),
    ).toBeDisabled();

    await selectOption(
      page,
      dialog.getByRole("combobox", { name: /プラットフォーム/ }),
      "YouTube",
    );
    await selectOption(
      page,
      dialog.getByRole("combobox", { name: /メンバータイプ/ }),
      "ぶいすぽ JP",
    );
    await expect(dialog.getByRole("button", { name: "検索" })).toBeEnabled();
    await dialog.getByRole("button", { name: "検索" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/platform=youtube/);
    await expect(page).toHaveURL(/memberType=vspo_jp/);

    const reopened = await openSearchDialog(page);
    await expect(
      reopened.getByRole("combobox", { name: /プラットフォーム/ }),
    ).toHaveText("YouTube");
    await reopened.getByRole("button", { name: "クリア" }).click();
    await expect(reopened).toBeHidden();
    await expect(page).toHaveURL(/\/schedule\/all$/);
  });

  test("検索条件をお気に入りとして保存・削除できる", async ({ page }) => {
    await page.goto("/schedule/all");
    const dialog = await openSearchDialog(page);
    await selectOption(
      page,
      dialog.getByRole("combobox", { name: /プラットフォーム/ }),
      "Twitch",
    );
    await dialog.getByRole("button", { name: "現在の条件を保存" }).click();

    await expect(dialog.getByText("検索条件を保存しました")).toBeVisible();
    await expect(dialog.getByText("すべてのメンバー | Twitch")).toBeVisible();
    await dialog.getByRole("button", { name: "キャンセル" }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    const reopened = await openSearchDialog(page);
    await expect(reopened.getByText("すべてのメンバー | Twitch")).toBeVisible();
    // The delete control is an icon-only button without an accessible name.
    await reopened.locator("button.MuiIconButton-colorError").click();
    await expect(reopened.getByText("検索条件を保存しました")).toBeHidden();
    await expect(
      reopened.getByRole("button", { name: "現在の条件を保存" }),
    ).toBeVisible();
  });

  test("日付を指定して検索すると date クエリが付く", async ({ page }) => {
    await page.goto("/schedule/all");
    const dialog = await openSearchDialog(page);
    await dialog
      .getByRole("textbox", { name: "日付を選択" })
      .fill("2025-05-09");
    await dialog.getByRole("button", { name: "検索" }).click();
    await expect(page).toHaveURL(/date=2025-05-09/);
  });
});

test.describe("フリーチャット", () => {
  test("フリーチャット一覧とモーダルが表示される", async ({ page }) => {
    await page.goto("/freechat");
    await expect(page.getByRole("banner")).toContainText(
      "ぶいすぽっ！フリーチャット",
    );
    const main = page.getByRole("main");
    await expect(
      main.getByRole("link", { name: "YouTubeで視聴" }).first(),
    ).toBeVisible();

    const dialog = await openVideoModal(page, "💄Free chat");
    await expect(
      dialog.getByRole("tablist", { name: "freechat tabs" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "八雲べに" }),
    ).toBeVisible();
    await closeVideoModal(dialog);
  });
});
