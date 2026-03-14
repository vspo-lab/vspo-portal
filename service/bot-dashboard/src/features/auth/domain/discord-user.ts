import type { AppError, Result } from "@vspo-lab/error";
import { z } from "zod";
import { parseResult } from "~/features/shared/lib/parse";

const DiscordUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatar: z.string().nullable(),
});

type DiscordUser = z.infer<typeof DiscordUserSchema>;

const DiscordUser = {
  schema: DiscordUserSchema,

  fromApiResponse: (raw: unknown): Result<DiscordUser, AppError> => {
    const obj = raw as Record<string, unknown>;
    return parseResult(DiscordUserSchema, {
      id: obj.id,
      username: obj.username,
      displayName: obj.global_name ?? obj.username,
      avatar: obj.avatar,
    });
  },

  avatarUrl: (user: DiscordUser): string | null =>
    user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : null,
} as const;

export { DiscordUser, type DiscordUser as DiscordUserType };
