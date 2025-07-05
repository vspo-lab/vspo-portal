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

// Current VSPO member counts (update as needed)
const MEMBER_COUNTS = {
  vspo_jp: 24,
  vspo_en: 5,
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
      AppLogger.debug("Spodule setting command", {
        server_id: c.interaction.guild_id || c.interaction.guild?.id || "",
        channel_id: c.interaction.channel.id,
      });
      const discordUsecase = await c.env.APP_WORKER.newDiscordUsecase();
      const channelExistsResult = await discordUsecase.existsChannel(
        c.interaction.channel.id
      );
      if (channelExistsResult.err || !channelExistsResult.val) {
        return c.res({
          content: t("spoduleSettingCommand.label"),
          components: new Components().row(
            new Button(
              botAddComponent.name,
              t("spoduleSettingCommand.botAddButton"),
              "Success"
            )
          ),
        });
      }
      const cache = createCloudflareKVCacheClient(c.env.APP_KV);
      const serverCacheResult = await cache.get<DiscordServer>(
        cacheKey.discordServer(
          c.interaction.guild_id || c.interaction.guild?.id || ""
        )
      );

      let server = serverCacheResult.val;

      if (!server) {
        const serverResult = await discordUsecase.get(
          c.interaction.guild_id || c.interaction.guild?.id || ""
        );
        if (serverResult.err) {
          AppLogger.error("Failed to get server", { error: serverResult.err });
          return c.res({});
        }
        server = serverResult.val;
      }

      const targetChannel = server.discordChannels.find(
        (channel) => channel.rawId === c.interaction.channel.id
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
          false
        );

        const components = new Components();
        const buttons: Button<"Success" | "Danger" | "Primary">[] = [];

        if (translationEnabled) {
          buttons.push(
            new Button(
              langSettingComponent.name,
              t("spoduleSettingCommand.langSettingButton"),
              "Primary"
            )
          );
        }

        buttons.push(
          new Button(
            memberTypeSettingComponent.name,
            t("spoduleSettingCommand.memberTypeSettingButton"),
            "Primary"
          )
        );

        buttons.push(
          new Button(
            botRemoveComponent.name,
            t("spoduleSettingCommand.botRemoveButton"),
            "Danger"
          )
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
            "Danger"
          ),
          new Button(
            cancelComponent.name,
            t("botRemoveComponent.buttonCancel"),
            "Primary"
          )
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
            }))
          )
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
          0
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
          c.interaction.channel.id
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
            }))
          )
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
          0
        ) as keyof typeof MemberTypeLabelMapping;

        // Handle custom member selection
        if (selectedValue === "custom") {
          // Store the initial state in cache
          const cacheClient = createCloudflareKVCacheClient(c.env.APP_KV);
          const stateKey = `discord:member_select:state:${
            c.interaction.guild_id || ""
          }:${c.interaction.channel.id}`;
          await cacheClient.set(stateKey, "jp_page1", 300); // Default to jp_page1

          // Show member group selection buttons
          return c.resUpdate({
            content:
              "**Choose specific members to receive notifications**\n好きなメンバーを個別に選んで通知を受け取れます\n\nSelect from the groups below / 以下のグループから選択:",
            components: new Components()
              .row(
                new Button(
                  memberGroupSelectJPPage1Component.name,
                  "JP Members (1/2)",
                  "Primary"
                ),
                new Button(
                  memberGroupSelectJPPage2Component.name,
                  "JP Members (2/2)",
                  "Primary"
                ),
                new Button(
                  memberGroupSelectENComponent.name,
                  "EN Members",
                  "Primary"
                )
              )
              .row(
                new Button(
                  memberGroupSelectConfirmComponent.name,
                  "選択を確定 / Confirm Selection",
                  "Success"
                ).disabled(true) // Initially disabled until selections are made
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
            `discord:custom_members:groups:${guildId}:${channelId}`
          ),
          cacheClient.delete(
            `discord:member_select:group_type:${guildId}:${channelId}`
          ),
          cacheClient.delete(
            `discord:member_select:state:${guildId}:${channelId}`
          ),
          cacheClient.delete(
            `discord:custom_members:names:${guildId}:${channelId}`
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
          c.interaction.channel.id
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
      try {
        AppLogger.debug("Custom member select component", {
          server_id: c.interaction.guild_id || c.interaction.guild?.id || "",
          channel_id: c.interaction.channel.id,
          selected_values: c.interaction.data,
          custom_id: c.interaction.data.custom_id,
        });

        if ("values" in c.interaction.data) {
          const selectedMemberIds = c.interaction.data.values;

          // Retrieve the group type from cache
          const cacheClient = createCloudflareKVCacheClient(c.env.APP_KV);
          const groupTypeKey = `discord:member_select:group_type:${
            c.interaction.guild_id || ""
          }:${c.interaction.channel.id}`;
          const groupTypeResult = await cacheClient.get<string>(groupTypeKey);
          const groupType = groupTypeResult.val || "";

          // Store selections in cache
          const selectedMembersKey = `discord:custom_members:${
            c.interaction.guild_id || ""
          }:${c.interaction.channel.id}`;

          // Get existing selections
          const existingDataResult = await cacheClient.get<string>(
            selectedMembersKey
          );
          let allSelectedIds: string[] =
            !existingDataResult.err && existingDataResult.val
              ? JSON.parse(existingDataResult.val)
              : [];

          // Store group selections separately to track which groups have been selected
          const groupSelectionsKey = `discord:custom_members:groups:${
            c.interaction.guild_id || ""
          }:${c.interaction.channel.id}`;
          const groupDataResult = await cacheClient.get<string>(
            groupSelectionsKey
          );
          const groupSelections: Record<string, string[]> =
            !groupDataResult.err && groupDataResult.val
              ? JSON.parse(groupDataResult.val)
              : {};

          // Update selections for this group
          groupSelections[groupType] = selectedMemberIds;

          // Combine all selections
          allSelectedIds = Object.values(groupSelections).flat() as string[];

          // Save to cache (expire in 5 minutes)
          await cacheClient.set(
            selectedMembersKey,
            JSON.stringify(allSelectedIds),
            300
          );
          await cacheClient.set(
            groupSelectionsKey,
            JSON.stringify(groupSelections),
            300
          );

          // Update the message to show current selections and enable confirm button
          const selectedGroups = Object.keys(groupSelections);
          const totalSelected = allSelectedIds.length;

          // Fetch member counts to determine pagination needs
          const creatorUsecase = await c.env.APP_WORKER.newCreatorUsecase();
          const pageSize = 25; // Discord select menu limit

          // Get JP members count
          const jpMembersResult = await creatorUsecase.list({
            memberType: "vspo_jp",
            limit: 1,
            page: 0, // Repository uses 0-based pagination
          });

          // Get EN members count
          const enMembersResult = await creatorUsecase.list({
            memberType: "vspo_en",
            limit: 1,
            page: 0, // Repository uses 0-based pagination
          });

          const jpTotalCount = jpMembersResult.val?.pagination.totalCount || 0;
          const enTotalCount = enMembersResult.val?.pagination.totalCount || 0;

          AppLogger.debug("Member counts for pagination", {
            jpTotalCount,
            enTotalCount,
            jpMembersResultVal: jpMembersResult.val,
            enMembersResultVal: enMembersResult.val,
            pageSize,
            jpTotalPages: Math.ceil(jpTotalCount / pageSize),
            enTotalPages: Math.ceil(enTotalCount / pageSize),
            shouldPaginateJP: jpTotalCount > pageSize,
            shouldPaginateEN: enTotalCount > pageSize,
          });

          const jpTotalPages =
            jpTotalCount > 0 ? Math.ceil(jpTotalCount / pageSize) : 0;
          const enTotalPages =
            enTotalCount > 0 ? Math.ceil(enTotalCount / pageSize) : 0;

          // Build button rows dynamically
          const components = new Components();
          const buttonRow: Button[] = [];

          // Add JP member button
          buttonRow.push(
            new Button("member-group-select-jp_page1", "JP Members", "Primary")
          );

          // Add EN member button
          buttonRow.push(
            new Button(
              memberGroupSelectENComponent.name,
              "EN Members",
              "Primary"
            )
          );

          // Add buttons to components (max 5 per row)
          if (buttonRow.length > 0) {
            components.row(...buttonRow.slice(0, 5));
            if (buttonRow.length > 5) {
              components.row(...buttonRow.slice(5, 10));
            }
          }

          // Add confirm button in separate row
          components.row(
            new Button(
              memberGroupSelectConfirmComponent.name,
              "選択を確定 / Confirm Selection",
              "Success"
            ).disabled(totalSelected === 0)
          );

          // Get selected member names from cache
          let selectedMemberNames: string[] = [];
          if (totalSelected > 0) {
            const memberNamesKey = `discord:custom_members:names:${
              c.interaction.guild_id || ""
            }:${c.interaction.channel.id}`;
            const memberNamesResult = await cacheClient.get<
              Record<string, string>
            >(memberNamesKey);

            if (!memberNamesResult.err && memberNamesResult.val) {
              const memberNameMap = memberNamesResult.val;
              selectedMemberNames = allSelectedIds
                .map((id) => memberNameMap[id] || "Unknown")
                .filter((name) => name !== "Unknown");
            }
          }

          const selectionText =
            totalSelected > 0
              ? `**Current selection / 現在の選択:** ${totalSelected} members\n${selectedMemberNames.join(
                  ", "
                )}`
              : "**Current selection / 現在の選択:** None";

          return c.resUpdate({
            content: `**Choose specific members to receive notifications**\n好きなメンバーを個別に選んで通知を受け取れます\n\n${selectionText}`,
            components: components,
          });
        }
        return c.resUpdate({
          content: t("customMemberSelectComponent.error"),
          components: [],
        });
      } catch (error) {
        AppLogger.error("Error in customMemberSelectComponent", { error });
        return c.resUpdate({
          content:
            "An error occurred while processing your request. Please try again.",
          components: [],
        });
      }
    },
  };

/**
 * Generate member group select components dynamically
 */
function createMemberGroupSelectComponent(
  customId: string,
  buttonValue: string
): IDiscordComponentDefinition<DiscordCommandEnv> {
  return {
    name: customId,
    handler: async (c) => memberGroupSelectHandler(c, buttonValue),
  };
}

// Pre-define components for up to 5 pages of JP members
export const memberGroupSelectJPPage1Component =
  createMemberGroupSelectComponent("member-group-select-jp_page1", "jp_page1");
export const memberGroupSelectJPPage2Component =
  createMemberGroupSelectComponent("member-group-select-jp_page2", "jp_page2");
export const memberGroupSelectJPPage3Component =
  createMemberGroupSelectComponent("member-group-select-jp_page3", "jp_page3");
export const memberGroupSelectJPPage4Component =
  createMemberGroupSelectComponent("member-group-select-jp_page4", "jp_page4");
export const memberGroupSelectJPPage5Component =
  createMemberGroupSelectComponent("member-group-select-jp_page5", "jp_page5");

/**
 * EN Members selection
 */
export const memberGroupSelectENComponent: IDiscordComponentDefinition<DiscordCommandEnv> =
  {
    name: "member-group-select-en",
    handler: async (c) => memberGroupSelectHandler(c, "en"),
  };

/**
 * Generic member group select component for backward compatibility
 */
export const memberGroupSelectComponent = memberGroupSelectJPPage1Component;

/**
 * memberGroupSelectConfirmComponent - Confirm selection
 */
export const memberGroupSelectConfirmComponent: IDiscordComponentDefinition<DiscordCommandEnv> =
  {
    name: "member-group-select-confirm",
    handler: async (c) => memberGroupSelectHandler(c, "confirm"),
  };

/**
 * Shared handler for member group selection
 */
async function memberGroupSelectHandler(
  c: ComponentContext<DiscordCommandEnv, Button | Select>,
  buttonValue: string
): Promise<Response> {
  try {
    AppLogger.debug("Member group select handler", {
      server_id: c.interaction.guild_id || c.interaction.guild?.id || "",
      channel_id: c.interaction.channel.id,
      buttonValue: buttonValue,
    });

    if (buttonValue === "confirm") {
      // Handle confirmation - retrieve selected members from cache/state
      const cacheClient = createCloudflareKVCacheClient(c.env.APP_KV);
      const selectedMembersKey = `discord:custom_members:${
        c.interaction.guild_id || ""
      }:${c.interaction.channel.id}`;

      const cachedDataResult = await cacheClient.get<string>(
        selectedMembersKey
      );
      if (cachedDataResult.err || !cachedDataResult.val) {
        return c.resUpdate({
          content: "No members selected / メンバーが選択されていません",
          components: [],
        });
      }

      const selectedMemberIds = JSON.parse(cachedDataResult.val) as string[];
      const discordUsecase = await c.env.APP_WORKER.newDiscordUsecase();

      // Save the custom member selection
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
        c.interaction.channel.id
      );

      // Clean up cache
      const guildId = c.interaction.guild_id || "";
      const channelId = c.interaction.channel.id;
      await Promise.all([
        cacheClient.delete(selectedMembersKey),
        cacheClient.delete(
          `discord:custom_members:groups:${guildId}:${channelId}`
        ),
        cacheClient.delete(
          `discord:member_select:group_type:${guildId}:${channelId}`
        ),
        cacheClient.delete(
          `discord:custom_members:names:${guildId}:${channelId}`
        ),
      ]);

      return c.resUpdate({
        content: t("customMemberSelectComponent.success", {
          translationOptions: {
            count: selectedMemberIds.length,
          },
        }),
        components: [],
      });
    }

    // Handle member group selection
    const creatorUsecase = await c.env.APP_WORKER.newCreatorUsecase();
    let memberType: "vspo_jp" | "vspo_en" = "vspo_jp";
    let page = 0; // Repository implementation uses 0-based pagination (offset = page * limit)

    // Parse button value to extract member type and page
    if (buttonValue === "en") {
      memberType = "vspo_en";
      page = 0;
    } else if (buttonValue.startsWith("jp_page")) {
      memberType = "vspo_jp";
      const pageMatch = buttonValue.match(/jp_page(\d+)/);
      page = pageMatch ? Number.parseInt(pageMatch[1]) - 1 : 0; // Convert to 0-based
    }

    const limit = DISCORD_SELECT_LIMIT;

    const creatorsResult = await creatorUsecase.list({
      memberType: memberType,
      limit: limit,
      page: page,
    });

    AppLogger.debug("Creator search result", {
      memberType: memberType,
      page: page,
      limit: limit,
      hasError: !!creatorsResult.err,
      resultCount: creatorsResult.val?.creators.length || 0,
      totalCount: creatorsResult.val?.pagination.totalCount || 0,
      currentPage: creatorsResult.val?.pagination.currentPage || 0,
      totalPage: creatorsResult.val?.pagination.totalPage || 0,
    });

    if (creatorsResult.err || !creatorsResult.val) {
      return c.resUpdate({
        content: t("memberTypeSettingComponent.selectError"),
        components: [],
      });
    }

    const memberOptions = creatorsResult.val.creators.map((creator) => ({
      value: creator.id,
      label: creator.name || "Unknown",
    }));

    // Check if we have any members
    if (memberOptions.length === 0) {
      return c.resUpdate({
        content:
          "No members found for this group / このグループにメンバーが見つかりません",
        components: [],
      });
    }

    // Create select menu for this group
    const groupLabel =
      buttonValue === "en"
        ? "EN Members"
        : buttonValue.startsWith("jp_page")
        ? `JP Members (Page ${buttonValue.replace("jp_page", "")})`
        : buttonValue.toUpperCase();

    // Store the current group type in cache for the handler to retrieve
    const cacheClient = createCloudflareKVCacheClient(c.env.APP_KV);
    const guildId = c.interaction.guild_id || "";
    const channelId = c.interaction.channel.id;

    const groupTypeKey = `discord:member_select:group_type:${guildId}:${channelId}`;
    await cacheClient.set(groupTypeKey, buttonValue, 300); // Expire in 5 minutes

    // Store member ID to name mapping for later retrieval
    const memberNamesKey = `discord:custom_members:names:${guildId}:${channelId}`;
    const existingNamesResult = await cacheClient.get<Record<string, string>>(
      memberNamesKey
    );
    const memberNameMap =
      !existingNamesResult.err && existingNamesResult.val
        ? existingNamesResult.val
        : {};

    // Add current group's members to the map
    for (const creator of creatorsResult.val.creators) {
      memberNameMap[creator.id] = creator.name || "Unknown";
    }

    await cacheClient.set(memberNamesKey, memberNameMap, 300); // Expire in 5 minutes

    // Debug logging

    AppLogger.debug("Creating select menu", {
      memberCount: memberOptions.length,
      groupLabel: groupLabel,
      buttonValue: buttonValue,
    });

    return c.resUpdate({
      content: `**Select members from ${groupLabel}**\n好きなメンバーを選んでください\n\nYou can select multiple members / 複数選択可能`,
      components: new Components().row(
        new Select(customMemberSelectComponent.name, "String")
          .min_values(0)
          .max_values(Math.max(1, memberOptions.length))
          .options(...memberOptions)
          .placeholder(`Choose members from ${groupLabel}`)
      ),
    });
  } catch (error) {
    AppLogger.error("Error in memberGroupSelectHandler", { error });
    return c.resUpdate({
      content:
        "An error occurred while processing your request. Please try again.",
      components: [],
    });
  }
}

/**
 * /announce - Allows admins to send custom messages to all channels.
 */
export const announceCommand: IDiscordSlashDefinition<DiscordCommandEnv> = {
  name: "announce",
  handler: async (c) => {
    return c.res(t("announceCommand.sent"));
  },
};
