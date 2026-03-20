import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";
import { DiscordApiRepository } from "~/features/auth/repository/discord-api";
import type { GuildSummaryType } from "../domain/guild";
import { GuildSummary } from "../domain/guild";
import { VspoGuildApiRepository } from "../repository/vspo-guild-api";

type ListGuildsParams = {
  accessToken: string;
  appWorker: Fetcher;
};

type ListGuildsResult = {
  installed: GuildSummaryType[];
  notInstalled: GuildSummaryType[];
  sidebarGuilds: { id: string; name: string; iconUrl: string | null }[];
};

/**
 * Retrieve the list of servers the user can manage
 * @precondition Valid accessToken and appWorker are required
 * @postcondition Returns results categorized into installed / notInstalled / sidebarGuilds
 */
const execute = async (
  params: ListGuildsParams,
): Promise<Result<ListGuildsResult, AppError>> => {
  const [guildsResult, botGuildIdsResult] = await Promise.all([
    DiscordApiRepository.getUserGuilds(params.accessToken),
    VspoGuildApiRepository.getBotGuildIds(params.appWorker),
  ]);

  if (guildsResult.err) return guildsResult;
  if (botGuildIdsResult.err) return botGuildIdsResult;

  const guilds = guildsResult.val.map((g) =>
    GuildSummary.fromDiscordGuild(g, botGuildIdsResult.val),
  );
  const manageable = GuildSummary.filterManageable(guilds);
  const { installed, notInstalled } = GuildSummary.partition(manageable);

  return Ok({
    installed,
    notInstalled,
    sidebarGuilds: installed.map((g) => ({
      id: g.id,
      name: g.name,
      iconUrl: GuildSummary.iconUrl(g),
    })),
  });
};

export const ListGuildsUsecase = { execute } as const;
