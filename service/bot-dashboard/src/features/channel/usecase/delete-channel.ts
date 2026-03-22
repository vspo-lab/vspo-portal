import type { AppError, Result } from "@vspo-lab/error";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api";

type DeleteChannelParams = {
  appWorker: Fetcher;
  guildId: string;
  channelId: string;
};

/**
 * Remove a channel's Bot configuration entry for a given guild.
 * @precondition Valid appWorker, guildId, and channelId are required
 * @postcondition The channel is removed from the Bot configuration; idempotent
 */
const execute = async (
  params: DeleteChannelParams,
): Promise<Result<void, AppError>> =>
  VspoChannelApiRepository.deleteChannel(
    params.appWorker,
    params.guildId,
    params.channelId,
  );

export const DeleteChannelUsecase = { execute } as const;
