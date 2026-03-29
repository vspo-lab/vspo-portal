import type { Result } from "@vspo-lab/error";
import { AppError, Err, Ok } from "@vspo-lab/error";
import type { GuildBotConfigType } from "~/features/guild/domain/guild";
import type { ApplicationService } from "~/types/api";
import type { MemberTypeValue } from "../domain/member-type";

/**
 * Maps the vspo-server memberType to the bot-dashboard's MemberType domain value.
 * @precondition serverMemberType is one of the vspo-server API values or undefined
 * @postcondition Returns a valid MemberTypeValue
 */
const toFrontendMemberType = (
  serverMemberType:
    | "vspo_jp"
    | "vspo_en"
    | "vspo_ch"
    | "vspo_all"
    | "general"
    | undefined,
): MemberTypeValue => {
  switch (serverMemberType) {
    case "vspo_jp":
      return "vspo_jp";
    case "vspo_en":
      return "vspo_en";
    case "vspo_all":
    case "general":
    case undefined:
      return "all";
    case "vspo_ch":
      return "all";
  }
};

/**
 * Maps the bot-dashboard's MemberType to the vspo-server API value.
 * @precondition frontendMemberType is a valid MemberTypeValue
 * @postcondition Returns a vspo-server API memberType string
 */
const toServerMemberType = (
  frontendMemberType: string,
): "vspo_jp" | "vspo_en" | "vspo_all" | "general" => {
  switch (frontendMemberType) {
    case "vspo_jp":
      return "vspo_jp";
    case "vspo_en":
      return "vspo_en";
    case "all":
      return "vspo_all";
    default:
      return "vspo_all";
  }
};

/**
 * Channel configuration API access layer for vspo-server.
 * Communicates via Cloudflare Workers RPC through the APP_WORKER service binding.
 * @precondition APP_WORKER Service Binding must be configured (except in dev-mock mode)
 */
const VspoChannelApiRepository = {
  /**
   * Retrieve the Bot configuration for a server.
   * Calls vspo-server's DiscordService.get() via RPC and transforms the response
   * into the bot-dashboard's GuildBotConfig domain model.
   *
   * @param appWorker - APP_WORKER service binding to vspo-server
   * @param guildId - Discord guild ID
   * @returns GuildBotConfig with all registered channels marked as enabled
   * @precondition appWorker is a valid service binding with DiscordService RPC
   * @postcondition On Ok, all channels in the result have enabled === true
   * @idempotent true
   */
  getGuildConfig: async (
    appWorker: ApplicationService,
    guildId: string,
  ): Promise<Result<GuildBotConfigType, AppError>> => {
    // Dev-mock fallback: APP_WORKER has no RPC methods in local dev
    if (!appWorker || typeof appWorker.newDiscordUsecase !== "function") {
      return Ok({
        guildId,
        channels:
          guildId === "111111111111111111"
            ? [
                {
                  channelId: "ch-001",
                  channelName: "vspo-notifications",
                  enabled: true,
                  language: "ja",
                  memberType: "all" as const,
                  customMembers: undefined,
                },
                {
                  channelId: "ch-002",
                  channelName: "schedule-en",
                  enabled: true,
                  language: "en",
                  memberType: "vspo_en" as const,
                  customMembers: undefined,
                },
                {
                  channelId: "ch-003",
                  channelName: "archives",
                  enabled: false,
                  language: "ja",
                  memberType: "vspo_jp" as const,
                  customMembers: undefined,
                },
              ]
            : [],
      });
    }

    const discord = appWorker.newDiscordUsecase();
    const result = await discord.get(guildId);
    if (result.err) return result;

    const server = result.val;
    return Ok({
      guildId: server.rawId,
      channels: server.discordChannels.map((ch) => ({
        channelId: ch.rawId,
        channelName: ch.name,
        enabled: true,
        language: ch.languageCode,
        memberType: toFrontendMemberType(ch.memberType),
        customMembers: undefined,
      })),
    });
  },

  /**
   * Update a channel's configuration by re-adding it with new parameters.
   * Uses adjustBotChannel with type "add" to upsert the channel config.
   *
   * @param appWorker - APP_WORKER service binding
   * @param guildId - Discord guild ID
   * @param channelId - Discord channel ID
   * @param data - Fields to update (language, memberType, customMembers)
   * @precondition Channel must already be registered in the guild config
   * @postcondition On Ok, channel config is updated with the provided values
   */
  updateChannel: async (
    appWorker: ApplicationService,
    guildId: string,
    channelId: string,
    data: {
      language?: string;
      memberType?: string;
      customMembers?: string[] | undefined;
    },
  ): Promise<Result<void, AppError>> => {
    if (!appWorker || typeof appWorker.newDiscordUsecase !== "function") {
      return Err(
        new AppError({
          code: "INTERNAL_SERVER_ERROR",
          message: "APP_WORKER is not available",
          context: {},
        }),
      );
    }

    const discord = appWorker.newDiscordUsecase();
    const result = await discord.adjustBotChannel({
      type: "add",
      serverId: guildId,
      targetChannelId: channelId,
      channelLangaugeCode: data.language,
      memberType: data.memberType
        ? toServerMemberType(data.memberType)
        : undefined,
    });
    if (result.err) return result;
    return Ok(undefined);
  },

  /**
   * Enable (register) a channel with the Bot for a guild.
   * Uses adjustBotChannel with type "add".
   *
   * @param appWorker - APP_WORKER service binding
   * @param guildId - Discord guild ID
   * @param channelId - Discord channel ID
   * @postcondition On Ok, the channel is present in the guild's bot configuration
   */
  enableChannel: async (
    appWorker: ApplicationService,
    guildId: string,
    channelId: string,
  ): Promise<Result<void, AppError>> => {
    if (!appWorker || typeof appWorker.newDiscordUsecase !== "function") {
      return Err(
        new AppError({
          code: "INTERNAL_SERVER_ERROR",
          message: "APP_WORKER is not available",
          context: {},
        }),
      );
    }

    const discord = appWorker.newDiscordUsecase();
    const result = await discord.adjustBotChannel({
      type: "add",
      serverId: guildId,
      targetChannelId: channelId,
    });
    if (result.err) return result;
    return Ok(undefined);
  },

  /**
   * Disable (unregister) a channel from the Bot for a guild.
   * Uses adjustBotChannel with type "remove".
   *
   * @param appWorker - APP_WORKER service binding
   * @param guildId - Discord guild ID
   * @param channelId - Discord channel ID
   * @postcondition On Ok, the channel is absent from the guild's bot configuration
   */
  disableChannel: async (
    appWorker: ApplicationService,
    guildId: string,
    channelId: string,
  ): Promise<Result<void, AppError>> => {
    if (!appWorker || typeof appWorker.newDiscordUsecase !== "function") {
      return Err(
        new AppError({
          code: "INTERNAL_SERVER_ERROR",
          message: "APP_WORKER is not available",
          context: {},
        }),
      );
    }

    const discord = appWorker.newDiscordUsecase();
    const result = await discord.adjustBotChannel({
      type: "remove",
      serverId: guildId,
      targetChannelId: channelId,
    });
    if (result.err) return result;
    return Ok(undefined);
  },

  /**
   * Remove a channel from Bot configuration for a guild.
   * Uses adjustBotChannel with type "remove".
   *
   * @param appWorker - APP_WORKER service binding
   * @param guildId - Discord guild ID
   * @param channelId - Discord channel ID
   * @postcondition On Ok, the channel entry is permanently removed; idempotent on repeated calls
   */
  deleteChannel: async (
    appWorker: ApplicationService,
    guildId: string,
    channelId: string,
  ): Promise<Result<void, AppError>> => {
    if (!appWorker || typeof appWorker.newDiscordUsecase !== "function") {
      return Err(
        new AppError({
          code: "INTERNAL_SERVER_ERROR",
          message: "APP_WORKER is not available",
          context: {},
        }),
      );
    }

    const discord = appWorker.newDiscordUsecase();
    const result = await discord.adjustBotChannel({
      type: "remove",
      serverId: guildId,
      targetChannelId: channelId,
    });
    if (result.err) return result;
    return Ok(undefined);
  },
} as const;

export { VspoChannelApiRepository };
