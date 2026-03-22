import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";
import { DiscordApiRepository } from "~/features/auth/repository/discord-api";
import { VspoChannelApiRepository } from "~/features/channel/repository/vspo-channel-api";
import type { ApplicationService } from "~/types/api";
import type { GuildSummaryType } from "../domain/guild";
import { GuildSummary } from "../domain/guild";
import { VspoGuildApiRepository } from "../repository/vspo-guild-api";

type ListGuildsParams = {
  accessToken: string;
  appWorker: ApplicationService;
};

type ListGuildsResult = {
  installed: GuildSummaryType[];
  notInstalled: GuildSummaryType[];
  sidebarGuilds: { id: string; name: string; iconUrl: string | null }[];
};

/**
 * Retrieves the guilds the current user can manage and categorizes them for the dashboard.
 *
 * @param params - Discord access token and app worker binding used to query guild data
 * @returns Installed guilds, not-installed guilds, and sidebar guild metadata, or an AppError
 * @precondition params.accessToken !== "" && params.appWorker is a configured ApplicationService
 * @postcondition On Ok, every guild in return.val.installed has botInstalled === true and return.val.sidebarGuilds is derived from return.val.installed
 * @idempotent true - The use case is read-only and repeated calls against unchanged upstream data yield the same categorization
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
