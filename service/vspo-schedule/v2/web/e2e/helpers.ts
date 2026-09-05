import { expect, type Locator, type Page } from "@playwright/test";

/** Upcoming YouTube stream in the mock data (05/08 23:45 JST). */
export const UPCOMING_STREAM = {
  title: "Only Up! day1 総集編",
  channel: "Akari ch.夢野あかり",
  link: "https://www.youtube.com/watch?v=KkOUGHyxcK4",
};

/** Live Twitch stream in the mock data (05/11 05:45 JST). */
export const LIVE_STREAM = {
  title: "えなこカップ 本番！",
  channel: "Akari ch.夢野あかり",
  link: "https://www.twitch.tv/akarindao",
};

/**
 * The drawer is rendered with `disablePortal`, so MUI marks its own ancestor
 * aria-hidden while it is open. Role queries inside it need `includeHidden`.
 */
export const openDrawer = async (page: Page): Promise<Locator> => {
  await page.getByRole("button", { name: "toggle drawer" }).click();
  const drawer = page.locator(".MuiDrawer-paper");
  await expect(drawer).toBeVisible();
  return drawer;
};

export const closeDrawer = async (
  page: Page,
  drawer: Locator,
): Promise<void> => {
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
};

export const drawerLink = (drawer: Locator, name: string): Locator =>
  drawer.getByRole("link", { name, exact: true, includeHidden: true });

export const videoCard = (page: Page, title: string): Locator =>
  page.getByRole("main").getByRole("button", { name: title }).first();

/** Client components can hydrate after the route announcer appears, so retry the click. */
export const clickUntil = async (
  target: Locator,
  expectation: () => Promise<void>,
): Promise<void> => {
  await expect(async () => {
    await target.click();
    await expectation();
  }).toPass({ timeout: 20_000, intervals: [500, 1_000, 2_000] });
};

export const openVideoModal = async (
  page: Page,
  title: string,
): Promise<Locator> => {
  const dialog = page.getByRole("dialog").filter({ hasText: title });
  await clickUntil(videoCard(page, title), () =>
    expect(dialog).toBeVisible({ timeout: 2_000 }),
  );
  return dialog;
};

export const closeVideoModal = async (dialog: Locator): Promise<void> => {
  await dialog.getByRole("button", { name: "戻る" }).click();
  await expect(dialog).toBeHidden();
};

export const statusTabs = (page: Page): Locator =>
  page.getByRole("tablist", { name: "livestream status tabs" });

export const openSearchDialog = async (page: Page): Promise<Locator> => {
  await page.getByRole("button", { name: "検索条件" }).click();
  const dialog = page.getByRole("dialog", { name: "検索条件" });
  await expect(dialog).toBeVisible();
  return dialog;
};

/** Pick an option from a MUI Select rendered as a combobox. */
export const selectOption = async (
  page: Page,
  combobox: Locator,
  option: string,
): Promise<void> => {
  await combobox.click();
  await page.getByRole("option", { name: option, exact: true }).click();
};
