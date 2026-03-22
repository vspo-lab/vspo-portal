import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";
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
    // Dev-mock fallback: APP_WORKER has no RPC methods in local dev
    if (!appWorker || typeof appWorker.newDiscordUsecase !== "function") {
      return Ok(new Set<string>());
    }

    const discord = appWorker.newDiscordUsecase();
    const result = await discord.listBotGuildIds();
    if (result.err) return result;
    return Ok(new Set(result.val));
  },
} as const;

export { VspoGuildApiRepository };
