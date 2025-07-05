import nextPWA from "next-pwa";
import ci18n from "./next-i18next.config.js";
import pkgJson from "./package.json" with { type: "json" };

const withPWA = nextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/www\.vspo-schedule\.com/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "vspo-schedule",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60, // 1 minutes
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

const emotionPackages = Object.keys(pkgJson.dependencies).filter((pkg) =>
  pkg.startsWith("@emotion/"),
);

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-tweet"],
  compiler: {
    emotion: {
      // Enable source maps during development
      sourceMap: process.env.NODE_ENV !== "production",
      // Labels for dev environment only to help with debugging
      autoLabel: "dev-only",
      // Use a more readable format for the label
      labelFormat: "[local]",
    },
  },
  experimental: {
    scrollRestoration: true,
  },
  serverExternalPackages: emotionPackages,
  images: {
    remotePatterns: [
      {
        hostname: "localhost",
        protocol: "http",
        port: "3000",
        pathname: "**",
      },
      {
        hostname: "imagegw03.twitcasting.tv",
        protocol: "http",
        port: "",
        pathname: "**",
      },
      ...[
        "i.ytimg.com",
        "vod-secure.twitch.tv",
        "static-cdn.jtvnw.net",
        "imagegw03.twitcasting.tv",
        "secure-dcdn.cdn.nimg.jp",
        "yt3.googleusercontent.com",
        "yt3.ggpht.com",
        "clips-media-assets2.twitch.tv",
      ].map(
        (hostname) =>
          ({
            hostname,
            protocol: "https",
            port: "",
            pathname: "**",
          }),
      ),
    ],
  },
  i18n: {
    defaultLocale: ci18n.i18n.defaultLocale,
    locales: ci18n.i18n.locales,
    localeDetection: false,
  },
  skipMiddlewareUrlNormalize: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/schedule/all",
        permanent: true,
      },
      {
        source: "/notifications/:id*",
        destination: "/site-news/:id*",
        permanent: true,
      },
    ];
  },
};

export default withPWA(nextConfig);

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
