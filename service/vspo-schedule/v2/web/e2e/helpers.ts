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
 * Open the navigation drawer from the header button.
 *
 * @precondition The page shows the app header; the drawer is closed.
 * @postcondition The drawer paper is visible. It is rendered with `disablePortal`, so MUI
 *   marks its ancestor aria-hidden while open; role queries inside it need `includeHidden`.
 * @idempotent false - a second call toggles the drawer closed again.
 */
export const openDrawer = async (page: Page): Promise<Locator> => {
  await page.getByRole("button", { name: "toggle drawer" }).click();
  const drawer = page.locator(".MuiDrawer-paper");
  await expect(drawer).toBeVisible();
  return drawer;
};

/**
 * Close the drawer with the Escape key.
 *
 * @precondition `drawer` was returned by `openDrawer` and is open.
 * @postcondition The drawer is hidden and the page content is reachable by role again.
 * @idempotent true - Escape on a closed drawer is a no-op.
 */
export const closeDrawer = async (
  page: Page,
  drawer: Locator,
): Promise<void> => {
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
};

/**
 * Locator for a navigation link inside the open drawer (hidden-aware, exact name).
 *
 * @precondition `drawer` was returned by `openDrawer`.
 * @postcondition Pure locator; nothing is performed until it is used.
 * @idempotent true
 */
export const drawerLink = (drawer: Locator, name: string): Locator =>
  drawer.getByRole("link", { name, exact: true, includeHidden: true });

/**
 * Locator for the first stream / clip card in `main` whose accessible name contains `title`.
 *
 * @precondition A page that renders `VideoCard`s (schedule, archive, freechat, clip lists).
 * @postcondition Pure locator; nothing is performed until it is used.
 * @idempotent true
 */
export const videoCard = (page: Page, title: string): Locator =>
  page.getByRole("main").getByRole("button", { name: title }).first();

/**
 * Click `target` until `expectation` holds; client components can hydrate after the
 * route announcer appears, so the first click may be swallowed.
 *
 * @precondition `target` resolves to one clickable element.
 * @postcondition `expectation` passed at least once, or the call throws after 20 s.
 * @idempotent depends on the click - callers pass clicks that are safe to repeat.
 */
const clickUntil = async (
  target: Locator,
  expectation: () => Promise<void>,
): Promise<void> => {
  await expect(async () => {
    await target.click();
    await expectation();
  }).toPass({ timeout: 20_000, intervals: [500, 1_000, 2_000] });
};

/**
 * Open the video modal for the card matched by `title`.
 *
 * @precondition No dialog is open; the card is present in `main`.
 * @postcondition The dialog containing `title` is visible and returned.
 * @idempotent false - call `closeVideoModal` before opening another card.
 */
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

/**
 * Close the video modal with its 戻る button.
 *
 * @precondition `dialog` was returned by `openVideoModal` and is visible.
 * @postcondition The dialog is hidden.
 * @idempotent false - the button no longer exists once the dialog is closed.
 */
export const closeVideoModal = async (dialog: Locator): Promise<void> => {
  await dialog.getByRole("button", { name: "戻る" }).click();
  await expect(dialog).toBeHidden();
};

/**
 * Locator for the すべて / 配信中 / 配信予定 tab list on `/schedule/*` pages.
 *
 * @precondition A schedule page other than the archive.
 * @postcondition Pure locator; nothing is performed until it is used.
 * @idempotent true
 */
export const statusTabs = (page: Page): Locator =>
  page.getByRole("tablist", { name: "livestream status tabs" });

/**
 * Open the 検索条件 dialog from the floating search button.
 *
 * @precondition A schedule page; the dialog is closed.
 * @postcondition The dialog titled 検索条件 is visible and returned.
 * @idempotent false - the button is covered while the dialog is open.
 */
export const openSearchDialog = async (page: Page): Promise<Locator> => {
  await page.getByRole("button", { name: "検索条件" }).click();
  const dialog = page.getByRole("dialog", { name: "検索条件" });
  await expect(dialog).toBeVisible();
  return dialog;
};

/**
 * Pick an option from a MUI Select rendered as a combobox.
 *
 * @precondition `combobox` is visible and its listbox is closed.
 * @postcondition The option named `option` is selected and the listbox is closed.
 * @idempotent true - selecting the same option again leaves the value unchanged.
 */
export const selectOption = async (
  page: Page,
  combobox: Locator,
  option: string,
): Promise<void> => {
  await combobox.click();
  await page.getByRole("option", { name: option, exact: true }).click();
};
