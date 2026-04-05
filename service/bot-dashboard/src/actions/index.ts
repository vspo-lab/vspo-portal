import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { env } from "cloudflare:workers";
import { VspoChannelApiRepository } from "~/features/channel/repository/vspo-channel-api";
import { AddChannelUsecase } from "~/features/channel/usecase/add-channel";
import { DeleteChannelUsecase } from "~/features/channel/usecase/delete-channel";

/** Throws UNAUTHORIZED if user is not authenticated */
const requireAuth = (context: { locals: { user: unknown } }) => {
  if (!context.locals.user) {
    throw new ActionError({ code: "UNAUTHORIZED" });
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
    accept: "form",
    input: z.object({
      guildId: z.string(),
      channelId: z.string(),
    }),
    handler: async (input, context) => {
      requireAuth(context);

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
    accept: "form",
    input: z.object({
      guildId: z.string(),
      channelId: z.string(),
      language: z.string(),
      memberType: z.enum(["vspo_jp", "vspo_en", "all", "custom"]),
      customMemberIds: z.array(z.string()).optional(),
    }),
    handler: async (input, context) => {
      requireAuth(context);

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
    accept: "form",
    input: z.object({
      guildId: z.string(),
      channelId: z.string(),
    }),
    handler: async (input, context) => {
      requireAuth(context);

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
    accept: "form",
    input: z.object({
      guildId: z.string(),
      channelId: z.string(),
    }),
    handler: async (input, context) => {
      requireAuth(context);

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
