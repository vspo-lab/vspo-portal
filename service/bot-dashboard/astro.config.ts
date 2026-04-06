import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Noto Sans JP",
      cssVariable: "--font-sans",
      weights: [400, 500, 700],
      styles: ["normal"],
      subsets: ["latin", "japanese"],
    },
    {
      provider: fontProviders.google(),
      name: "M PLUS Rounded 1c",
      cssVariable: "--font-heading",
      weights: [700, 800],
      styles: ["normal"],
      subsets: ["latin", "japanese"],
    },
  ],
  site: "https://discord.vspo-schedule.com",
  output: "server",
  trailingSlash: "never",
  security: {
    checkOrigin: true,
  },
  prefetch: {
    defaultStrategy: "hover",
  },
  i18n: {
    defaultLocale: "ja",
    locales: ["ja", "en"],
  },
  session: {
    cookie: {
      name: "vspo-dash-session",
      sameSite: "lax",
      httpOnly: true,
      secure: true,
    },
    ttl: 86400,
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
