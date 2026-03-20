import type { AppError, Result } from "@vspo-lab/error";
import { z } from "zod";
import { parseResult } from "~/features/shared/lib/parse";

/** Raw Discord API response shape (uses snake_case `global_name`) */
const DiscordApiUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  global_name: z.string().nullable().optional(),
  avatar: z.string().nullable(),
});

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
    const apiResult = parseResult(DiscordApiUserSchema, raw);
    if (apiResult.err) return apiResult;
    const api = apiResult.val;
    return parseResult(DiscordUserSchema, {
      id: api.id,
      username: api.username,
      displayName: api.global_name ?? api.username,
      avatar: api.avatar,
    });
  },

  avatarUrl: (user: DiscordUser): string | null =>
    user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : null,
} as const;

export { DiscordUser, type DiscordUser as DiscordUserType };
