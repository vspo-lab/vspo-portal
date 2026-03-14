import type { AppError, Result } from "@vspo-lab/error";
import type { GuildBotConfigType } from "~/features/guild/domain/guild";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api";

type ListChannelsParams = {
  appWorker: Fetcher;
  guildId: string;
};

const execute = async (
  params: ListChannelsParams,
): Promise<Result<GuildBotConfigType, AppError>> => {
  return VspoChannelApiRepository.getGuildConfig(
    params.appWorker,
    params.guildId,
  );
};

export const ListChannelsUsecase = { execute } as const;
