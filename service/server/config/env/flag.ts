import { z } from "zod";

export const zFeatureFlagEnv = z.object({
  DISCORD_TRANSLATION_SETTING: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  DISCORD_BOT_MAINTENANCE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});
export type FeatureFlagEnv = z.infer<typeof zFeatureFlagEnv>;
