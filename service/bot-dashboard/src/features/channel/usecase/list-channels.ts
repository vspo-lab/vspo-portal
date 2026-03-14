import type { AppError, Result } from "@vspo-lab/error";
import type { GuildBotConfigType } from "~/features/guild/domain/guild";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api";

type ListChannelsParams = {
  appWorker: Fetcher;
  guildId: string;
};

/**
 * 指定サーバーのチャンネル Bot 設定一覧を取得する
 * @precondition 有効な appWorker と guildId が必要
 * @postcondition サーバーの GuildBotConfig を返す
 */
const execute = async (
  params: ListChannelsParams,
): Promise<Result<GuildBotConfigType, AppError>> => {
  return VspoChannelApiRepository.getGuildConfig(
    params.appWorker,
    params.guildId,
  );
};

export const ListChannelsUsecase = { execute } as const;
