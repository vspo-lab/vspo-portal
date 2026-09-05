import { test as base, type Page } from "@playwright/test";

export { expect } from "@playwright/test";

/**
 * Server-rendered buttons ignore clicks until React hydrates. Next.js appends
 * `<next-route-announcer>` only on the client, so it doubles as a hydration marker.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await goto(url, options);
      await page
        .locator("next-route-announcer")
        .waitFor({ state: "attached", timeout: 30_000 });
      return response;
    };
    await use(page);
  },
});
