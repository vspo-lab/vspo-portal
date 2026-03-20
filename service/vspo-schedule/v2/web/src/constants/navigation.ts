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

/** Route IDs that map to actual navigation destinations. */
type RoutableNavigationId = keyof typeof navigationRoutes;

/** UI-only identifiers that appear in navigation components but have no route. */
type UiOnlyNavigationId = "more";

export type NavigationRouteId = RoutableNavigationId | UiOnlyNavigationId;

/** Returns route info for a navigation ID. UI-only IDs return an empty link. */
export const getNavigationRouteInfo = (id: NavigationRouteId) => {
  if (id in navigationRoutes) {
    const routableId = id as RoutableNavigationId;
    return {
      link: navigationRoutes[routableId] ?? "",
      isExternalLink: routableId in externalRoutes,
    };
  }
  return { link: "", isExternalLink: false };
};
