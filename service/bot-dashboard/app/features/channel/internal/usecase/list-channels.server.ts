import type { AppError, Result } from "@vspo-lab/error";
import type { GuildBotConfigType } from "~/features/guild";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api.server";

type ListChannelsParams = {
  apiUrl: string;
  apiKey: string;
  guildId: string;
};

/**
 * サーバーのチャンネル設定一覧を取得する
 * @postcondition GuildBotConfig を返す
 */
const execute = async (
  params: ListChannelsParams,
): Promise<Result<GuildBotConfigType, AppError>> => {
  return VspoChannelApiRepository.getGuildConfig(
    params.apiUrl,
    params.apiKey,
    params.guildId,
  );
};

export const ListChannelsUsecase = { execute } as const;
