import type { Result } from "@vspo-lab/error";
import { AppError, Ok, wrap } from "@vspo-lab/error";
import { VspoGuildApiRepository } from "~/features/guild/repository/vspo-guild-api";
import type { ApplicationService } from "~/types/api";

type BotStats = { guildCount: number; totalMemberCount: number };

const BOT_STATS_CACHE_KEY = "https://bot-dashboard.internal/cache/bot-stats";
const BOT_STATS_TTL_SECONDS = 60 * 30;

/**
 * Bot 統計（サーバー数・総利用者数）を Cloudflare Workers Cache API 経由で取得する。
 *
 * Hero の BotStats カードはしばらく変動しないため、RPC 呼び出しを 30 分キャッシュして
 * 初回以降のレイテンシとスケルトン滞在時間を削減する。
 *
 * @param appWorker - vspo-server への Service Binding
 * @returns サーバー数と総利用者数の Result
 * @precondition Cloudflare Workers ランタイムを想定するが、`caches` が未定義な環境でも
 *   キャッシュをスキップして RPC に直接フォールバックする
 * @postcondition Ok を返した場合、同一 region では 30 分以内は同じ値を返す。
 *   RPC が失敗した場合はキャッシュに書き込まず Err を伝播する
 * @idempotent true
 */
export const getCachedBotStats = async (
  appWorker: ApplicationService,
): Promise<Result<BotStats, AppError>> => {
  const cache = getDefaultCacheOrNull();
  const cacheKey = new Request(BOT_STATS_CACHE_KEY);

  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const parsed = await wrap(
        hit.json() as Promise<BotStats>,
        (e) =>
          new AppError({
            message: `bot-stats cache parse failed: ${e.message}`,
            code: "INTERNAL_SERVER_ERROR",
          }),
      );
      if (!parsed.err) return Ok(parsed.val);
      // パース失敗時はキャッシュを捨てて RPC にフォールスルー
    }
  }

  const fresh = await VspoGuildApiRepository.getBotStats(appWorker);
  if (fresh.err) return fresh;

  if (cache) {
    const response = new Response(JSON.stringify(fresh.val), {
      headers: {
        "content-type": "application/json",
        "cache-control": `public, max-age=${BOT_STATS_TTL_SECONDS}`,
      },
    });
    // ベストエフォート: put 失敗時もフレッシュな値は返す
    await cache.put(cacheKey, response).catch(() => undefined);
  }

  return Ok(fresh.val);
};

/**
 * Cloudflare Workers の `caches.default` を安全に取得する。
 * DOM の標準 `CacheStorage` には `default` が存在しないため、Workers 拡張を表す
 * 形の型で狭めてから参照する。Workers 以外の実行環境では null を返す。
 * @idempotent true
 */
const getDefaultCacheOrNull = (): Cache | null => {
  const globalCaches = (globalThis as { caches?: { default?: Cache } }).caches;
  return globalCaches?.default ?? null;
};
