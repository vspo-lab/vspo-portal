import type { Result } from "@vspo-lab/error";
import { AppError, Err, Ok } from "@vspo-lab/error";
import type { GuildBotConfigType } from "~/features/guild/domain/guild";
import { devMock, isRpcUnavailable } from "~/features/shared/dev-mock";
import type { CreatorType } from "~/features/shared/domain/creator";
import type { ApplicationService } from "~/types/api";
import type { MemberTypeValue } from "../domain/member-type";

type AdjustBotChannelRpcParams = Parameters<
  ReturnType<ApplicationService["newDiscordUsecase"]>["adjustBotChannel"]
>[0] & {
  selectedMemberIds?: string[];
};

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
  frontendMemberType: MemberTypeValue,
): "vspo_jp" | "vspo_en" | "vspo_all" | "general" => {
  switch (frontendMemberType) {
    case "vspo_jp":
      return "vspo_jp";
    case "vspo_en":
      return "vspo_en";
    case "custom":
      return "vspo_all";
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
/**
 * Adjust a channel's bot configuration and enqueue the result for D1 persistence.
 * Mirrors the two-step pattern used by Discord slash command handlers.
 * @precondition appWorker is a valid service binding with DiscordService RPC
 * @postcondition On Ok, channel config is updated in KV cache and enqueued for D1 write
 */
const adjustAndEnqueue = async (
  appWorker: ApplicationService,
  params: AdjustBotChannelRpcParams & { type: "add" | "remove" },
): Promise<Result<void, AppError>> => {
  const discord = appWorker.newDiscordUsecase();
  const result = await discord.adjustBotChannel(params);
  if (result.err) return result;
  await discord.batchUpsertEnqueue([result.val]);
  return Ok(undefined);
};

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
    if (isRpcUnavailable(appWorker)) {
      return Ok(devMock.guildConfig(guildId));
    }

    const discord = appWorker.newDiscordUsecase();
    const result = await discord.get(guildId);
    if (result.err) {
      if (result.err.code === "NOT_FOUND") {
        return Ok({ guildId, channels: [] });
      }
      return result;
    }

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
      memberType?: MemberTypeValue;
      customMembers?: string[] | undefined;
    },
  ): Promise<Result<void, AppError>> => {
    if (isRpcUnavailable(appWorker)) {
      return Err(
        new AppError({
          code: "INTERNAL_SERVER_ERROR",
          message: "APP_WORKER is not available",
          context: {},
        }),
      );
    }

    return adjustAndEnqueue(appWorker, {
      type: "add",
      serverId: guildId,
      targetChannelId: channelId,
      channelLangaugeCode: data.language,
      memberType: data.memberType
        ? toServerMemberType(data.memberType)
        : undefined,
      selectedMemberIds: data.customMembers,
    });
  },

  /**
   * Retrieve all creators (JP and EN) from vspo-server.
   *
   * @param appWorker - APP_WORKER service binding
   * @returns Object with jp and en creator arrays
   * @idempotent true
   */
  listCreators: async (
    appWorker: ApplicationService,
  ): Promise<Result<{ jp: CreatorType[]; en: CreatorType[] }, AppError>> => {
    if (isRpcUnavailable(appWorker)) {
      return Ok(devMock.creators());
    }

    const creatorService = appWorker.newCreatorUsecase();
    const [jpResult, enResult] = await Promise.all([
      creatorService.list({ limit: 100, page: 1, memberType: "vspo_jp" }),
      creatorService.list({ limit: 100, page: 1, memberType: "vspo_en" }),
    ]);

    if (jpResult.err) return jpResult;
    if (enResult.err) return enResult;

    type RpcCreator = (typeof jpResult.val.creators)[number];

    const mapCreator = (creator: RpcCreator): CreatorType => ({
      id: creator.id,
      name: creator.name ?? creator.channel?.youtube?.name ?? "Unknown",
      memberType:
        creator.memberType === "vspo_en"
          ? ("vspo_en" as const)
          : ("vspo_jp" as const),
      thumbnailUrl:
        creator.thumbnailURL || creator.channel?.youtube?.thumbnailURL || null,
    });

    return Ok({
      jp: jpResult.val.creators.map(mapCreator),
      en: enResult.val.creators.map(mapCreator),
    });
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
    if (isRpcUnavailable(appWorker)) {
      return Err(
        new AppError({
          code: "INTERNAL_SERVER_ERROR",
          message: "APP_WORKER is not available",
          context: {},
        }),
      );
    }

    return adjustAndEnqueue(appWorker, {
      type: "add",
      serverId: guildId,
      targetChannelId: channelId,
    });
  },

  /**
   * Retrieve all text channels in a Discord guild via vspo-server RPC.
   *
   * @param appWorker - APP_WORKER service binding
   * @param guildId - Discord guild ID
   * @returns Array of channel id/name pairs (text channels only, sorted by position)
   * @precondition appWorker is a valid service binding (falls back to mock data in dev mode)
   * @idempotent true
   */
  listGuildChannels: async (
    appWorker: ApplicationService,
    guildId: string,
  ): Promise<Result<{ id: string; name: string }[], AppError>> => {
    if (isRpcUnavailable(appWorker)) {
      return Ok(devMock.guildChannels(guildId));
    }

    const discord = appWorker.newDiscordUsecase();
    const result = await discord.listGuildChannels(guildId);
    if (result.err) return result;

    const textChannels = result.val
      .filter((ch) => ch.type === 0)
      .sort((a, b) => a.position - b.position)
      .map((ch) => ({ id: ch.id, name: ch.name }));

    return Ok(textChannels);
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
    if (isRpcUnavailable(appWorker)) {
      return Err(
        new AppError({
          code: "INTERNAL_SERVER_ERROR",
          message: "APP_WORKER is not available",
          context: {},
        }),
      );
    }

    return adjustAndEnqueue(appWorker, {
      type: "remove",
      serverId: guildId,
      targetChannelId: channelId,
    });
  },
} as const;

export { VspoChannelApiRepository };
