import { expect, type Page, test } from "@playwright/test";
import {
  channelCount,
  channelRow,
  channelTable,
  DEV_GUILD_ID,
  flash,
  gotoGuild,
  OTHER_GUILD_ID,
  openAddModal,
  openEditModal,
} from "./helpers";

test.describe("チャンネル設定ページの表示", () => {
  test.beforeEach(async ({ page }) => {
    await gotoGuild(page);
  });

  test("パンくず・見出し・チャンネル数が表示される", async ({ page }) => {
    const breadcrumb = page.getByRole("navigation", { name: "パンくずリスト" });
    await expect(
      breadcrumb.getByRole("link", { name: "すべてのサーバー" }),
    ).toHaveAttribute("href", "/dashboard");
    await expect(breadcrumb.getByText("Dev Server 1")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Dev Server 1" }),
    ).toBeVisible();
    await expect(channelCount(page)).toContainText("4");
  });

  test("登録済みチャンネルが言語・メンバー・ステータス付きで一覧される", async ({
    page,
  }) => {
    await expect(channelTable(page).locator("tbody tr")).toHaveCount(4);

    const notifications = channelRow(page, "vspo-notifications");
    await expect(notifications).toContainText("100000000000000001");
    await expect(notifications).toContainText("日本語");
    await expect(notifications).toContainText("全メンバー");
    await expect(notifications).toContainText("有効");

    const scheduleEn = channelRow(page, "schedule-en");
    await expect(scheduleEn).toContainText("英語");
    await expect(scheduleEn).toContainText("VSPO EN");

    const archives = channelRow(page, "archives");
    await expect(archives).toContainText("VSPO JP");
    await expect(archives).toContainText("停止中");

    const custom = channelRow(page, "custom-picks");
    for (const name of ["花芽すみれ", "一ノ瀬うるは", "Jira Jisaki"]) {
      await expect(custom.getByRole("img", { name })).toBeVisible();
    }
  });

  test("各行に編集・削除ボタンがある", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "編集 #vspo-notifications" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "削除 #vspo-notifications" }),
    ).toBeVisible();
  });

  test("サイドバーはチャンネル設定を現在地として表示する", async ({ page }) => {
    const nav = page.getByRole("navigation", {
      name: "サーバーナビゲーション",
    });
    await expect(
      nav.getByRole("link", { name: "チャンネル設定" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "お知らせ" })).toHaveAttribute(
      "href",
      `/dashboard/${DEV_GUILD_ID}/announcements`,
    );
    await expect(
      page.locator("aside").getByRole("heading", { name: "Dev Server 1" }),
    ).toBeVisible();
  });
});

test.describe("チャンネル未設定のサーバー", () => {
  test("空状態と、追加候補が無いことが表示される", async ({ page }) => {
    await gotoGuild(page, OTHER_GUILD_ID);
    await expect(channelCount(page)).toContainText("0");
    await expect(
      page.getByText("設定済みのチャンネルがありません。"),
    ).toBeVisible();

    const dialog = await openAddModal(page);
    await expect(dialog.getByText("チャンネルが見つかりません")).toBeVisible();
  });
});

test.describe("チャンネル追加モーダル", () => {
  test.beforeEach(async ({ page }) => {
    await gotoGuild(page);
  });

  test("未登録チャンネルは選択でき、登録済みは登録済みとして表示される", async ({
    page,
  }) => {
    const dialog = await openAddModal(page);
    const list = dialog.getByRole("listbox", { name: "チャンネルを追加" });
    await expect(list.getByRole("option", { name: /general/ })).toBeVisible();
    await expect(list.getByRole("option", { name: /random/ })).toBeVisible();
    await expect(list.getByRole("option")).toHaveCount(2);
    await expect(list.getByText("登録済み", { exact: true })).toHaveCount(4);
    await expect(
      list.getByText("vspo-notifications", { exact: true }),
    ).toBeVisible();
  });

  test("検索でチャンネルを絞り込める", async ({ page }) => {
    const dialog = await openAddModal(page);
    const search = dialog.getByRole("searchbox", {
      name: "チャンネル名で検索",
    });
    await search.fill("ran");
    await expect(dialog.getByRole("option", { name: /random/ })).toBeVisible();
    await expect(dialog.getByRole("option", { name: /general/ })).toHaveCount(
      0,
    );

    await search.fill("zzz");
    await expect(dialog.getByText("チャンネルが見つかりません")).toBeVisible();
  });

  test("キャンセルで閉じる", async ({ page }) => {
    const dialog = await openAddModal(page);
    await dialog.getByRole("button", { name: "キャンセル" }).click();
    await expect(dialog).toBeHidden();
  });

  test("閉じるボタンで閉じる", async ({ page }) => {
    const dialog = await openAddModal(page);
    await dialog.getByRole("button", { name: "閉じる" }).click();
    await expect(dialog).toBeHidden();
  });

  test("Escape キーで閉じる", async ({ page }) => {
    const dialog = await openAddModal(page);
    await dialog.getByRole("searchbox", { name: "チャンネル名で検索" }).focus();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("背景クリックで閉じる", async ({ page }) => {
    const dialog = await openAddModal(page);
    await dialog.click({ position: { x: 4, y: 4 } });
    await expect(dialog).toBeHidden();
  });
});

// The dev-mock store is process-wide, so these tests run on one worker and each
// test arranges the state it needs and restores the seed before it ends.
const addChannel = async (page: Page, name: string): Promise<void> => {
  await gotoGuild(page);
  if ((await channelRow(page, name).count()) > 0) return;
  const dialog = await openAddModal(page);
  await dialog.getByRole("option", { name: new RegExp(name) }).click();
  await expect(dialog).toBeHidden();
  await expect(channelRow(page, name)).toBeVisible();
};

const deleteChannel = async (page: Page, name: string): Promise<void> => {
  await gotoGuild(page);
  if ((await channelRow(page, name).count()) === 0) return;
  await page.getByRole("button", { name: `削除 #${name}` }).click();
  const dialog = page.getByRole("dialog", {
    name: `#${name} を削除しますか？`,
  });
  await dialog.getByRole("button", { name: "削除する" }).click();
  await expect(dialog).toBeHidden();
  await expect(channelRow(page, name)).toHaveCount(0);
};

const saveLanguage = async (
  page: Page,
  name: string,
  language: string,
): Promise<void> => {
  await gotoGuild(page);
  const dialog = await openEditModal(page, name);
  await dialog.getByRole("combobox", { name: "言語" }).selectOption(language);
  await dialog.getByRole("button", { name: "保存" }).click();
  await expect(dialog).toBeHidden();
};

const resetToDefault = async (page: Page, name: string): Promise<void> => {
  await gotoGuild(page);
  const dialog = await openEditModal(page, name);
  await dialog.getByRole("button", { name: "デフォルトに戻す" }).click();
  await expect(dialog).toBeHidden();
};

/** The seed configures `archives` as VSPO JP / 日本語. */
const restoreArchivesSeed = async (page: Page): Promise<void> => {
  await gotoGuild(page);
  const dialog = await openEditModal(page, "archives");
  await dialog.getByRole("radio", { name: "VSPO JP" }).check();
  await dialog.getByRole("combobox", { name: "言語" }).selectOption("ja");
  await dialog.getByRole("button", { name: "保存" }).click();
  await expect(dialog).toBeHidden();
};

test.describe("チャンネル設定の変更", () => {
  test("チャンネルを追加すると一覧に表示され、再読み込み後も残る", async ({
    page,
  }) => {
    await gotoGuild(page);
    const dialog = await openAddModal(page);
    await dialog.getByRole("option", { name: /general/ }).click();

    await expect(dialog).toBeHidden();
    await expect(flash(page)).toContainText("チャンネルを追加しました。");
    const row = channelRow(page, "general");
    await expect(row).toContainText("デフォルト");
    await expect(row).toContainText("全メンバー");
    await expect(row).toContainText("有効");

    await gotoGuild(page);
    await expect(channelCount(page)).toContainText("5");
    await expect(channelRow(page, "general")).toBeVisible();

    await deleteChannel(page, "general");
  });

  test("追加したチャンネルは追加モーダルで登録済みになる", async ({ page }) => {
    await addChannel(page, "general");

    const dialog = await openAddModal(page);
    await expect(dialog.getByRole("option", { name: /general/ })).toHaveCount(
      0,
    );
    await expect(dialog.getByRole("option")).toHaveCount(1);
    await page.keyboard.press("Escape");

    await deleteChannel(page, "general");
  });

  test("削除ダイアログはキャンセルできる", async ({ page }) => {
    await gotoGuild(page);
    await page.getByRole("button", { name: "削除 #custom-picks" }).click();
    const dialog = page.getByRole("dialog", {
      name: "#custom-picks を削除しますか？",
    });
    await expect(dialog).toContainText("この操作は取り消せません");
    await dialog.getByRole("button", { name: "キャンセル" }).click();
    await expect(dialog).toBeHidden();
    await expect(channelRow(page, "custom-picks")).toBeVisible();
  });

  test("チャンネルを削除すると一覧から消え、再読み込み後も残らない", async ({
    page,
  }) => {
    await addChannel(page, "general");

    await page.getByRole("button", { name: "削除 #general" }).click();
    const dialog = page.getByRole("dialog", {
      name: "#general を削除しますか？",
    });
    await dialog.getByRole("button", { name: "削除する" }).click();

    await expect(dialog).toBeHidden();
    await expect(flash(page)).toContainText("チャンネル設定を削除しました。");
    await expect(channelRow(page, "general")).toHaveCount(0);

    await gotoGuild(page);
    await expect(channelCount(page)).toContainText("4");
    await expect(channelRow(page, "general")).toHaveCount(0);
  });

  test("言語を変更すると変更プレビューが出て、保存で一覧に反映される", async ({
    page,
  }) => {
    await gotoGuild(page);
    const dialog = await openEditModal(page, "vspo-notifications");
    const language = dialog.getByRole("combobox", { name: "言語" });
    await expect(language).toHaveValue("ja");
    await expect(dialog.getByText("変更プレビュー")).toHaveCount(0);

    await language.selectOption("en");
    const preview = dialog.getByText("変更プレビュー").locator("..");
    await expect(preview).toContainText("言語");
    await expect(preview).toContainText("日本語");
    await expect(preview).toContainText("英語");

    await dialog.getByRole("button", { name: "保存" }).click();
    await expect(dialog).toBeHidden();
    await expect(flash(page)).toContainText("チャンネル設定を更新しました。");
    await expect(channelRow(page, "vspo-notifications")).toContainText("英語");

    await gotoGuild(page);
    await expect(channelRow(page, "vspo-notifications")).toContainText("英語");

    await saveLanguage(page, "vspo-notifications", "ja");
  });

  test("言語を日本語に戻せる", async ({ page }) => {
    await saveLanguage(page, "vspo-notifications", "en");

    const dialog = await openEditModal(page, "vspo-notifications");
    await dialog.getByRole("combobox", { name: "言語" }).selectOption("ja");
    await dialog.getByRole("button", { name: "保存" }).click();
    await expect(flash(page)).toContainText("チャンネル設定を更新しました。");
    await expect(channelRow(page, "vspo-notifications")).toContainText(
      "日本語",
    );
  });

  test("デフォルトに戻すと言語とメンバータイプが初期化される", async ({
    page,
  }) => {
    await gotoGuild(page);
    const dialog = await openEditModal(page, "archives");
    await dialog.getByRole("button", { name: "デフォルトに戻す" }).click();

    await expect(dialog).toBeHidden();
    await expect(flash(page)).toContainText(
      "チャンネル設定をデフォルトに戻しました。",
    );
    const row = channelRow(page, "archives");
    await expect(row).toContainText("デフォルト");
    await expect(row).toContainText("全メンバー");

    await gotoGuild(page);
    await expect(channelRow(page, "archives")).toContainText("デフォルト");

    await restoreArchivesSeed(page);
  });

  test("メンバータイプと言語を同時に変更すると両方がプレビューされ保存される", async ({
    page,
  }) => {
    await resetToDefault(page, "archives");

    const dialog = await openEditModal(page, "archives");
    await dialog.getByRole("radio", { name: "VSPO JP" }).check();
    await dialog.getByRole("combobox", { name: "言語" }).selectOption("ja");

    const preview = dialog.getByText("変更プレビュー").locator("..");
    await expect(preview).toContainText("メンバー");
    await expect(preview).toContainText("VSPO JP");
    await expect(preview).toContainText("日本語");

    await dialog.getByRole("button", { name: "保存" }).click();
    await expect(flash(page)).toContainText("チャンネル設定を更新しました。");
    const row = channelRow(page, "archives");
    await expect(row).toContainText("日本語");
    await expect(row).toContainText("VSPO JP");
  });
});

test.describe("チャンネル設定モーダル（カスタムメンバー）", () => {
  test.beforeEach(async ({ page }) => {
    await gotoGuild(page);
  });

  test("選択中のメンバーが件数・チップ・チェック状態で表示される", async ({
    page,
  }) => {
    const dialog = await openEditModal(page, "custom-picks");
    await expect(dialog.getByRole("radio", { name: "カスタム" })).toBeChecked();
    await expect(dialog.getByText("3 名選択中")).toBeVisible();
    for (const name of ["花芽すみれ", "一ノ瀬うるは", "Jira Jisaki"]) {
      await expect(dialog.getByRole("checkbox", { name })).toBeChecked();
      await expect(
        dialog.getByRole("button", { name: `Remove ${name}` }),
      ).toBeVisible();
    }
    await expect(
      dialog.getByRole("checkbox", { name: "小雀とと" }),
    ).not.toBeChecked();
  });

  test("チップの × で選択を外すと差分がプレビューされる", async ({ page }) => {
    const dialog = await openEditModal(page, "custom-picks");
    await dialog.getByRole("button", { name: "Remove 花芽すみれ" }).click();

    await expect(dialog.getByText("2 名選択中")).toBeVisible();
    const preview = dialog.getByText("変更プレビュー").locator("..");
    await expect(preview).toContainText("カスタムメンバー");
    await expect(preview).toContainText("-花芽すみれ");
  });

  test("メンバー検索で絞り込める", async ({ page }) => {
    const dialog = await openEditModal(page, "custom-picks");
    await dialog
      .getByRole("searchbox", { name: "メンバーを検索" })
      .fill("Jira");
    await expect(
      dialog.getByRole("checkbox", { name: "Jira Jisaki" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("checkbox", { name: "花芽すみれ" }),
    ).toHaveCount(0);
  });

  test("グループの全選択 / 全解除ができる", async ({ page }) => {
    const dialog = await openEditModal(page, "custom-picks");
    const enGroup = dialog
      .getByRole("heading", { name: "EN メンバー" })
      .locator("..");
    await enGroup.getByRole("button", { name: "全選択" }).click();
    await expect(dialog.getByText("7 名選択中")).toBeVisible();

    await enGroup.getByRole("button", { name: "全解除" }).click();
    await expect(dialog.getByText("2 名選択中")).toBeVisible();
  });

  test("カスタムでメンバーが 0 名のときは保存できない", async ({ page }) => {
    const dialog = await openEditModal(page, "vspo-notifications");
    await dialog.getByRole("radio", { name: "カスタム" }).check();
    const save = dialog.getByRole("button", { name: "保存" });
    await expect(save).toBeDisabled();

    await dialog.getByRole("checkbox", { name: "花芽すみれ" }).check();
    await expect(dialog.getByText("1 名選択中")).toBeVisible();
    await expect(save).toBeEnabled();
  });

  test("キャンセルすると変更は破棄される", async ({ page }) => {
    const dialog = await openEditModal(page, "custom-picks");
    await dialog.getByRole("button", { name: "Remove 花芽すみれ" }).click();
    await dialog.getByRole("button", { name: "キャンセル" }).click();

    await expect(dialog).toBeHidden();
    await expect(
      channelRow(page, "custom-picks").getByRole("img", { name: "花芽すみれ" }),
    ).toBeVisible();
  });
});
