import type { AppError, Result } from "@vspo-lab/error";
import type { ApplicationService } from "~/types/api";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api";

type DeleteChannelParams = {
  appWorker: ApplicationService;
  guildId: string;
  channelId: string;
};

/**
 * Removes a channel configuration entry from a guild.
 *
 * @param params - App worker binding and the guild/channel identifiers to delete
 * @returns Ok(undefined) after delegating the deletion, or an AppError
 * @precondition params.guildId !== "" && params.channelId !== "" && params.appWorker is a configured ApplicationService
 * @postcondition On Ok, the channel identified by params.channelId is absent from the guild configuration
 * @idempotent Delegates to repository; idempotency depends on repository implementation
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
