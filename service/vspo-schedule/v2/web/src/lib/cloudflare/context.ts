import "server-only";
import {
  type CloudflareContext,
  getCloudflareContext,
} from "@opennextjs/cloudflare";
import type { BaseError } from "@vspo-lab/error";
import { AppError, type Result, wrap } from "@vspo-lab/error";
import type { PublicReadService } from "../../features/shared/types/api";

// Define Service type
type Service<T> = {
  [K in keyof T]: T[K];
};

type CloudflareEnvironmentContext = {
  context: Result<CloudflareContext, BaseError>;
  isValid: boolean;
  cfEnv?: {
    APP_WORKER: Service<PublicReadService>;
  };
};

/**
 * Gets Cloudflare context and checks if it's a valid Cloudflare environment
 * (both running in Cloudflare and having a valid context)
 */
export const getCloudflareEnvironmentContext =
  async (): Promise<CloudflareEnvironmentContext> => {
    const context = await wrap(
      getCloudflareContext({ async: true }),
      (error) =>
        new AppError({
          message: "Failed to get Cloudflare context",
          code: "INTERNAL_SERVER_ERROR",
          cause: error,
          context: {},
        }),
    );

    const isValid = !context.err && context.val?.env.ASSETS !== undefined;

    // Add typed environment if in valid Cloudflare environment
    const cfEnv = isValid
      ? (context.val?.env as unknown as {
          APP_WORKER: Service<PublicReadService>;
        })
      : undefined;

    return {
      context,
      isValid,
      cfEnv,
    };
  };
