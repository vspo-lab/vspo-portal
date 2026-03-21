import { getViteConfig } from "astro/config";

export default getViteConfig(
  {
    test: {
      globals: true,
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        include: ["src/features/**/*.ts", "src/components/**/*.astro"],
        exclude: [
          "src/**/*.test.{ts,tsx}",
          "src/**/index.ts",
          "src/features/auth/repository/**",
          "src/features/channel/repository/**",
          "src/features/guild/repository/**",
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
