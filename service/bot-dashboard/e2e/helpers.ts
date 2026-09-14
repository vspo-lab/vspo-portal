import { expect, type Locator, type Page } from "@playwright/test";

export const ORIGIN = "http://localhost:4341";

/** Guild seeded with channels in the dev mock (`devMock.guildConfig`). */
export const DEV_GUILD_ID = "111111111111111111";
/** Guild the mock user administers but where the bot is not installed. */
export const OTHER_GUILD_ID = "222222222222222222";

/** Astro islands keep the `ssr` attribute until hydration finishes. */
export const waitForIsland = async (
  page: Page,
  componentExport: string,
): Promise<void> => {
  const island = page
    .locator(`astro-island[component-export="${componentExport}"]`)
    .first();
  await expect(island).toBeAttached();
  await expect(island).not.toHaveAttribute("ssr");
};

export const gotoGuild = async (
  page: Page,
  guildId: string = DEV_GUILD_ID,
): Promise<void> => {
  await page.goto(`/dashboard/${guildId}`);
  await waitForIsland(page, "GuildDashboardIsland");
};

export const channelTable = (page: Page): Locator =>
  page.getByRole("table", { name: "チャンネル設定" });

export const channelRow = (page: Page, channelName: string): Locator =>
  channelTable(page)
    .locator("tbody tr")
    .filter({ has: page.getByText(channelName, { exact: true }) });

export const channelCount = (page: Page): Locator =>
  page.getByText("導入チャンネル数", { exact: true }).locator("..");

export const flash = (page: Page): Locator => page.getByRole("status");

export const openUserMenu = async (page: Page): Promise<void> => {
  await waitForIsland(page, "UserMenuIsland");
  await page.getByRole("button", { name: "Dev User" }).click();
};

/** Switch the UI language through the header globe menu. */
export const switchLanguage = async (
  page: Page,
  language: "日本語" | "English",
): Promise<void> => {
  await waitForIsland(page, "LanguageSelectorIsland");
  await page.getByRole("button", { name: /^(言語|Language)$/ }).click();
  await page.getByRole("menuitem", { name: language }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "lang",
    language === "English" ? "en" : "ja",
  );
};

export const openEditModal = async (
  page: Page,
  channelName: string,
): Promise<Locator> => {
  await page.getByRole("button", { name: `編集 #${channelName}` }).click();
  const dialog = page.getByRole("dialog", { name: `#${channelName} の設定` });
  await expect(dialog).toBeVisible();
  return dialog;
};

export const openAddModal = async (page: Page): Promise<Locator> => {
  await page.getByRole("button", { name: "チャンネルを追加" }).first().click();
  const dialog = page.getByRole("dialog", { name: "チャンネルを追加" });
  await expect(dialog).toBeVisible();
  return dialog;
};
