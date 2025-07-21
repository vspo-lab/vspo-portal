import { AppError, ErrorCodeSchema } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import { env } from "hono/adapter";
import { createMiddleware } from "hono/factory";
import { type ApiEnv, zApiEnv } from "../../../../config/env/api";
import type { AppContext } from "../app";
import type { HonoEnv } from "../env";

export const init = createMiddleware<HonoEnv>(async (c, next) => {
  const honoEnv = env<ApiEnv, AppContext>(c);
  const e = zApiEnv.safeParse(honoEnv);
  if (!e.success) {
    throw new AppError({
      code: ErrorCodeSchema.Enum.BAD_REQUEST,
      message: e.error.message,
    });
  }
  if (e.data.API_KEY !== c.req.header("x-api-key")) {
    throw new AppError({
      code: ErrorCodeSchema.Enum.UNAUTHORIZED,
      message: "Invalid API key",
    });
  }
  const logger = AppLogger.getInstance(e.data);
  logger.info("[Request started]");
  await next();
});
