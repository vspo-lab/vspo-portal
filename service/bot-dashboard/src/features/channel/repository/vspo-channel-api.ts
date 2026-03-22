import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";
import type { GuildBotConfigType } from "~/features/guild/domain/guild";

/**
 * Channel configuration API access layer for vspo-server
 * @precondition APP_WORKER Service Binding must be configured
 */
const VspoChannelApiRepository = {
  /** Retrieve the Bot configuration for a server */
  getGuildConfig: async (
    _appWorker: Fetcher,
    guildId: string,
  ): Promise<Result<GuildBotConfigType, AppError>> => {
    // TODO: Connect to vspo-server API in Phase 5
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

  /** Update a channel's configuration */
  updateChannel: async (
    _appWorker: Fetcher,
    _guildId: string,
    _channelId: string,
    _data: {
      language?: string;
      memberType?: string;
      customMembers?: string[] | undefined;
    },
  ): Promise<Result<void, AppError>> => {
    // TODO: Connect to vspo-server API in Phase 5
    return Ok(undefined);
  },

  /** Enable the Bot */
  enableChannel: async (
    _appWorker: Fetcher,
    _guildId: string,
    _channelId: string,
  ): Promise<Result<void, AppError>> => {
    // TODO: Connect to vspo-server API in Phase 5
    return Ok(undefined);
  },

  /** Disable the Bot */
  disableChannel: async (
    _appWorker: Fetcher,
    _guildId: string,
    _channelId: string,
  ): Promise<Result<void, AppError>> => {
    // TODO: Connect to vspo-server API in Phase 5
    return Ok(undefined);
  },

  /**
   * Remove a channel from Bot configuration for a guild.
   * @precondition guildId and channelId must refer to an existing configuration
   * @postcondition The channel entry is permanently removed; idempotent on repeated calls
   */
  deleteChannel: async (
    _appWorker: Fetcher,
    _guildId: string,
    _channelId: string,
  ): Promise<Result<void, AppError>> => {
    // TODO: Connect to vspo-server API in Phase 5
    return Ok(undefined);
  },
} as const;

export { VspoChannelApiRepository };
