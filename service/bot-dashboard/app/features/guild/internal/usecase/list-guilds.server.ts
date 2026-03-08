import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";
import { DiscordApiRepository } from "~/features/auth/index.server";
import type { GuildSummaryType } from "../domain/guild";
import { GuildSummary } from "../domain/guild";
import { VspoGuildApiRepository } from "../repository/vspo-guild-api.server";

type ListGuildsParams = {
  accessToken: string;
  apiUrl: string;
  apiKey: string;
};

type ListGuildsResult = {
  guilds: GuildSummaryType[];
  sidebarGuilds: { id: string; name: string; iconUrl: string | null }[];
};

/**
 * ユーザーが管理可能なサーバー一覧を取得する
 * @precondition 有効な access token が必要
 * @postcondition MANAGE_GUILD 権限を持つサーバーのみ返す。サイドバー用データも生成する。
 */
const execute = async (
  params: ListGuildsParams,
): Promise<Result<ListGuildsResult, AppError>> => {
  const [guildsResult, botGuildIdsResult] = await Promise.all([
    DiscordApiRepository.getUserGuilds(params.accessToken),
    VspoGuildApiRepository.getBotGuildIds(params.apiUrl, params.apiKey),
  ]);

  if (guildsResult.err) return guildsResult;
  if (botGuildIdsResult.err) return botGuildIdsResult;

  const guilds = guildsResult.val.map((g) =>
    GuildSummary.fromDiscordGuild(g, botGuildIdsResult.val),
  );
  const manageable = GuildSummary.filterManageable(guilds);
  const { installed } = GuildSummary.partition(manageable);

  return Ok({
    guilds: manageable,
    sidebarGuilds: installed.map((g) => ({
      id: g.id,
      name: g.name,
      iconUrl: GuildSummary.iconUrl(g),
    })),
  });
};

export const ListGuildsUsecase = { execute } as const;
