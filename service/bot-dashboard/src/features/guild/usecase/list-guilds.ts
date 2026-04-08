import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";
import { DiscordOAuthRpcRepository } from "~/features/auth/repository/discord-oauth-rpc";
import { VspoChannelApiRepository } from "~/features/channel/repository/vspo-channel-api";
import type { ApplicationService } from "~/types/api";
import type { GuildSummaryType } from "../domain/guild";
import { GuildSummary } from "../domain/guild";
import { VspoGuildApiRepository } from "../repository/vspo-guild-api";

type ListGuildsParams = {
  accessToken: string;
  userId: string;
  appWorker: ApplicationService;
  includeChannelSummary?: boolean;
};

type ListGuildsResult = {
  installed: GuildSummaryType[];
  notInstalled: GuildSummaryType[];
  sidebarGuilds: { id: string; name: string; iconUrl: string | null }[];
};

/**
 * Retrieves the guilds the current user can manage and categorizes them for the dashboard.
 *
 * @param params - Discord access token, user ID, app worker binding, and optional includeChannelSummary (default true; when false, skips per-guild channel config fetches)
 * @returns Installed guilds, not-installed guilds, and sidebar guild metadata, or an AppError
 * @precondition params.accessToken !== "" && params.userId !== "" && params.appWorker is configured
 * @postcondition On Ok, installed guilds have botInstalled === true and isAdmin === true
 * @idempotent true - repeated calls with unchanged upstream data yield the same categorization
 */
const execute = async (
  params: ListGuildsParams,
): Promise<Result<ListGuildsResult, AppError>> => {
  const { includeChannelSummary = true } = params;
  const [guildsResult, botGuildIdsResult] = await Promise.all([
    DiscordOAuthRpcRepository.getUserGuilds(
      params.appWorker,
      params.accessToken,
    ),
    VspoGuildApiRepository.getBotGuildIds(params.appWorker),
  ]);

  if (guildsResult.err) return guildsResult;
  if (botGuildIdsResult.err) return botGuildIdsResult;

  const guilds = guildsResult.val.map((g) =>
    GuildSummary.fromDiscordGuild(g, botGuildIdsResult.val),
  );

  // For installed guilds, check admin permissions via bot token
  const installedGuildIds = guilds
    .filter((g) => g.botInstalled)
    .map((g) => g.id);

  const adminCheckResult =
    installedGuildIds.length > 0
      ? await VspoGuildApiRepository.checkUserGuildAdmin(
          params.appWorker,
          params.userId,
          installedGuildIds,
        )
      : Ok({} as Record<string, boolean>);

  const adminMap = adminCheckResult.err ? {} : adminCheckResult.val;

  // Apply server-side admin check results to installed guilds
  const resolvedGuilds = guilds.map((g) =>
    g.botInstalled
      ? GuildSummary.withAdminOverride(g, adminMap[g.id] ?? false)
      : g,
  );

  const manageable = GuildSummary.filterManageable(resolvedGuilds);
  const { installed, notInstalled } = GuildSummary.partition(manageable);

  // Fetch channel configs for all installed guilds in parallel if requested.
  // Per-guild failures are swallowed so a single bad guild does not block the page.
  const installedWithSummaries = includeChannelSummary
    ? await Promise.all(
        installed.map(async (guild) => {
          const channelResult = await VspoChannelApiRepository.getGuildConfig(
            params.appWorker,
            guild.id,
          );
          if (channelResult.err) return guild;
          return GuildSummary.withChannelSummary(
            guild,
            channelResult.val.channels,
          );
        }),
      )
    : installed;

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
