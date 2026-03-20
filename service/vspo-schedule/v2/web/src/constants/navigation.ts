import { DISCORD_LINK, QA_LINK } from "@/lib/Const";

const internalRoutes = {
  list: "/schedule/all",
  archive: "/schedule/archive",
  live: "/schedule/live",
  upcoming: "/schedule/upcoming",
  freechat: "/freechat",
  clip: "/clips",
  multiview: "/multiview",
  about: "/about",
  "site-news": "/site-news",
} as const;

const externalRoutes = {
  qa: QA_LINK,
  discord: DISCORD_LINK,
} as const;

const navigationRoutes = { ...internalRoutes, ...externalRoutes };

export type NavigationRouteId = keyof typeof navigationRoutes;

export const getNavigationRouteInfo = (id: NavigationRouteId) => {
  return {
    link: navigationRoutes[id] ?? "",
    isExternalLink: id in externalRoutes,
  };
};
