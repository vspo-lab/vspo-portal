import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";

/**
 * vspo-server の Guild 設定 API アクセス層
 * @precondition APP_WORKER Service Binding が設定されていること
 */
const VspoGuildApiRepository = {
  /** Bot が導入されているサーバー ID 一覧を取得する */
  getBotGuildIds: async (
    _appWorker: Fetcher,
  ): Promise<Result<ReadonlySet<string>, AppError>> => {
    // TODO: Phase 5 で vspo-server API に接続
    // 現在は mock データを返す
    return Ok(new Set<string>());
  },
} as const;

export { VspoGuildApiRepository };
