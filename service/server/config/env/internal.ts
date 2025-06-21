import { z } from "zod";
import { zAIEnv } from "./ai";
import { zCommonEnv } from "./common";
import { zDiscordEnv } from "./discord";
import { zFeatureFlagEnv } from "./flag";
export const zAppWorkerEnv = z
  .object({
    YOUTUBE_API_KEY: z.string(),
    TWITCH_CLIENT_ID: z.string(),
    TWITCH_CLIENT_SECRET: z.string(),
    TWITCASTING_CLIENT_ID: z.string(),
    TWITCASTING_CLIENT_SECRET: z.string(),
    DEV_DB_CONNECTION_STRING: z
      .string()
      .default("postgres://user:password@localhost:5432/vspo"),
    DB: z.custom<Hyperdrive>(),
    WRITE_QUEUE: z.custom<Queue>(),
    APP_KV: z.custom<KVNamespace>(),
  })
  .merge(zCommonEnv)
  .merge(zAIEnv)
  .merge(zDiscordEnv)
  .merge(zFeatureFlagEnv);

export type AppWorkerEnv = z.infer<typeof zAppWorkerEnv>;
