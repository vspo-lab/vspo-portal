import { redirect } from "react-router";
import { UserMenuContainer } from "~/features/auth";
import { GetCurrentUserUsecase } from "~/features/auth/index.server";
import { ListGuildsUsecase } from "~/features/guild/index.server";
import {
  DashboardLayout,
  HeaderContainer,
  SidebarPresenter,
} from "~/features/shared";
import type { Route } from "./+types/dashboard";

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;

  const userResult = await GetCurrentUserUsecase.execute(
    request,
    env.SESSION_SECRET,
  );
  if (userResult.err) throw redirect("/");

  const guildsResult = await ListGuildsUsecase.execute({
    accessToken: userResult.val.session.accessToken,
    apiUrl: env.VSPO_API_URL,
    apiKey: env.VSPO_API_KEY,
  });

  const { guilds, sidebarGuilds } = guildsResult.err
    ? { guilds: [], sidebarGuilds: [] }
    : guildsResult.val;

  return {
    user: userResult.val.user,
    guilds,
    sidebarGuilds,
    botClientId: env.DISCORD_BOT_CLIENT_ID,
  };
}

export default function DashboardRoute({ loaderData }: Route.ComponentProps) {
  const { user, sidebarGuilds } = loaderData;

  return (
    <DashboardLayout
      header={<HeaderContainer userMenu={<UserMenuContainer user={user} />} />}
      sidebar={<SidebarPresenter guilds={sidebarGuilds} />}
    />
  );
}
