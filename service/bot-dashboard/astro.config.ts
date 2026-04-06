import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://discord.vspo-schedule.com",
  output: "server",
  trailingSlash: "never",
  security: {
    checkOrigin: true,
  },
  prefetch: {
    defaultStrategy: "viewport",
  },
  i18n: {
    defaultLocale: "ja",
    locales: ["ja", "en"],
  },
  adapter: cloudflare(),
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes("/dashboard") &&
        !page.includes("/auth") &&
        !page.includes("/api"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
