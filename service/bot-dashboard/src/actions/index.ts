import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { env } from "cloudflare:workers";
import { VspoChannelApiRepository } from "~/features/channel/repository/vspo-channel-api";
import { ToggleChannelUsecase } from "~/features/channel/usecase/toggle-channel";

/** Throws UNAUTHORIZED if user is not authenticated */
const requireAuth = (context: { locals: { user: unknown } }) => {
  if (!context.locals.user) {
    throw new ActionError({ code: "UNAUTHORIZED" });
  }
};

export const server = {
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
        env.VSPO_API_URL,
        env.VSPO_API_KEY,
        input.guildId,
        input.channelId,
        {
          language: input.language,
          memberType: input.memberType,
          customMembers: input.customMemberIds,
        },
      );

      if (result.err) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.val.message,
        });
      }
    },
  }),

  toggleChannel: defineAction({
    accept: "form",
    input: z.object({
      guildId: z.string(),
      channelId: z.string(),
      enable: z.coerce.boolean(),
    }),
    handler: async (input, context) => {
      requireAuth(context);

      const result = await ToggleChannelUsecase.execute({
        apiUrl: env.VSPO_API_URL,
        apiKey: env.VSPO_API_KEY,
        guildId: input.guildId,
        channelId: input.channelId,
        enable: input.enable,
      });

      if (result.err) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.val.message,
        });
      }
    },
  }),
};
