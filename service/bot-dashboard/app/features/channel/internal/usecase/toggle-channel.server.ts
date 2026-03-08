import type { AppError, Result } from "@vspo-lab/error";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api.server";

type ToggleChannelParams = {
  apiUrl: string;
  apiKey: string;
  guildId: string;
  channelId: string;
  enable: boolean;
};

/**
 * チャンネルの Bot を有効化/無効化する
 * @postcondition enable=true なら有効化、false なら無効化
 */
const execute = async (
  params: ToggleChannelParams,
): Promise<Result<void, AppError>> => {
  if (params.enable) {
    return VspoChannelApiRepository.enableChannel(
      params.apiUrl,
      params.apiKey,
      params.guildId,
      params.channelId,
    );
  }
  return VspoChannelApiRepository.disableChannel(
    params.apiUrl,
    params.apiKey,
    params.guildId,
    params.channelId,
  );
};

export const ToggleChannelUsecase = { execute } as const;
