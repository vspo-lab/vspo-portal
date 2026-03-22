import withSerwistInit from "@serwist/next";
import createNextIntlPlugin from "next-intl/plugin";
import pkgJson from "./package.json" with { type: "json" };

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const emotionPackages = Object.keys(pkgJson.dependencies).filter((pkg) =>
  pkg.startsWith("@emotion/"),
);

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-tweet"],
  compiler: {
    emotion: {
      sourceMap: process.env.NODE_ENV !== "production",
      autoLabel: "dev-only",
      labelFormat: "[local]",
    },
  },
  experimental: {
    reactCompiler: true,
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "date-fns",
      "date-fns-tz",
      "@fortawesome/free-solid-svg-icons",
      "@fortawesome/free-brands-svg-icons",
    ],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  serverExternalPackages: emotionPackages,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
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
      ].map((hostname) => ({
        hostname,
        protocol: "https",
        port: "",
        pathname: "**",
      })),
    ],
  },
  skipMiddlewareUrlNormalize: true,
  async headers() {
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
