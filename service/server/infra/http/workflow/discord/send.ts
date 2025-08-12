import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { OpenFeature } from "@openfeature/server-sdk";
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
  channelMemberType:
    | "vspo_jp"
    | "vspo_en"
    | "vspo_ch"
    | "vspo_all"
    | "general"
    | "custom";
  selectedMemberIds?: string[];
}[];

type GroupedChannels = {
  [key: string]: {
    channelLangaugeCode: string;
    channelMemberType:
      | "vspo_jp"
      | "vspo_en"
      | "vspo_ch"
      | "vspo_all"
      | "general"
      | "custom";
    channelIds: string[];
    selectedMemberIds?: string[];
  };
};

// Function to chunk an array into smaller pieces
const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export const discordSendMessagesWorkflow = () => {
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
        const client = OpenFeature.getClient();
        const enabled = await client.getBooleanValue(
          "discord-bot-maintenance",
          false,
        );
        if (enabled) {
          logger.info("Bot is under maintenance");
          return;
        }
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

                  allDiscordServers.push(...result.val.servers);
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
          logger.info("No videos to translate");
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
              const memberType = channel.memberType || "vspo_all";
              const selectedMemberIds = channel.selectedMemberIds;
              // Create a unique key based on language, member type, and selected members
              const selectedMembersKey =
                selectedMemberIds?.sort().join(",") || "";
              const compositeKey = `${channelLang}-${memberType}-${selectedMembersKey}`;

              if (!acc[compositeKey]) {
                acc[compositeKey] = {
                  channelLangaugeCode: channelLang,
                  channelMemberType: memberType,
                  channelIds: [],
                  selectedMemberIds: selectedMemberIds,
                };
              }

              // Ensure the channel ID has not already been added (to prevent duplicates)
              if (!acc[compositeKey].channelIds.includes(channel.rawId)) {
                acc[compositeKey].channelIds.push(channel.rawId);
              }
            }

            return acc;
          },
          {},
        );

        const discordChannelMap: DiscordChannelIdsMap =
          Object.values(groupedChannels);

        logger.info("Grouped channels by language and member type", {
          totalGroups: discordChannelMap.length,
          groups: discordChannelMap.map((group) => ({
            language: group.channelLangaugeCode,
            memberType: group.channelMemberType,
            channelCount: group.channelIds.length,
            channelIds: group.channelIds,
          })),
        });

        // Process the first batch for each language group
        for (const group of discordChannelMap) {
          // Split channelIds into chunks of maximum 100
          const chunkedChannelIds = chunkArray(group.channelIds, 100);

          logger.info(
            `Processing ${chunkedChannelIds.length} chunks for language: ${group.channelLangaugeCode}`,
            {
              totalChannels: group.channelIds.length,
              numberOfChunks: chunkedChannelIds.length,
              chunkSize: Math.min(100, group.channelIds.length),
            },
          );

          // Process each chunk
          for (let i = 0; i < chunkedChannelIds.length; i++) {
            const channelIdsChunk = chunkedChannelIds[i];

            logger.info(
              `Processing chunk ${i + 1}/${chunkedChannelIds.length} for language: ${group.channelLangaugeCode}`,
              {
                chunkSize: channelIdsChunk.length,
                language: group.channelLangaugeCode,
              },
            );

            // Process this chunk
            const results = await Promise.allSettled([
              step.do(
                `send videos to channels for ${group.channelLangaugeCode} (chunk ${i + 1}/${chunkedChannelIds.length})`,
                {
                  retries: { limit: 1, delay: "5 second", backoff: "linear" },
                  timeout: "2 minutes",
                },
                async () => {
                  return withTracer(
                    "discord-workflow",
                    `send-streams-language-${group.channelLangaugeCode}-chunk-${i + 1}`,
                    async (span) => {
                      const commandService = env.DISCORD_COMMAND_SERVICE;
                      logger.info(
                        `Sending videos to ${channelIdsChunk.length} channels with language: ${group.channelLangaugeCode}`,
                        {
                          channelCount: channelIdsChunk.length,
                          language: group.channelLangaugeCode,
                          chunkIndex: i + 1,
                          totalChunks: chunkedChannelIds.length,
                        },
                      );
                      span.setAttribute("language", group.channelLangaugeCode);
                      span.setAttribute(
                        "channels_count",
                        channelIdsChunk.length,
                      );
                      span.setAttribute("chunk_index", i + 1);
                      span.setAttribute(
                        "total_chunks",
                        chunkedChannelIds.length,
                      );

                      await commandService.sendStreamsToMultipleChannels({
                        channelIds: channelIdsChunk,
                        channelLangaugeCode: group.channelLangaugeCode,
                        channelMemberType: group.channelMemberType,
                        selectedMemberIds: group.selectedMemberIds,
                      });

                      logger.info(
                        `Successfully sent videos to chunk ${i + 1}/${chunkedChannelIds.length} with language: ${group.channelLangaugeCode}`,
                      );
                    },
                  );
                },
              ),
            ]);

            const failedSteps = results.filter(
              (result) => result.status === "rejected",
            );

            if (failedSteps.length > 0) {
              logger.error(
                `${failedSteps.length} step(s) failed for chunk ${i + 1}/${chunkedChannelIds.length}. Check logs for details.`,
              );
            }

            // Sleep for 3 seconds between chunks, but not after the last chunk
            if (i < chunkedChannelIds.length - 1) {
              logger.info(
                "Sleeping for 1 seconds before processing next chunk",
              );
              await step.sleep("1 seconds", "1 seconds");
            }
          }
        }
      },
  };
};
