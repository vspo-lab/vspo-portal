import { AppError, Err, Ok, type Result, wrap } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import { withTracerResult } from "../http/trace/cloudflare";

/**
 * Interface for storage operations
 */
export interface IStorage {
  /**
   * Upload data to storage
   */
  put(
    key: string,
    body: ReadableStream | ArrayBuffer | string,
  ): Promise<Result<void, AppError>>;

  /**
   * Get data from storage
   */
  get(key: string): Promise<Result<R2ObjectBody, AppError>>;

  /**
   * Delete data from storage
   */
  delete(key: string): Promise<Result<void, AppError>>;

  /**
   * List objects from storage
   */
  list(prefix?: string): Promise<Result<R2Objects, AppError>>;
}

/**
 * Implementation of storage using Cloudflare R2
 */
export const createR2Storage = (bucket: R2Bucket): IStorage => {
  const SERVICE_NAME = "R2Storage";

  const put = async (
    key: string,
    body: ReadableStream | ArrayBuffer | string,
  ): Promise<Result<void, AppError>> => {
    return withTracerResult(SERVICE_NAME, "put", async (_span) => {
      const result = await wrap(bucket.put(key, body), (error) => {
        AppLogger.error(
          `Failed to upload object with key ${key}: ${error.message}`,
        );
        return new AppError({
          message: `Failed to upload object with key ${key}`,
          code: "INTERNAL_SERVER_ERROR",
          cause: error,
        });
      });

      if (result.err) {
        return Err(result.err);
      }

      AppLogger.debug(`Successfully uploaded object with key: ${key}`);
      return Ok();
    });
  };

  const get = async (key: string): Promise<Result<R2ObjectBody, AppError>> => {
    return withTracerResult(SERVICE_NAME, "get", async (_span) => {
      const result = await wrap(
        bucket.get(key),
        (error) =>
          new AppError({
            message: `Failed to get object with key ${key}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: error,
          }),
      );

      if (result.err) {
        AppLogger.error(result.err.message);
        return Err(result.err);
      }

      if (!result.val) {
        AppLogger.debug(`Object with key ${key} not found`);
        return Err(
          new AppError({
            message: `Object with key ${key} not found`,
            code: "NOT_FOUND",
          }),
        );
      }

      AppLogger.debug(`Successfully retrieved object with key: ${key}`);
      return Ok(result.val);
    });
  };

  const deleteObject = async (key: string): Promise<Result<void, AppError>> => {
    return withTracerResult(SERVICE_NAME, "delete", async (_span) => {
      const result = await wrap(bucket.delete(key), (error) => {
        AppLogger.error(
          `Failed to delete object with key ${key}: ${error.message}`,
        );
        return new AppError({
          message: `Failed to delete object with key ${key}`,
          code: "INTERNAL_SERVER_ERROR",
          cause: error,
        });
      });

      if (result.err) {
        return Err(result.err);
      }

      AppLogger.debug(`Successfully deleted object with key: ${key}`);
      return Ok();
    });
  };

  const list = async (
    prefix?: string,
  ): Promise<Result<R2Objects, AppError>> => {
    return withTracerResult(SERVICE_NAME, "list", async (_span) => {
      const options: R2ListOptions = prefix ? { prefix } : {};

      const result = await wrap(
        bucket.list(options),
        (error) =>
          new AppError({
            message: `Failed to list objects${
              prefix ? ` with prefix ${prefix}` : ""
            }`,
            code: "INTERNAL_SERVER_ERROR",
            cause: error,
          }),
      );

      if (result.err) {
        AppLogger.error(
          `Failed to list objects${prefix ? ` with prefix ${prefix}` : ""}: ${
            result.err.message
          }`,
        );
        return Err(result.err);
      }

      AppLogger.debug(
        `Listed ${result.val.objects.length} objects${
          prefix ? ` with prefix ${prefix}` : ""
        }`,
      );
      return Ok(result.val);
    });
  };

  return {
    put,
    get,
    delete: deleteObject,
    list,
  };
};
