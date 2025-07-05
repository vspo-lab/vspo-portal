import {
  AppError,
  Err,
  ErrorCodeSchema,
  Ok,
  type Result,
  wrap,
} from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import { withTracerResult } from "../http/trace/cloudflare";

export const cacheKey = {
  discordServer: (serverId: string) => `discord-server-${serverId}`,
  creator: (memberType: string) => `creator-${memberType}`,
  streamList: (params: {
    limit: number;
    page: number;
    platform?: string;
    status?: string;
    memberType?: string;
    startDateFrom?: Date;
    startDateTo?: Date;
    endedAt?: Date;
    languageCode: string;
    orderBy?: "asc" | "desc";
  }) => {
    // Fast date formatting helper (avoid toISOString + split)
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Build key with direct string concatenation (faster than array operations)
    let key = `stream:list:limit-${params.limit}:page-${params.page}:lang-${params.languageCode}`;

    // Add optional parameters (order by frequency for better branch prediction)
    if (params.platform) key += `:platform-${params.platform}`;
    if (params.memberType) key += `:member-${params.memberType}`;
    if (params.status) key += `:status-${params.status}`;
    if (params.orderBy) key += `:order-${params.orderBy}`;
    if (params.startDateFrom)
      key += `:from-${formatDate(params.startDateFrom)}`;
    if (params.startDateTo) key += `:to-${formatDate(params.startDateTo)}`;
    if (params.endedAt) key += `:ended-${formatDate(params.endedAt)}`;

    return key;
  },
  clipList: (params: {
    limit: number;
    page: number;
    platform?: string;
    memberType?: string;
    languageCode: string;
    orderBy?: "asc" | "desc";
    channelIds?: string[];
    includeDeleted?: boolean;
    clipType?: "clip" | "short";
    orderKey?: "publishedAt" | "viewCount";
    afterPublishedAtDate?: Date;
    beforePublishedAtDate?: Date;
  }) => {
    // Fast date formatting helper (reuse the same logic)
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Build key with direct string concatenation
    let key = `clip:list:limit-${params.limit}:page-${params.page}:lang-${params.languageCode}`;

    // Add optional parameters (order by frequency for better branch prediction)
    if (params.platform) key += `:platform-${params.platform}`;
    if (params.clipType) key += `:type-${params.clipType}`;
    if (params.memberType) key += `:member-${params.memberType}`;
    if (params.orderBy) key += `:order-${params.orderBy}`;
    if (params.orderKey) key += `:orderkey-${params.orderKey}`;
    if (params.includeDeleted) key += `:deleted-${params.includeDeleted}`;
    if (params.channelIds && params.channelIds.length > 0) {
      // For channelIds, create a sorted string to ensure consistent cache keys
      key += `:channels-${params.channelIds.slice().sort().join(",")}`;
    }
    if (params.afterPublishedAtDate)
      key += `:after-${formatDate(params.afterPublishedAtDate)}`;
    if (params.beforePublishedAtDate)
      key += `:before-${formatDate(params.beforePublishedAtDate)}`;

    return key;
  },
  creatorList: (params: {
    limit: number;
    page: number;
    memberType?: string;
    languageCode?: string;
  }) => {
    let key = `creator:list:limit-${params.limit}:page-${params.page}`;

    if (params.languageCode) key += `:lang-${params.languageCode}`;
    if (params.memberType) key += `:member-${params.memberType}`;

    return key;
  },
  eventList: (params: {
    limit: number;
    page: number;
    orderBy?: "asc" | "desc";
    visibility?: string;
    startedDateFrom?: string;
    startedDateTo?: string;
  }) => {
    let key = `event:list:limit-${params.limit}:page-${params.page}`;

    if (params.orderBy) key += `:order-${params.orderBy}`;
    if (params.visibility) key += `:visibility-${params.visibility}`;
    if (params.startedDateFrom) key += `:from-${params.startedDateFrom}`;
    if (params.startedDateTo) key += `:to-${params.startedDateTo}`;

    return key;
  },
} as const;

/**
 * Interface for the cache client
 */
export interface ICacheClient {
  /**
   * Set a value in the cache
   * @param key The key to set
   * @param value The value to set
   * @param ttlSeconds Time to live in seconds (optional)
   */
  set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<Result<T, AppError>>;

  /**
   * Get a value from the cache
   * @param key The key to get
   */
  get<T>(
    key: string,
    options?: { type?: "json" | "text"; cacheTtl?: number },
  ): Promise<Result<T | null, AppError>>;

  /**
   * Get multiple values from the cache in a single bulk read operation
   * More performant than individual requests for multiple keys
   * @param keys Array of keys to retrieve (maximum 100 keys per request)
   * @param cacheTtl Optional cache TTL in seconds (minimum 60)
   */
  getBulk<T>(
    keys: string[],
    cacheTtl?: number,
  ): Promise<Result<Map<string, T | null>, AppError>>;

  /**
   * Delete a value from the cache
   * @param key The key to delete
   */
  delete(key: string): Promise<Result<boolean, AppError>>;

  /**
   * Check if a key exists in the cache
   * @param key The key to check
   */
  exists(key: string): Promise<Result<boolean, AppError>>;
}

/**
 * Cloudflare KV implementation of the cache client
 */
export const createCloudflareKVCacheClient = (
  kv: KVNamespace,
): ICacheClient => {
  const set = async <T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<Result<T, AppError>> => {
    return withTracerResult("cache", "set", async () => {
      AppLogger.debug("Setting cache value in KV", { key });
      const options: KVNamespacePutOptions = {};

      if (ttlSeconds !== undefined) {
        options.expirationTtl = ttlSeconds;
      }

      // First put the value in the cache
      const putResult = await wrap(
        kv.put(key, JSON.stringify(value), options),
        (error: Error) =>
          new AppError({
            message: `Failed to set cache value in KV for key ${key}`,
            code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
            cause: error,
          }),
      );

      // If there was an error, return it
      if (putResult.err) {
        AppLogger.error("Failed to set cache value in KV", {
          key,
          error: putResult.err,
        });
        return Err(putResult.err);
      }

      // Otherwise, return the original value
      return Ok(value);
    });
  };

  const get = async <T>(
    key: string,
    options?: { type?: "json" | "text"; cacheTtl?: number },
  ): Promise<Result<T | null, AppError>> => {
    return withTracerResult("cache", "get", async () => {
      AppLogger.debug("Getting cache value from KV", { key });

      const result = await wrap(
        options?.type === "json"
          ? kv.get(key, {
              type: "json",
              ...(options.cacheTtl && { cacheTtl: options.cacheTtl }),
            })
          : kv.get(key, {
              type: "text",
              ...(options?.cacheTtl && { cacheTtl: options.cacheTtl }),
            }),
        (error: Error) =>
          new AppError({
            message: `Failed to get cache value from KV for key ${key}`,
            code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
            cause: error,
          }),
      );

      if (result.err) {
        AppLogger.error("Failed to get cache value from KV", {
          key,
          error: result.err,
        });
        return Err(result.err);
      }

      const value = result.val;
      if (value === null) {
        AppLogger.debug("KV cache miss", { key });
        return Ok(null);
      }

      AppLogger.debug("KV cache hit", { key });

      // If type was "json", KV already parsed it for us
      if (options?.type === "json") {
        return Ok(value as T);
      }

      // Otherwise, we got a string that needs to be parsed
      return Ok(JSON.parse(value as string) as T);
    });
  };

  const getBulk = async <T>(
    keys: string[],
    cacheTtl?: number,
  ): Promise<Result<Map<string, T | null>, AppError>> => {
    return withTracerResult("cache", "getBulk", async () => {
      AppLogger.debug("Getting multiple cache values from KV using bulk read", {
        keys,
        keyCount: keys.length,
      });

      // Validate key count (Cloudflare KV supports up to 100 keys)
      if (keys.length > 100) {
        const error = new AppError({
          message: `Too many keys for bulk read: ${keys.length}. Maximum is 100.`,
          code: ErrorCodeSchema.Enum.BAD_REQUEST,
        });
        AppLogger.error("Bulk read key count exceeded", {
          keyCount: keys.length,
        });
        return Err(error);
      }

      // Validate cacheTtl if provided
      if (cacheTtl !== undefined && cacheTtl < 60) {
        const error = new AppError({
          message: `Invalid cacheTtl: ${cacheTtl}. Minimum is 60 seconds.`,
          code: ErrorCodeSchema.Enum.BAD_REQUEST,
        });
        AppLogger.error("Invalid cacheTtl for bulk read", { cacheTtl });
        return Err(error);
      }

      // Build options object
      const options: { cacheTtl?: number; type: "json" } = { type: "json" };
      if (cacheTtl !== undefined) {
        options.cacheTtl = cacheTtl;
      }

      // Use Cloudflare KV bulk read with json type for better performance
      const result = await wrap(
        kv.get(keys, options),
        (error: Error) =>
          new AppError({
            message: `Failed to bulk read cache values from KV for ${keys.length} keys`,
            code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
            cause: error,
          }),
      );

      if (result.err) {
        AppLogger.error("Failed to bulk read cache values from KV", {
          keys,
          error: result.err,
        });
        return Err(result.err);
      }

      const kvResult = result.val as Map<string, T | null>;

      // Since we're using type: "json", KV automatically parses JSON values
      // No need for manual JSON.parse() - just ensure all keys are represented
      const typedMap = new Map<string, T | null>();
      for (const key of keys) {
        // Get value from KV result, default to null if not found
        const value = kvResult.get(key) ?? null;
        typedMap.set(key, value);
      }

      const hitCount = Array.from(typedMap.values()).filter(
        (v) => v !== null,
      ).length;
      AppLogger.debug("KV bulk read completed", {
        totalKeys: keys.length,
        hits: hitCount,
        misses: keys.length - hitCount,
        cacheTtl,
      });

      return Ok(typedMap);
    });
  };

  const deleteKey = async (key: string): Promise<Result<boolean, AppError>> => {
    return withTracerResult("cache", "delete", async () => {
      AppLogger.debug("Deleting cache value from KV", { key });

      // Check if the key exists first
      const exists = await existsKey(key);
      if (exists.err) return Err(exists.err);

      const keyExists = exists.val;

      const result = await wrap(
        kv.delete(key),
        (error: Error) =>
          new AppError({
            message: `Failed to delete cache value from KV for key ${key}`,
            code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
            cause: error,
          }),
      );

      if (result.err) {
        AppLogger.error("Failed to delete cache value from KV", {
          key,
          error: result.err,
        });
        return Err(result.err);
      }

      return Ok(keyExists);
    });
  };

  const existsKey = async (key: string): Promise<Result<boolean, AppError>> => {
    return withTracerResult("cache", "exists", async () => {
      AppLogger.debug("Checking if key exists in KV", { key });

      const result = await wrap(
        kv.get(key, { type: "text" }),
        (error: Error) =>
          new AppError({
            message: `Failed to check if key exists in KV for key ${key}`,
            code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
            cause: error,
          }),
      );

      if (result.err) {
        AppLogger.error("Failed to check if key exists in KV", {
          key,
          error: result.err,
        });
        return Err(result.err);
      }

      return Ok(result.val !== null);
    });
  };

  return {
    set,
    get,
    getBulk,
    delete: deleteKey,
    exists: existsKey,
  };
};
