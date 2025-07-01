import { OpenFeature } from "@openfeature/server-sdk";
import { AppLogger } from "@vspo-lab/logging";
import {
  Button,
  type CommandHandler,
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
  custom: "Custom Selection / カスタム選択",
  // general: "General / 一般",
} as const;

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
      AppLogger.info("Spodule setting command", {
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

      AppLogger.info("Language", { language });

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
    AppLogger.info("Bot add component", {
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
      AppLogger.info("Lang select component", {
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
      AppLogger.info("Member type select component", {
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
          // Show member selection interface
          const creatorUsecase = await c.env.APP_WORKER.newCreatorUsecase();
          const creatorsResult = await creatorUsecase.searchByMemberType({
            memberType: "vspo_all",
            limit: 100,
            page: 0,
          });

          if (creatorsResult.err || !creatorsResult.val) {
            return c.resUpdate({
              content: t("memberTypeSettingComponent.selectError"),
              components: [],
            });
          }

          // Create member selection dropdown
          const memberOptions = creatorsResult.val.map((creator) => ({
            value: creator.id,
            label: creator.name || "Unknown",
          }));

          return c.resUpdate({
            content: t("customMemberSelectComponent.label"),
            components: new Components().row(
              new Select(customMemberSelectComponent.name, "String")
                .min_values(1)
                .max_values(memberOptions.length)
                .options(...memberOptions),
            ),
          });
        }

        const discordUsecase = await c.env.APP_WORKER.newDiscordUsecase();

        // Adjust the bot channel with the newly selected member type
        const adjustResult = await discordUsecase.adjustBotChannel({
          type: "add",
          serverId: c.interaction.guild_id || c.interaction.guild?.id || "",
          targetChannelId: c.interaction.channel.id,
          memberType: selectedValue,
          selectedMemberIds: undefined, // Clear custom selection when selecting a preset
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
 * customMemberSelectComponent - Allows users to select specific members.
 */
export const customMemberSelectComponent: IDiscordComponentDefinition<DiscordCommandEnv> =
  {
    name: "custom-member-select",
    handler: async (c) => {
      AppLogger.info("Custom member select component", {
        server_id: c.interaction.guild_id || c.interaction.guild?.id || "",
        channel_id: c.interaction.channel.id,
        selected_values: c.interaction.data,
      });

      if ("values" in c.interaction.data) {
        const selectedMemberIds = c.interaction.data.values;
        const discordUsecase = await c.env.APP_WORKER.newDiscordUsecase();

        // Adjust the bot channel with the selected member IDs
        const adjustResult = await discordUsecase.adjustBotChannel({
          type: "add",
          serverId: c.interaction.guild_id || c.interaction.guild?.id || "",
          targetChannelId: c.interaction.channel.id,
          memberType: "custom",
          selectedMemberIds: selectedMemberIds,
        });

        if (adjustResult.err) {
          return c.resUpdate({
            content: t("customMemberSelectComponent.error"),
            components: [],
          });
        }

        await discordUsecase.batchUpsertEnqueue([adjustResult.val]);
        await discordUsecase.deleteMessageInChannelEnqueue(
          c.interaction.channel.id,
        );

        return c.resUpdate({
          content: t("customMemberSelectComponent.success", {
            translationOptions: {
              count: selectedMemberIds.length,
            },
          }),
          components: [],
        });
      }
      return c.resUpdate({
        content: t("customMemberSelectComponent.error"),
        components: [],
      });
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
