import { getViteConfig } from "astro/config";

export default getViteConfig(
  {
    test: {
      globals: true,
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "json-summary", "html"],
        include: ["src/**/*.{ts,tsx,astro}"],
        exclude: [
          "src/**/*.test.{ts,tsx}",
          "src/**/index.ts",
          "src/**/*.d.ts",
          "src/types/**",
          "src/test-utils/**",
          // Route files are covered by the Playwright suite; v8 cannot remap every .astro page.
          "src/pages/**",
        ],
      },
      clearMocks: true,
      restoreMocks: true,
    },
  },
  {
    // Skip loading astro.config.ts to avoid the Cloudflare adapter's
    // Vite plugin conflicting with Vitest's environment resolution.
    configFile: false,
    // Reproduce essential settings from astro.config.ts without the adapter.
    output: "server",
    i18n: {
      defaultLocale: "ja",
      locales: ["ja", "en"],
    },
  },
);
