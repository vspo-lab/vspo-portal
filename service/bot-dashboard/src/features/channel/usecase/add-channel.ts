import type { AppError, Result } from "@vspo-lab/error";
import type { ApplicationService } from "~/types/api";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api";

type AddChannelParams = {
  appWorker: ApplicationService;
  guildId: string;
  channelId: string;
};

/**
 * Registers a new Discord channel with the Bot for a guild.
 *
 * @param params - App worker binding and target guild/channel IDs
 * @returns Ok(undefined) on success, or an AppError
 * @precondition params.guildId !== "" && params.channelId !== ""
 * @postcondition On Ok, the channel is registered in the guild's bot configuration
 */
const execute = async (
  params: AddChannelParams,
): Promise<Result<void, AppError>> => {
  return VspoChannelApiRepository.enableChannel(
    params.appWorker,
    params.guildId,
    params.channelId,
  );
};

export const AddChannelUsecase = { execute } as const;
