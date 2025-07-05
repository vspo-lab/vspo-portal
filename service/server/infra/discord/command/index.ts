import { OpenFeature } from "@openfeature/server-sdk";
import { AppLogger } from "@vspo-lab/logging";
import {
  Button,
  type CommandHandler,
  type ComponentContext,
  type ComponentHandler,
  Components,
  Select,
} from "discord-hono";
import type { ApplicationService } from "../../../cmd/server/internal/application";
import type { DiscordServer } from "../../../domain";
import {
  type SupportedLanguage,
  runWithLanguage,
  t,
} from "../../../domain/service/i18n";
import { LangCodeLabelMapping } from "../../../domain/translate";
import { cacheKey, createCloudflareKVCacheClient } from "../../cache";

const MemberTypeLabelMapping = {
  vspo_jp: "VSPO JP Members / ぶいすぽっ！JPメンバー",
  vspo_en: "VSPO EN Members / ぶいすぽっ！ENメンバー",
  // vspo_ch: "VSPO CH Members / ぶいすぽっ！CHメンバー",
  vspo_all: "All VSPO Members / すべてのぶいすぽっ！メンバー",
  custom: "Select Specific Members / 特定のメンバーを個別に選択",
  // general: "General / 一般",
} as const;

// Discord select menu can show up to 25 options
const DISCORD_SELECT_LIMIT = 25;

type Env = {
  Bindings?: Record<string, unknown>;
  Variables?: Record<string, unknown>;
};

export type IDiscordSlashDefinition<T extends Env> = {
  name: string;
  handler: CommandHandler<T>;
};

export type IDiscordComponentDefinition<T extends Env> = {
  name: string;
  handler: ComponentHandler<T, Button | Select>;
};

export type DiscordCommandEnv = {
  Bindings: {
    APP_WORKER: Service<ApplicationService>;
    APP_KV: KVNamespace;
  };
};

/**
 * /spodule setting - Allows users to configure the bot settings.
 */
export const spoduleSettingCommand: IDiscordSlashDefinition<DiscordCommandEnv> =
  {
    name: "setting",
    handler: async (c) => {
      AppLogger.debug("Spodule setting command", {
        server_id: c.interaction.guild_id || c.interaction.guild?.id || "",
        channel_id: c.interaction.channel.id,
      });
      const discordUsecase = await c.env.APP_WORKER.newDiscordUsecase();
      const channelExistsResult = await discordUsecase.existsChannel(
        c.interaction.channel.id,
      );
      if (channelExistsResult.err || !channelExistsResult.val) {
        return c.res({
          content: t("spoduleSettingCommand.label"),
          components: new Components().row(
            new Button(
              botAddComponent.name,
              t("spoduleSettingCommand.botAddButton"),
              "Success",
            ),
          ),
        });
      }
      const cache = createCloudflareKVCacheClient(c.env.APP_KV);
      const serverCacheResult = await cache.get<DiscordServer>(
        cacheKey.discordServer(
          c.interaction.guild_id || c.interaction.guild?.id || "",
        ),
      );

      let server = serverCacheResult.val;

      if (!server) {
        const serverResult = await discordUsecase.get(
          c.interaction.guild_id || c.interaction.guild?.id || "",
        );
        if (serverResult.err) {
          AppLogger.error("Failed to get server", { error: serverResult.err });
          return c.res({});
        }
        server = serverResult.val;
      }

      const targetChannel = server.discordChannels.find(
        (channel) => channel.rawId === c.interaction.channel.id,
      );

      if (!targetChannel) {
        AppLogger.error("Failed to get target channel", {
          error: "Target channel not found",
        });
        return c.res({});
      }
      const language = targetChannel.languageCode;
      if (!language) {
        AppLogger.error("Failed to get language", {
          error: "Language not found",
        });
        return c.res({});
      }

      AppLogger.debug("Language", { language });

      // Use runWithLanguage to execute the rest of the handler with the channel's language
      return runWithLanguage(language as SupportedLanguage, async () => {
        const featureClient = OpenFeature.getClient();
        const translationEnabled = await featureClient.getBooleanValue(
          "discord-translation-setting",
          false,
        );

        const components = new Components();
        const buttons: Button<"Success" | "Danger" | "Primary">[] = [];

        if (translationEnabled) {
          buttons.push(
            new Button(
              langSettingComponent.name,
              t("spoduleSettingCommand.langSettingButton"),
              "Primary",
            ),
          );
        }

        buttons.push(
          new Button(
            memberTypeSettingComponent.name,
            t("spoduleSettingCommand.memberTypeSettingButton"),
            "Primary",
          ),
        );

        buttons.push(
          new Button(
            botRemoveComponent.name,
            t("spoduleSettingCommand.botRemoveButton"),
            "Danger",
          ),
        );

        return c.res({
          content: t("spoduleSettingCommand.label"),
          components: components.row(...buttons),
        });
      });
    },
  };

/**
 * botAddComponent - Allows users to add the bot to a channel.
 */
export const botAddComponent: IDiscordComponentDefinition<DiscordCommandEnv> = {
  name: "bot-add-setting",
  handler: async (c) => {
    AppLogger.debug("Bot add component", {
      server_id: c.interaction.guild_id || c.interaction.guild?.id || "",
      channel_id: c.interaction.channel.id,
    });
    const discordUsecase = await c.env.APP_WORKER.newDiscordUsecase();
    const adjustResult = await discordUsecase.adjustBotChannel({
      type: "add",
      serverId: c.interaction.guild_id || c.interaction.guild?.id || "",
      targetChannelId: c.interaction.channel.id,
    });

    if (adjustResult.err) {
      return c.resUpdate({
        content: t("botAddComponent.error"),
        components: [],
      });
    }

    await discordUsecase.batchUpsertEnqueue([adjustResult.val]);

    return c.resUpdate({
      content: t("bot.addSuccess"),
      components: [],
    });
  },
};

/**
 * botRemoveComponent - Allows users to remove the bot from a channel.
 */
export const botRemoveComponent: IDiscordComponentDefinition<DiscordCommandEnv> =
  {
    name: "bot-remove-setting",
    handler: async (c) => {
      return c.resUpdate({
        content: t("botRemoveComponent.label"),
        components: new Components().row(
          new Button(
            yesBotRemoveComponent.name,
            t("botRemoveComponent.buttonStop"),
            "Danger",
          ),
          new Button(
            cancelComponent.name,
            t("botRemoveComponent.buttonCancel"),
            "Primary",
          ),
        ),
      });
    },
  };

/**
 * yesBotRemoveComponent - Allows users to confirm the bot removal.
 */
export const yesBotRemoveComponent: IDiscordComponentDefinition<DiscordCommandEnv> =
  {
    name: "yes-bot-remove-setting",
    handler: async (c) => {
      const discordUsecase = await c.env.APP_WORKER.newDiscordUsecase();
      let response: { content: string; components: [] };

      const deleteResult =
        await discordUsecase.batchDeleteChannelsByRowChannelIds([
          c.interaction.channel.id,
        ]);

      if (deleteResult.err) {
        response = {
          content: t("yesBotRemoveComponent.error"),
          components: [],
        };
      } else {
        response = {
          content: t("yesBotRemoveComponent.success", {
            translationOptions: {
              channelName: c.interaction.channel.name ?? "",
            },
          }),
          components: [],
        };
      }

      return c.resUpdate(response);
    },
  };

/**
 * cancelComponent - Allows users to cancel an action.
 */
export const cancelComponent: IDiscordComponentDefinition<DiscordCommandEnv> = {
  name: "cancel",
  handler: async (c) => {
    return c.resUpdate({
      content: t("cancelComponent.cancelled"),
      components: [],
    });
  },
};

/**
 * langSettingComponent - Allows users to set the language.
 */
export const langSettingComponent: IDiscordComponentDefinition<DiscordCommandEnv> =
  {
    name: "lang-setting",
    handler: async (c) => {
      return c.resUpdate({
        content: t("langSettingComponent.label"),
        components: new Components().row(
          new Select(langSelectComponent.name, "String").options(
            ...Object.entries(LangCodeLabelMapping).map(([value, label]) => ({
              value,
              label,
            })),
          ),
        ),
      });
    },
  };

/**
 * langSelectComponent - Allows users to select the language.
 */
export const langSelectComponent: IDiscordComponentDefinition<DiscordCommandEnv> =
  {
    name: "lang-select",
    handler: async (c) => {
      AppLogger.debug("Lang select component", {
        server_id: c.interaction.guild_id || c.interaction.guild?.id || "",
        channel_id: c.interaction.channel.id,
        selected_value: c.interaction.data,
      });
      // Check if user has selected a language
      if ("values" in c.interaction.data) {
        const selectedValue = c.interaction.data.values.at(
          0,
        ) as keyof typeof LangCodeLabelMapping;
        const discordUsecase = await c.env.APP_WORKER.newDiscordUsecase();

        // Adjust the bot channel with the newly selected language
        const adjustResult = await discordUsecase.adjustBotChannel({
          type: "add",
          serverId: c.interaction.guild_id || c.interaction.guild?.id || "",
          targetChannelId: c.interaction.channel.id,
          channelLangaugeCode: selectedValue,
        });

        if (adjustResult.err) {
          return c.resUpdate({
            content: t("langSelectComponent.error"),
            components: [],
          });
        }

        await discordUsecase.batchUpsertEnqueue([adjustResult.val]);
        await discordUsecase.deleteMessageInChannelEnqueue(
          c.interaction.channel.id,
        );
        return c.resUpdate({
          content: t("langSelectComponent.success", {
            translationOptions: {
              langName: LangCodeLabelMapping[selectedValue],
            },
          }),
          components: [],
        });
      }
      return c.resUpdate({
        content: t("langSelectComponent.error"),
        components: [],
      });
    },
  };

/**
 * memberTypeSettingComponent - Allows users to set the member type.
 */
export const memberTypeSettingComponent: IDiscordComponentDefinition<DiscordCommandEnv> =
  {
    name: "member-type-setting",
    handler: async (c) => {
      return c.resUpdate({
        content: t("memberTypeSettingComponent.label"),
        components: new Components().row(
          new Select(memberTypeSelectComponent.name, "String").options(
            ...Object.entries(MemberTypeLabelMapping).map(([value, label]) => ({
              value,
              label,
            })),
          ),
        ),
      });
    },
  };

/**
 * memberTypeSelectComponent - Allows users to select the member type.
 */
export const memberTypeSelectComponent: IDiscordComponentDefinition<DiscordCommandEnv> =
  {
    name: "member-type-select",
    handler: async (c) => {
      AppLogger.debug("Member type select component", {
        server_id: c.interaction.guild_id || c.interaction.guild?.id || "",
        channel_id: c.interaction.channel.id,
        selected_value: c.interaction.data,
      });

      if ("values" in c.interaction.data) {
        const selectedValue = c.interaction.data.values.at(
          0,
        ) as keyof typeof MemberTypeLabelMapping;

        // Handle custom member selection
        if (selectedValue === "custom") {
          return c.resUpdate({
            content:
              "**Choose specific members to receive notifications**\n好きなメンバーを個別に選んで通知を受け取れます\n\nSelect member group / メンバーグループを選択:",
            components: new Components().row(
              new Button("custom-member-select-jp", "JP Members", "Primary"),
              new Button("custom-member-select-en", "EN Members", "Primary"),
            ),
          });
        }

        const discordUsecase = await c.env.APP_WORKER.newDiscordUsecase();

        // Clear any cached custom member selections
        const cacheClient = createCloudflareKVCacheClient(c.env.APP_KV);
        const guildId = c.interaction.guild_id || c.interaction.guild?.id || "";
        const channelId = c.interaction.channel.id;

        // Clear all related cache keys
        await Promise.all([
          cacheClient.delete(`discord:custom_members:${guildId}:${channelId}`),
          cacheClient.delete(
            `discord:custom_members:groups:${guildId}:${channelId}`,
          ),
          cacheClient.delete(
            `discord:member_select:group_type:${guildId}:${channelId}`,
          ),
          cacheClient.delete(
            `discord:member_select:state:${guildId}:${channelId}`,
          ),
          cacheClient.delete(
            `discord:custom_members:names:${guildId}:${channelId}`,
          ),
        ]);

        // Adjust the bot channel with the newly selected member type
        const adjustResult = await discordUsecase.adjustBotChannel({
          type: "add",
          serverId: guildId,
          targetChannelId: channelId,
          memberType: selectedValue,
          selectedMemberIds: [], // Clear custom selection when selecting a preset
        });

        if (adjustResult.err) {
          return c.resUpdate({
            content: t("memberTypeSettingComponent.selectError"),
            components: [],
          });
        }

        await discordUsecase.batchUpsertEnqueue([adjustResult.val]);
        await discordUsecase.deleteMessageInChannelEnqueue(
          c.interaction.channel.id,
        );
        return c.resUpdate({
          content: t("memberTypeSettingComponent.selectSuccess", {
            translationOptions: {
              type: MemberTypeLabelMapping[selectedValue],
            },
          }),
          components: [],
        });
      }
      return c.resUpdate({
        content: t("memberTypeSettingComponent.selectError"),
        components: [],
      });
    },
  };

/**
 * customMemberSelectJPComponent - JP member selection
 */
export const customMemberSelectJPComponent: IDiscordComponentDefinition<DiscordCommandEnv> =
  {
    name: "custom-member-select-jp",
    handler: async (c) => {
      try {
        AppLogger.debug("Custom member select JP", {
          server_id: c.interaction.guild_id || c.interaction.guild?.id || "",
          channel_id: c.interaction.channel.id,
        });

        const creatorUsecase = await c.env.APP_WORKER.newCreatorUsecase();

        // Fetch JP members with Japanese language code
        const jpMembersResult = await creatorUsecase.list({
          memberType: "vspo_jp",
          limit: 300,
          page: 0,
        });

        if (jpMembersResult.err || !jpMembersResult.val) {
          return c.resUpdate({
            content: t("memberTypeSettingComponent.selectError"),
            components: [],
          });
        }

        const memberOptions = jpMembersResult.val.creators.map((creator) => ({
          value: creator.id,
          label: creator.name || "Unknown",
        }));

        return c.resUpdate({
          content: `**Select JP members / JPメンバーを選択**\n\nShowing ${memberOptions.length} members / ${memberOptions.length}人のメンバーを表示\n\nYou can select multiple members / 複数選択可能`,
          components: new Components().row(
            new Select("custom-member-direct-select", "String")
              .min_values(1)
              .max_values(Math.min(memberOptions.length, DISCORD_SELECT_LIMIT))
              .options(...memberOptions)
              .placeholder("Select JP members / JPメンバーを選択"),
          ),
        });
      } catch (error) {
        AppLogger.error("Error in customMemberSelectJPComponent", { error });
        return c.resUpdate({
          content:
            "An error occurred while processing your request. Please try again.",
          components: [],
        });
      }
    },
  };

/**
 * customMemberSelectENComponent - EN member selection
 */
export const customMemberSelectENComponent: IDiscordComponentDefinition<DiscordCommandEnv> =
  {
    name: "custom-member-select-en",
    handler: async (c) => {
      try {
        AppLogger.debug("Custom member select EN", {
          server_id: c.interaction.guild_id || c.interaction.guild?.id || "",
          channel_id: c.interaction.channel.id,
        });

        const creatorUsecase = await c.env.APP_WORKER.newCreatorUsecase();

        // Fetch EN members
        const enMembersResult = await creatorUsecase.list({
          memberType: "vspo_en",
          limit: 300,
          page: 0,
        });

        if (enMembersResult.err || !enMembersResult.val) {
          return c.resUpdate({
            content: t("memberTypeSettingComponent.selectError"),
            components: [],
          });
        }

        const memberOptions = enMembersResult.val.creators.map((creator) => ({
          value: creator.id,
          label: creator.name || "Unknown",
        }));

        return c.resUpdate({
          content:
            "**Select EN members / ENメンバーを選択**\n\nYou can select multiple members / 複数選択可能",
          components: new Components().row(
            new Select("custom-member-direct-select", "String")
              .min_values(1)
              .max_values(Math.min(memberOptions.length, DISCORD_SELECT_LIMIT))
              .options(...memberOptions)
              .placeholder("Select EN members / ENメンバーを選択"),
          ),
        });
      } catch (error) {
        AppLogger.error("Error in customMemberSelectENComponent", { error });
        return c.resUpdate({
          content:
            "An error occurred while processing your request. Please try again.",
          components: [],
        });
      }
    },
  };

/**
 * customMemberDirectSelectComponent - Direct member selection without pagination
 */
export const customMemberDirectSelectComponent: IDiscordComponentDefinition<DiscordCommandEnv> =
  {
    name: "custom-member-direct-select",
    handler: async (c) => {
      try {
        AppLogger.debug("Custom member direct select", {
          server_id: c.interaction.guild_id || c.interaction.guild?.id || "",
          channel_id: c.interaction.channel.id,
          selected_values: c.interaction.data,
        });

        if ("values" in c.interaction.data) {
          const selectedMemberIds = c.interaction.data.values;
          const discordUsecase = await c.env.APP_WORKER.newDiscordUsecase();
          const creatorUsecase = await c.env.APP_WORKER.newCreatorUsecase();

          // Fetch all creators to get names for selected IDs
          const allCreatorsResult = await creatorUsecase.list({
            limit: 500, // Get all members
            page: 0,
          });

          if (allCreatorsResult.err || !allCreatorsResult.val) {
            return c.resUpdate({
              content: t("customMemberSelectComponent.error"),
              components: [],
            });
          }

          // Get names of selected members
          const selectedMemberNames = allCreatorsResult.val.creators
            .filter((creator) => selectedMemberIds.includes(creator.id))
            .map((creator) => creator.name || "Unknown")
            .sort();

          // Clear cache before adjusting
          const cacheClient = createCloudflareKVCacheClient(c.env.APP_KV);
          const guildId =
            c.interaction.guild_id || c.interaction.guild?.id || "";
          const channelId = c.interaction.channel.id;

          // Clear all related cache keys
          await Promise.all([
            cacheClient.delete(
              `discord:custom_members:${guildId}:${channelId}`,
            ),
            cacheClient.delete(
              `discord:custom_members:groups:${guildId}:${channelId}`,
            ),
            cacheClient.delete(
              `discord:member_select:group_type:${guildId}:${channelId}`,
            ),
            cacheClient.delete(
              `discord:member_select:state:${guildId}:${channelId}`,
            ),
            cacheClient.delete(
              `discord:custom_members:names:${guildId}:${channelId}`,
            ),
            cacheClient.delete(cacheKey.discordServer(guildId)), // Also clear server cache
          ]);

          // Save the custom member selection directly
          const adjustResult = await discordUsecase.adjustBotChannel({
            type: "add",
            serverId: guildId,
            targetChannelId: channelId,
            memberType: "custom",
            selectedMemberIds: selectedMemberIds,
          });

          if (adjustResult.err) {
            AppLogger.error("Failed to adjust bot channel", {
              error: adjustResult.err,
              errorMessage: adjustResult.err.message,
              serverId: guildId,
              channelId: channelId,
              selectedMemberIds,
            });
            return c.resUpdate({
              content: `Error: ${adjustResult.err.message || t("customMemberSelectComponent.error")}`,
              components: [],
            });
          }

          await discordUsecase.batchUpsertEnqueue([adjustResult.val]);
          await discordUsecase.deleteMessageInChannelEnqueue(
            c.interaction.channel.id,
          );

          // Display selected member names
          const memberList = selectedMemberNames.join(", ");
          const successMessage = `✅ **Custom member selection saved!**\n\n**Selected members (${selectedMemberNames.length}):**\n${memberList}`;

          return c.resUpdate({
            content: successMessage,
            components: [],
          });
        }

        return c.resUpdate({
          content: t("customMemberSelectComponent.error"),
          components: [],
        });
      } catch (error) {
        AppLogger.error("Error in customMemberDirectSelectComponent", {
          error,
        });
        return c.resUpdate({
          content:
            "An error occurred while processing your request. Please try again.",
          components: [],
        });
      }
    },
  };
/**
 * /announce - Allows admins to send custom messages to all channels.
 */
export const announceCommand: IDiscordSlashDefinition<DiscordCommandEnv> = {
  name: "announce",
  handler: async (c) => {
    return c.res(t("announceCommand.sent"));
  },
};
