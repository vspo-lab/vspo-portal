import type { AppError, Result } from "@vspo-lab/error";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api";

type ToggleChannelParams = {
  appWorker: Fetcher;
  guildId: string;
  channelId: string;
  enable: boolean;
};

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
