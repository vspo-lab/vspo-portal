import { z } from "zod";
import { zCommonEnv } from "./common";

export const zDiscordEnv = z
  .object({
    DISCORD_APPLICATION_ID: z.string(),
    DISCORD_PUBLIC_KEY: z.string(),
    DISCORD_TOKEN: z.string(),
  })
  .merge(zCommonEnv);

export type DiscordEnv = z.infer<typeof zDiscordEnv>;
