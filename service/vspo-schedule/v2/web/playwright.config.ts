import { defineConfig, devices } from "@playwright/test";

const PORT = 4010;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    // The Discord Bot snackbar sits over the tab row and intercepts clicks; pre-dismiss it.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: baseURL,
          localStorage: [{ name: "alertSeen-discordBot", value: "true" }],
        },
      ],
    },
    trace: "retain-on-failure",
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
          : {},
      },
    },
  ],
  webServer: {
    // Production server: the dev overlay intercepts clicks and per-route compiles blow the timeouts.
    command: `pnpm exec next start -p ${PORT}`,
    url: `${baseURL}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      // Makes @vspo-lab/api serve its bundled mock data instead of calling the API.
      ENV: "local",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
