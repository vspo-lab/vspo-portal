import { z } from "zod";

export const zCommonEnv = z.object({
  ENVIRONMENT: z.enum(["production", "staging", "development", "local"]),
  SERVICE_NAME: z.string(),
  LOG_TYPE: z.enum(["pretty", "json"]).default("pretty"),
  LOG_MINLEVEL: z
    .string()
    .regex(/^\d+$/)
    .transform((s) => Number.parseInt(s, 10))
    .default("0"),
  LOG_HIDE_POSITION: z
    .string()
    .transform((s) => s === "true")
    .default("false"),
  SENTRY_DSN: z.string(),
});

export type CommonEnv = z.infer<typeof zCommonEnv>;
