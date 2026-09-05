import { defineConfig, devices } from "@playwright/test";

const PORT = 4341;
const baseURL = `http://localhost:${PORT}`;

// Discord login and the APP_WORKER RPC are the only external dependencies; both are
// replaced by the dev mock (DEV_MOCK_AUTH) so the app itself runs unmodified.
const webServerEnv = {
  ...process.env,
  DEV_MOCK_AUTH: "true",
  DISCORD_CLIENT_ID: "e2e-client-id",
  DISCORD_CLIENT_SECRET: "e2e-client-secret",
  DISCORD_REDIRECT_URI: `${baseURL}/auth/callback`,
  DISCORD_BOT_CLIENT_ID: "e2e-bot-id",
  CONTACT_FORM_URL: "https://example.com/contact",
  ASTRO_DEV_BACKGROUND: "0",
  ASTRO_TELEMETRY_DISABLED: "1",
} satisfies Record<string, string | undefined>;

export default defineConfig({
  testDir: "./e2e",
  // The dev-mock channel store is process-wide state, so specs must not interleave.
  fullyParallel: false,
  workers: 1,
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
    command: `pnpm exec astro dev --config astro.config.e2e.ts --port ${PORT}`,
    url: `${baseURL}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: webServerEnv,
  },
});
