import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { AppLogger } from "@vspo-lab/logging";
import {
  type BindingAppWorkerEnv,
  zBindingAppWorkerEnv,
} from "../../../../config/env/worker";
import type { DiscordServers } from "../../../../domain/discord";
import { withTracer } from "../../../http/trace/cloudflare";

type DiscordChannelIdsMap = {
  channelIds: string[];
  channelLangaugeCode: string;
}[];

type GroupedChannels = {
  [language: string]: {
    channelLangaugeCode: string;
    channelIds: string[];
  };
};

export const discordDeleteAllWorkflow = () => {
  return {
    handler:
      () =>
      async (
        env: BindingAppWorkerEnv,
        _event: WorkflowEvent<Params>,
        step: WorkflowStep,
      ) => {
        const e = zBindingAppWorkerEnv.safeParse(env);
        if (!e.success) {
          console.error(e.error.message);
          return;
        }
        const logger = AppLogger.getInstance(e.data);
        const lv = await step.do(
          "fetch DiscordServers",
          {
            retries: { limit: 3, delay: "3 second", backoff: "linear" },
            timeout: "1 minutes",
          },
          async () => {
            return withTracer(
              "discord-workflow",
              "fetch-discord-servers",
              async (span) => {
                const queryService = env.DISCORD_QUERY_SERVICE;
                const allDiscordServers: DiscordServers = [];
                let currentPage = 0;
                let hasNext = true;

                while (hasNext) {
                  const result = await queryService.list({
                    limit: 100,
                    page: currentPage,
                  });

                  if (result.err) {
                    throw result.err;
                  }

                  allDiscordServers.push(...result.val.discordServers);
                  currentPage++;
                  hasNext = result.val.pagination.hasNext;
                }

                span.setAttribute("servers_count", allDiscordServers.length);
                return { allDiscordServers };
              },
            );
          },
        );

        if (lv.allDiscordServers.length === 0) {
          logger.info("No Discord servers to process");
          return;
        }

        // ramdomly shuffle allDiscordServers
        const shuffledDiscordServers = lv.allDiscordServers.sort(
          () => Math.random() - 0.5,
        );

        const groupedChannels = shuffledDiscordServers.reduce<GroupedChannels>(
          (acc, server) => {
            // Process each channel of the server individually
            for (const channel of server.discordChannels) {
              // Prioritize the channel-specific language setting; use the server's language setting if none exists
              const channelLang = channel.languageCode || server.languageCode;

              if (!acc[channelLang]) {
                acc[channelLang] = {
                  channelLangaugeCode: channelLang,
                  channelIds: [],
                };
              }

              // Ensure the channel ID has not already been added (to prevent duplicates)
              if (!acc[channelLang].channelIds.includes(channel.rawId)) {
                acc[channelLang].channelIds.push(channel.rawId);
              }
            }

            return acc;
          },
          {},
        );

        const discordChannelMap: DiscordChannelIdsMap =
          Object.values(groupedChannels);

        logger.info("Grouped channels by language", {
          totalLanguages: discordChannelMap.length,
          languageGroups: discordChannelMap.map((group) => ({
            language: group.channelLangaugeCode,
            channelCount: group.channelIds.length,
            channelIds: group.channelIds,
          })),
        });
        // FIXME: Execute in separate instances, dividing into steps of 1024
        const results = await Promise.allSettled(
          discordChannelMap.flatMap((group) =>
            group.channelIds.map((channelId) =>
              step.do(
                `delete all messages in channel ${channelId} for language ${group.channelLangaugeCode}`,
                {
                  retries: { limit: 3, delay: "5 second", backoff: "linear" },
                  timeout: "1 minutes",
                },
                async () => {
                  return withTracer(
                    "discord-workflow",
                    `delete-messages-channel-${channelId}`,
                    async (span) => {
                      const commandService = env.DISCORD_COMMAND_SERVICE;
                      logger.info(
                        `Deleting all messages in channel ${channelId} with language: ${group.channelLangaugeCode}`,
                        {
                          channelId,
                          language: group.channelLangaugeCode,
                        },
                      );
                      span.setAttribute("channel_id", channelId);
                      span.setAttribute("language", group.channelLangaugeCode);
                      const randomSleepSeconds =
                        Math.floor(Math.random() * 60) + 1; // Random value between 1-60
                      await step.sleep(
                        `${randomSleepSeconds} seconds`,
                        `${randomSleepSeconds} seconds`,
                      );
                      // Delete all messages in the specified channel
                      await commandService.deleteAllMessagesInChannel(
                        channelId,
                      );
                      logger.info(
                        `Successfully deleted all messages in channel ${channelId} with language: ${group.channelLangaugeCode}`,
                      );
                    },
                  );
                },
              ),
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
