import type { AppError, Result } from "@vspo-lab/error";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api";

type ToggleChannelParams = {
  apiUrl: string;
  apiKey: string;
  guildId: string;
  channelId: string;
  enable: boolean;
};

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
