import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";

/**
 * Guild configuration API access layer for vspo-server
 * @precondition APP_WORKER Service Binding must be configured
 */
const VspoGuildApiRepository = {
  /** Retrieve list of server IDs where the Bot is installed */
  getBotGuildIds: async (
    _appWorker: Fetcher,
  ): Promise<Result<ReadonlySet<string>, AppError>> => {
    // TODO: Connect to vspo-server API in Phase 5
    // Currently returns mock data
    return Ok(new Set<string>());
  },
} as const;

export { VspoGuildApiRepository };
