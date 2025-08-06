import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { AppLogger } from "@vspo-lab/logging";
import {
  type BindingAppWorkerEnv,
  zBindingAppWorkerEnv,
} from "../../../../config/env/worker";
import { withTracer } from "../../../http/trace/cloudflare";

export type DiscordSendMessageChannelsParams = {
  channelIds: string[];
  content: string;
};

export const discordSendMessageChannelsWorkflow = () => {
  return {
    handler:
      () =>
      async (
        env: BindingAppWorkerEnv,
        event: WorkflowEvent<DiscordSendMessageChannelsParams>,
        step: WorkflowStep,
      ) => {
        const e = zBindingAppWorkerEnv.safeParse(env);
        if (!e.success) {
          console.error(e.error.message);
          return;
        }
        const logger = AppLogger.getInstance(e.data);

        const results = await Promise.allSettled(
          event.payload.channelIds.map((channelId) =>
            step.do(
              `send message to channel ${channelId}`,
              {
                retries: { limit: 3, delay: "5 second", backoff: "linear" },
                timeout: "1 minutes",
              },
              async () => {
                return withTracer(
                  "discord-workflow",
                  `send-admin-message-channel-${channelId}`,
                  async (span) => {
                    const commandService = env.DISCORD_COMMAND_SERVICE;
                    logger.info(`Sending message to channel ${channelId}`, {
                      channelId,
                    });
                    span.setAttribute("channel_id", channelId);
                    // Send message to the specified channel
                    await commandService.sendAdminMessage({
                      channelId,
                      content: event.payload.content,
                    });
                    logger.info(
                      `Successfully sent message to channel ${channelId}`,
                    );
                  },
                );
              },
            ),
          ),
        );

        const failedSteps = results.filter(
          (result) => result.status === "rejected",
        );
        if (failedSteps.length > 0) {
          logger.error(
            `${failedSteps.length} step(s) failed. Check logs for details.`,
          );
        }
      },
  };
};
