import { test as base, type Page } from "@playwright/test";

export { expect } from "@playwright/test";

/**
 * Server-rendered buttons ignore clicks until React hydrates. Next.js appends
 * `<next-route-announcer>` only on the client, so it doubles as a hydration marker.
 * Console errors and page errors are printed when a test fails so CI logs explain
 * a page that looks right but does not react.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use, testInfo) => {
    const browserLogs: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        browserLogs.push(`[console.${message.type()}] ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      browserLogs.push(`[pageerror] ${error.message}`);
    });

    const goto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await goto(url, options);
      await page
        .locator("next-route-announcer")
        .waitFor({ state: "attached", timeout: 30_000 });
      // Let streamed segments and router fetches settle; images may keep the network busy.
      await page
        .waitForLoadState("networkidle", { timeout: 15_000 })
        .catch(() => undefined);
      return response;
    };

    await use(page);

    if (testInfo.status !== testInfo.expectedStatus && browserLogs.length > 0) {
      console.log(
        `Browser logs for "${testInfo.title}":\n${browserLogs.join("\n")}`,
      );
    }
  },
});
