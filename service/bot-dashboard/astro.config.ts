import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://discord.vspo-schedule.com",
  output: "server",
  i18n: {
    defaultLocale: "ja",
    locales: ["ja", "en"],
  },
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
  },
});
