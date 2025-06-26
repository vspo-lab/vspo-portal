import { DISCORD_LINK, QA_LINK } from "@/lib/Const";
import { formatDate } from "@/lib/utils";
import { getCurrentUTCDate } from "@vspo-lab/dayjs";

const internalRoutes = {
  list: "/schedule/all",
  archive: "/schedule/archive",
  live: "/schedule/live",
  upcoming: "/schedule/upcoming",
  freechat: "/freechat",
  clip: "/clips",
  event: (timeZone: string) =>
    `/events/${formatDate(getCurrentUTCDate(), "yyyy-MM", { timeZone })}`,
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

export const getNavigationRouteInfo = (
  id: NavigationRouteId,
  timeZone: string,
) => {
  const link =
    id === "event" ? navigationRoutes[id](timeZone) : navigationRoutes[id];

  return {
    link: link ?? "",
    isExternalLink: id in externalRoutes,
  };
};
