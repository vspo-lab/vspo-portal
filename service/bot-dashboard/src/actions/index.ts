import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { env } from "cloudflare:workers";
import { VspoChannelApiRepository } from "~/features/channel/repository/vspo-channel-api";
import { AddChannelUsecase } from "~/features/channel/usecase/add-channel";
import { DeleteChannelUsecase } from "~/features/channel/usecase/delete-channel";
import { VspoGuildApiRepository } from "~/features/guild/repository/vspo-guild-api";

/** Discord Snowflake ID: 17-20 digit numeric string */
const snowflake = z
  .string()
  .regex(/^\d{17,20}$/, "Invalid Discord Snowflake ID");

/** Throws UNAUTHORIZED if user is not authenticated. Returns the verified user. */
const requireAuth = (context: {
  locals: { user: unknown };
}): { id: string } => {
  if (!context.locals.user) {
    throw new ActionError({ code: "UNAUTHORIZED" });
  }
  return context.locals.user as { id: string };
};

/**
 * Verifies the user is an admin of the specified guild via real-time RPC.
 * Uses checkUserGuildAdmin (bot token) to get current Discord role status.
 * Throws FORBIDDEN if the user does not have admin permissions.
 * @precondition userId and guildId must be valid Discord snowflakes
 * @postcondition On success, the user is confirmed as a guild admin in real-time
 */
const requireGuildAdmin = async (
  userId: string,
  guildId: string,
): Promise<void> => {
  const result = await VspoGuildApiRepository.checkUserGuildAdmin(
    env.APP_WORKER,
    userId,
    [guildId],
  );
  if (result.err || !result.val[guildId]) {
    throw new ActionError({ code: "FORBIDDEN" });
  }
};

/** Unwrap a Result or throw an ActionError */
const unwrapOrThrow = <T>(result: {
  err?: { message: string } | null;
  val?: T;
}): T => {
  if (result.err) {
    throw new ActionError({
      code: "INTERNAL_SERVER_ERROR",
      message: result.err.message,
    });
  }
  return result.val as T;
};

export const server = {
  addChannel: defineAction({
    accept: "json",
    input: z.object({
      guildId: snowflake,
      channelId: snowflake,
    }),
    handler: async (input, context) => {
      const user = requireAuth(context);
      await requireGuildAdmin(user.id, input.guildId);

      const result = await AddChannelUsecase.execute({
        appWorker: env.APP_WORKER,
        guildId: input.guildId,
        channelId: input.channelId,
      });

      unwrapOrThrow(result);
      return { success: true as const };
    },
  }),

  updateChannel: defineAction({
    accept: "json",
    input: z.object({
      guildId: snowflake,
      channelId: snowflake,
      language: z.enum([
        "ja",
        "en",
        "fr",
        "de",
        "es",
        "cn",
        "tw",
        "ko",
        "default",
      ]),
      memberType: z.enum(["vspo_jp", "vspo_en", "all", "custom"]),
      customMemberIds: z.array(z.string().min(1).max(128)).optional(),
    }),
    handler: async (input, context) => {
      const user = requireAuth(context);
      await requireGuildAdmin(user.id, input.guildId);

      const result = await VspoChannelApiRepository.updateChannel(
        env.APP_WORKER,
        input.guildId,
        input.channelId,
        {
          language: input.language,
          memberType: input.memberType,
          customMembers: input.customMemberIds,
        },
      );

      unwrapOrThrow(result);
      return { success: true as const };
    },
  }),

  resetChannel: defineAction({
    accept: "json",
    input: z.object({
      guildId: snowflake,
      channelId: snowflake,
    }),
    handler: async (input, context) => {
      const user = requireAuth(context);
      await requireGuildAdmin(user.id, input.guildId);

      const result = await VspoChannelApiRepository.updateChannel(
        env.APP_WORKER,
        input.guildId,
        input.channelId,
        { language: "default", memberType: "all", customMembers: [] },
      );

      unwrapOrThrow(result);
      return { success: true as const };
    },
  }),

  deleteChannel: defineAction({
    accept: "json",
    input: z.object({
      guildId: snowflake,
      channelId: snowflake,
    }),
    handler: async (input, context) => {
      const user = requireAuth(context);
      await requireGuildAdmin(user.id, input.guildId);

      const result = await DeleteChannelUsecase.execute({
        appWorker: env.APP_WORKER,
        guildId: input.guildId,
        channelId: input.channelId,
      });

      unwrapOrThrow(result);
      return { success: true as const };
    },
  }),
};
