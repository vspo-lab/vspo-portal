import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { LIVE_STREAM } from "./helpers";

const streamList = (page: Page) => page.getByRole("main").getByRole("list");
const streamItem = (page: Page, title: string) =>
  streamList(page)
    .getByRole("listitem")
    .filter({ hasText: title })
    .getByRole("button");
const urlInput = (page: Page) =>
  page.getByRole("textbox", { name: "配信URLを入力してください" });
const addButton = (page: Page) =>
  page.getByRole("button", { name: "追加", exact: true });
const showPanel = async (page: Page) => {
  const toggle = page.getByRole("button", { name: "レイアウト設定を表示" });
  if (await toggle.isVisible()) {
    await toggle.click();
  }
};

test.describe("マルチビュー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/multiview");
  });

  test("初期状態は空のグリッドと配信選択パネルを表示する", async ({ page }) => {
    await expect(page.getByRole("banner")).toContainText(
      "ぶいすぽっ!マルチビュー",
    );
    const main = page.getByRole("main");
    await expect(
      main.getByRole("heading", { name: "配信を選択してください" }),
    ).toBeVisible();
    await expect(main.getByRole("heading", { name: "配信選択" })).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "URLから追加" }),
    ).toBeVisible();
    await expect(
      main.getByRole("heading", { name: "レイアウト設定" }).first(),
    ).toBeVisible();
    await expect(main.getByText("配信が選択されていません")).toBeVisible();
    await expect(addButton(page)).toBeDisabled();
    await expect(streamItem(page, LIVE_STREAM.title)).toContainText("LIVE");
  });

  test("配信選択パネルはタブと検索で絞り込める", async ({ page }) => {
    const main = page.getByRole("main");
    await main.getByRole("tab", { name: "ライブ" }).click();
    await expect(
      streamList(page).getByText("予定", { exact: true }),
    ).toHaveCount(0);
    await expect(
      streamList(page).getByText("LIVE", { exact: true }).first(),
    ).toBeVisible();

    await main.getByRole("tab", { name: "予定" }).click();
    await expect(
      streamList(page).getByText("LIVE", { exact: true }),
    ).toHaveCount(0);

    await main.getByRole("tab", { name: "すべて" }).click();
    await page.getByRole("textbox", { name: "配信を検索" }).fill("day1 総集編");
    await expect(streamList(page).getByRole("listitem")).toHaveCount(1);
    await expect(streamList(page)).toContainText("Only Up! day1 総集編");

    await page
      .getByRole("textbox", { name: "配信を検索" })
      .fill("zzz-no-match");
    await expect(main.getByText("該当する配信がありません")).toBeVisible();
  });

  test("配信を選択するとプレイヤーが表示され、閉じると空に戻る", async ({
    page,
  }) => {
    await streamItem(page, LIVE_STREAM.title).click();
    const main = page.getByRole("main");
    await expect(main.getByText("1件の配信を選択中")).toBeVisible();
    await expect(main.locator("iframe")).toHaveCount(1);
    await expect(main.getByText(LIVE_STREAM.title)).toBeVisible();

    await main.getByRole("button", { name: "配信を閉じる" }).click();
    await expect(
      main.getByRole("heading", { name: "配信を選択してください" }),
    ).toBeVisible();
    await expect(main.getByText("配信が選択されていません")).toBeVisible();
  });

  test("URL から配信を追加でき、対応外の URL はエラーになる", async ({
    page,
  }) => {
    await urlInput(page).fill("https://example.com/watch");
    await addButton(page).click();
    await expect(page.getByText("サポートされていないURLです")).toBeVisible();

    await urlInput(page).fill("https://twitcasting.tv/e2e_user");
    await addButton(page).click();
    const main = page.getByRole("main");
    await expect(main.getByText("1件の配信を選択中")).toBeVisible();
    await expect(main.getByText("e2e_user (Twitcasting)")).toBeVisible();

    await showPanel(page);
    await urlInput(page).fill("https://twitcasting.tv/e2e_user");
    await addButton(page).click();
    await expect(
      page.getByText("この配信は既に追加されています"),
    ).toBeVisible();
  });

  test("複数配信を選ぶとレイアウトを切り替えられる", async ({ page }) => {
    await streamItem(page, LIVE_STREAM.title).click();
    await showPanel(page);
    await streamItem(page, "Only Up! day1 総集編").click();
    await showPanel(page);
    const main = page.getByRole("main");
    await expect(main.getByText("2件の配信を選択中")).toBeVisible();
    await expect(main.locator("iframe")).toHaveCount(2);
    await expect(main.getByText("2配信")).toBeVisible();

    const frames = main.locator("iframe");
    await main.getByRole("button", { name: "縦並び" }).click();
    await expect
      .poll(async () => {
        const [a, b] = await Promise.all([
          frames.nth(0).boundingBox(),
          frames.nth(1).boundingBox(),
        ]);
        return a && b ? b.y >= a.y + a.height - 1 : null;
      })
      .toBe(true);

    await main.getByRole("button", { name: "横並び" }).click();
    await expect
      .poll(async () => {
        const [a, b] = await Promise.all([
          frames.nth(0).boundingBox(),
          frames.nth(1).boundingBox(),
        ]);
        return a && b
          ? b.x >= a.x + a.width - 1 && Math.abs(a.y - b.y) < 1
          : null;
      })
      .toBe(true);
  });

  test("没入モードでヘッダーが隠れ、終了で戻る", async ({ page }) => {
    await streamItem(page, LIVE_STREAM.title).click();
    await page.getByRole("button", { name: "没入モード" }).click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-immersive",
      "true",
    );
    await expect(page.getByRole("banner")).toBeHidden();

    await page
      .getByRole("button", { name: "没入モード終了" })
      .click({ force: true });
    await expect(page.locator("html")).toHaveAttribute(
      "data-immersive",
      "false",
    );
    await expect(page.getByRole("banner")).toBeVisible();
  });
});
