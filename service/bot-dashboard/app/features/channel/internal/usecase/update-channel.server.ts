import type { AppError, Result } from "@vspo-lab/error";
import { ChannelConfig } from "../domain/channel-config";
import { VspoChannelApiRepository } from "../repository/vspo-channel-api.server";

type UpdateChannelParams = {
  apiUrl: string;
  apiKey: string;
  guildId: string;
  channelId: string;
  formData: FormData;
};

/**
 * チャンネル設定を更新する
 * @precondition 有効な FormData が必要
 * @postcondition vspo-server API に設定変更を反映する
 */
const execute = async (
  params: UpdateChannelParams,
): Promise<Result<void, AppError>> => {
  const parsed = ChannelConfig.fromFormData(params.formData);
  if (parsed.err) return parsed;

  return VspoChannelApiRepository.updateChannel(
    params.apiUrl,
    params.apiKey,
    params.guildId,
    params.channelId,
    parsed.val,
  );
};

export const UpdateChannelUsecase = { execute } as const;
