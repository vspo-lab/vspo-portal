import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { env } from "cloudflare:workers";
import { VspoChannelApiRepository } from "~/features/channel/repository/vspo-channel-api";
import { AddChannelUsecase } from "~/features/channel/usecase/add-channel";
import { DeleteChannelUsecase } from "~/features/channel/usecase/delete-channel";

/** Discord Snowflake ID: 17-20 digit numeric string */
const snowflake = z
  .string()
  .regex(/^\d{17,20}$/, "Invalid Discord Snowflake ID");

type ActionContext = {
  locals: { user: unknown };
  session?: { get: (key: string) => Promise<unknown> };
};

/** Throws UNAUTHORIZED if user is not authenticated. Returns the verified user. */
const requireAuth = (context: ActionContext): { id: string } => {
  if (!context.locals.user) {
    throw new ActionError({ code: "UNAUTHORIZED" });
  }
  return context.locals.user as { id: string };
};

/**
 * Verifies the user is an admin of the specified guild using session-cached
 * guildSummaries (populated when the user visits /dashboard).
 * Throws FORBIDDEN if the guild is not in the admin cache.
 * @precondition guildId must be a valid Discord snowflake
 * @postcondition On success, the user is confirmed as a guild admin
 */
const requireGuildAdmin = async (
  context: ActionContext,
  guildId: string,
): Promise<void> => {
  const guildSummaries = await context.session?.get("guildSummaries");
  const isAdmin = (
    guildSummaries as
      | ReadonlyArray<{ id: string; isAdmin: boolean }>
      | undefined
  )?.some((g) => g.id === guildId && g.isAdmin);
  if (!isAdmin) {
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
      await requireGuildAdmin(context, input.guildId);

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
      language: z.string(),
      memberType: z.enum(["vspo_jp", "vspo_en", "all", "custom"]),
      customMemberIds: z.array(z.string()).optional(),
    }),
    handler: async (input, context) => {
      const user = requireAuth(context);
      await requireGuildAdmin(context, input.guildId);

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
      await requireGuildAdmin(context, input.guildId);

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
      await requireGuildAdmin(context, input.guildId);

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
