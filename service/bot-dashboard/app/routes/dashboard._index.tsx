import { useRouteLoaderData } from "react-router";
import { GuildListContainer } from "~/features/guild";
import type { Route as DashboardRoute } from "./+types/dashboard";

export default function DashboardIndexRoute() {
  const parentData = useRouteLoaderData(
    "routes/dashboard",
  ) as DashboardRoute.ComponentProps["loaderData"];

  return (
    <GuildListContainer
      guilds={parentData.guilds}
      botClientId={parentData.botClientId}
    />
  );
}
