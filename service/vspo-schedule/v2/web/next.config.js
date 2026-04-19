import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import withSerwistInit from "@serwist/next";
import createNextIntlPlugin from "next-intl/plugin";

const __dirname = dirname(fileURLToPath(import.meta.url));

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig = {
  output: "standalone",
  // Trace files up to monorepo root for standalone build (required by @opennextjs/cloudflare)
  outputFileTracingRoot: resolve(__dirname, "../../../../"),
  reactStrictMode: true,
  transpilePackages: ["react-tweet"],
  reactCompiler: true,
  compiler: {
    emotion: {
      sourceMap: process.env.NODE_ENV !== "production",
      autoLabel: "dev-only",
      labelFormat: "[local]",
    },
  },
  experimental: {
    // @mui/material and date-fns are auto-optimized by Next.js
    optimizePackageImports: [
      "@mui/icons-material",
      "date-fns-tz",
      "@fortawesome/free-solid-svg-icons",
      "@fortawesome/free-brands-svg-icons",
    ],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    remotePatterns: [
      ...(process.env.NODE_ENV !== "production"
        ? [
            {
              hostname: "localhost",
              protocol: "http",
              port: "3000",
              pathname: "**",
            },
          ]
        : []),
      ...[
        "i.ytimg.com",
        "vod-secure.twitch.tv",
        "static-cdn.jtvnw.net",
        "imagegw03.twitcasting.tv",
        "secure-dcdn.cdn.nimg.jp",
        "yt3.googleusercontent.com",
        "yt3.ggpht.com",
        "clips-media-assets2.twitch.tv",
      ].map((hostname) => ({
        hostname,
        protocol: "https",
        port: "",
        pathname: "**",
      })),
    ],
  },
  async headers() {
    // Keep media/YouTube embeds working while hardening the top frame.
    // See docs/security/vspo-schedule-review.md for rationale.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://i.ytimg.com https://yt3.googleusercontent.com https://yt3.ggpht.com https://static-cdn.jtvnw.net https://vod-secure.twitch.tv https://clips-media-assets2.twitch.tv https://secure-dcdn.cdn.nimg.jp https://imagegw03.twitcasting.tv",
      "media-src 'self' blob:",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.twitch.tv https://clips.twitch.tv https://twitcasting.tv https://embed.nicovideo.jp",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
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
      {
        source: "/default/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default withSerwist(withNextIntl(nextConfig));

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
