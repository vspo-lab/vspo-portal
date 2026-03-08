import type { Result } from "@vspo-lab/error";
import { type AppError, Err, Ok } from "@vspo-lab/error";
import type { GuildBotConfigType } from "~/features/guild";

/**
 * vspo-server の Channel 設定 API アクセス層
 * @precondition VSPO_API_URL と VSPO_API_KEY が設定されていること
 */
const VspoChannelApiRepository = {
  /** サーバーの Bot 設定を取得する */
  getGuildConfig: async (
    _apiUrl: string,
    _apiKey: string,
    guildId: string,
  ): Promise<Result<GuildBotConfigType, AppError>> => {
    // TODO: Phase 5 で vspo-server API に接続
    // Mock data
    return Ok({
      guildId,
      channels: [
        {
          channelId: "ch-1",
          channelName: "general",
          enabled: true,
          language: "ja",
          memberType: "all" as const,
          customMembers: undefined,
        },
        {
          channelId: "ch-2",
          channelName: "notifications",
          enabled: true,
          language: "ja",
          memberType: "vspo_jp" as const,
          customMembers: undefined,
        },
        {
          channelId: "ch-3",
          channelName: "en-streams",
          enabled: false,
          language: "en",
          memberType: "vspo_en" as const,
          customMembers: undefined,
        },
      ],
    });
  },

  /** チャンネル設定を更新する */
  updateChannel: async (
    _apiUrl: string,
    _apiKey: string,
    _guildId: string,
    _channelId: string,
    _data: {
      language?: string;
      memberType?: string;
      customMembers?: string[] | undefined;
    },
  ): Promise<Result<void, AppError>> => {
    // TODO: Phase 5 で vspo-server API に接続
    return Ok(undefined);
  },

  /** Bot を有効化する */
  enableChannel: async (
    _apiUrl: string,
    _apiKey: string,
    _guildId: string,
    _channelId: string,
  ): Promise<Result<void, AppError>> => {
    // TODO: Phase 5 で vspo-server API に接続
    return Ok(undefined);
  },

  /** Bot を無効化する */
  disableChannel: async (
    _apiUrl: string,
    _apiKey: string,
    _guildId: string,
    _channelId: string,
  ): Promise<Result<void, AppError>> => {
    // TODO: Phase 5 で vspo-server API に接続
    return Ok(undefined);
  },
} as const;

export { VspoChannelApiRepository };
