import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";
import { DiscordApiRepository } from "~/features/auth/repository/discord-api";
import { VspoChannelApiRepository } from "~/features/channel/repository/vspo-channel-api";
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

  // Fetch channel configs for all installed guilds in parallel.
  // Per-guild failures are swallowed so a single bad guild does not block the page.
  const installedWithSummaries = await Promise.all(
    installed.map(async (guild) => {
      const channelResult = await VspoChannelApiRepository.getGuildConfig(
        params.appWorker,
        guild.id,
      );
      if (channelResult.err) return guild;
      return GuildSummary.withChannelSummary(guild, channelResult.val.channels);
    }),
  );

  return Ok({
    installed: installedWithSummaries,
    notInstalled,
    sidebarGuilds: installedWithSummaries.map((g) => ({
      id: g.id,
      name: g.name,
      iconUrl: GuildSummary.iconUrl(g),
    })),
  });
};

export const ListGuildsUsecase = { execute } as const;
