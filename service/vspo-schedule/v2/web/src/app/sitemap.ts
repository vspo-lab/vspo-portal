import type { MetadataRoute } from "next";

const BASE_URL = "https://www.vspo-schedule.com";
const locales = ["en", "cn", "ko", "tw"];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    {
      path: "/schedule/all",
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    { path: "/clips", changeFrequency: "daily" as const, priority: 0.8 },
    {
      path: "/clips/youtube",
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      path: "/clips/twitch",
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      path: "/clips/youtube/shorts",
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      path: "/freechat",
      changeFrequency: "daily" as const,
      priority: 0.7,
    },
    {
      path: "/multiview",
      changeFrequency: "daily" as const,
      priority: 0.7,
    },
    {
      path: "/about",
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      path: "/privacy-policy",
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      path: "/terms",
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      path: "/site-news",
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  return pages.flatMap((page) => [
    {
      url: `${BASE_URL}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    },
    ...locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
  ]);
}
