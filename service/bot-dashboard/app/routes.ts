import {
  index,
  layout,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("auth/discord", "routes/auth.discord.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  route("auth/logout", "routes/auth.logout.tsx"),
  layout("routes/dashboard.tsx", [
    route("dashboard", "routes/dashboard._index.tsx"),
    route("dashboard/:guildId", "routes/dashboard.$guildId.tsx"),
  ]),
] satisfies RouteConfig;
