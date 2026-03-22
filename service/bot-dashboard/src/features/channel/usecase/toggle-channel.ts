import type { AppError, Result } from "@vspo-lab/error";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api";

type ToggleChannelParams = {
  appWorker: Fetcher;
  guildId: string;
  channelId: string;
  enable: boolean;
};

/**
 * Applies the requested enabled state to a guild channel configuration.
 *
 * @param params - App worker binding, target guild/channel IDs, and the desired enabled state
 * @returns Ok(undefined) after delegating the state change, or an AppError
 * @precondition params.guildId !== "" && params.channelId !== "" && params.appWorker is a configured Fetcher
 * @postcondition On Ok, the repository method matching params.enable has been invoked for params.guildId and params.channelId
 * @idempotent Delegates to repository; idempotency depends on repository implementation
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
