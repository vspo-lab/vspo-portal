import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";
import { devMock, isRpcUnavailable } from "~/features/shared/dev-mock";
import type { ApplicationService } from "~/types/api";

/**
 * Guild configuration API access layer for vspo-server
 * @precondition APP_WORKER Service Binding must be configured (except in dev-mock mode)
 */
const VspoGuildApiRepository = {
  /**
   * Retrieve list of server IDs where the Bot is currently installed.
   * Calls vspo-server's DiscordService.listBotGuildIds() via RPC.
   * Falls back to empty set in dev-mock mode where APP_WORKER is unavailable.
   *
   * @param appWorker - APP_WORKER service binding to vspo-server
   * @returns Set of Discord guild ID strings where the bot is a member
   * @precondition appWorker is a valid service binding with DiscordService RPC
   * @postcondition On Ok, every string in the set is a Discord guild ID
   * @idempotent true
   */
  getBotGuildIds: async (
    appWorker: ApplicationService,
  ): Promise<Result<ReadonlySet<string>, AppError>> => {
    if (isRpcUnavailable(appWorker)) {
      return Ok(devMock.botGuildIds);
    }

    const discord = appWorker.newDiscordUsecase();
    const result = await discord.listBotGuildIds();
    if (result.err) return result;
    return Ok(new Set(result.val));
  },

  /**
   * Retrieve bot statistics (guild count and total member count).
   * Calls vspo-server's DiscordService.getBotStats() via RPC.
   *
   * @param appWorker - APP_WORKER service binding to vspo-server
   * @returns Bot statistics with guild count and total member count
   * @idempotent true
   */
  getBotStats: async (
    appWorker: ApplicationService,
  ): Promise<
    Result<{ guildCount: number; totalMemberCount: number }, AppError>
  > => {
    if (isRpcUnavailable(appWorker)) {
      return Ok(devMock.botStats);
    }

    const discord = appWorker.newDiscordUsecase();
    return discord.getBotStats();
  },
  /**
   * Check if a user has admin permissions in the specified guilds via bot token.
   *
   * @param appWorker - APP_WORKER service binding
   * @param userId - Discord user ID to check
   * @param guildIds - Guild IDs to check (must be guilds where bot is installed)
   * @returns Record mapping guild ID to admin boolean
   * @precondition userId is a non-empty string and guildIds are guilds where the bot is installed
   * @postcondition On Ok, returned record maps each input guild ID to a boolean indicating admin status
   * @idempotent true
   */
  checkUserGuildAdmin: async (
    appWorker: ApplicationService,
    userId: string,
    guildIds: string[],
  ): Promise<Result<Record<string, boolean>, AppError>> => {
    if (isRpcUnavailable(appWorker)) {
      return Ok(devMock.userGuildAdmin);
    }

    const discord = appWorker.newDiscordUsecase();
    return discord.checkUserGuildAdmin(userId, guildIds);
  },
} as const;

export { VspoGuildApiRepository };
