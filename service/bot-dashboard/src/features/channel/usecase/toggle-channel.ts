import type { AppError, Result } from "@vspo-lab/error";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api";

type ToggleChannelParams = {
  appWorker: Fetcher;
  guildId: string;
  channelId: string;
  enable: boolean;
};

/**
 * チャンネルの有効/無効を切り替える
 * @precondition 有効な appWorker, guildId, channelId が必要
 * @postcondition enable が true なら有効化、false なら無効化される
 */
const execute = async (
  params: ToggleChannelParams,
): Promise<Result<void, AppError>> => {
  if (params.enable) {
    return VspoChannelApiRepository.enableChannel(
      params.appWorker,
      params.guildId,
      params.channelId,
    );
  }
  return VspoChannelApiRepository.disableChannel(
    params.appWorker,
    params.guildId,
    params.channelId,
  );
};

export const ToggleChannelUsecase = { execute } as const;
