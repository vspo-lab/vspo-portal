import { z } from "zod";
import {
  ChannelConfig,
  type ChannelConfigType,
} from "~/features/channel/domain/channel-config";

const ChannelSummarySchema = z.object({
  enabledCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  previewNames: z.array(z.string()).max(3),
});

type ChannelSummary = z.infer<typeof ChannelSummarySchema>;

const GuildSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  isAdmin: z.boolean(),
  botInstalled: z.boolean(),
  channelSummary: ChannelSummarySchema.optional(),
});

type GuildSummary = z.infer<typeof GuildSummarySchema>;

const GuildSummary = {
  schema: GuildSummarySchema,

  /**
   * Builds a guild summary from a Discord guild payload.
   *
   * @param raw - Discord guild data including the owner flag
   * @param botGuildIds - Guild IDs where the bot is already installed
   * @returns Guild summary with installation and admin flags derived from the inputs
   * @precondition raw.id !== "" && raw.name !== ""
   * @postcondition return.id === raw.id && return.name === raw.name && return.botInstalled === botGuildIds.has(raw.id)
   */
  fromDiscordGuild: (
    raw: {
      id: string;
      name: string;
      icon: string | null;
      owner: boolean;
    },
    botGuildIds: ReadonlySet<string>,
  ): GuildSummary => ({
    id: raw.id,
    name: raw.name,
    icon: raw.icon,
    isAdmin: raw.owner,
    botInstalled: botGuildIds.has(raw.id),
  }),

  /** Resolves the Discord CDN icon URL for a guild, or null if no icon is set. */
  iconUrl: (guild: GuildSummary): string | null =>
    guild.icon
      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
      : null,

  /** Filters guild summaries to those the user can manage (isAdmin === true). */
  filterManageable: (guilds: readonly GuildSummary[]): GuildSummary[] =>
    guilds.filter((g) => g.isAdmin),

  /**
   * Splits guild summaries by bot installation state.
   *
   * @param guilds - Guild summaries to partition
   * @returns Guild summaries grouped into installed and not-installed arrays
   * @precondition Every element of guilds satisfies GuildSummary.schema
   * @postcondition Each input guild appears in exactly one output array, preserving relative order within each partition
   */
  partition: (
    guilds: readonly GuildSummary[],
  ): {
    installed: GuildSummary[];
    notInstalled: GuildSummary[];
  } => ({
    installed: guilds.filter((g) => g.botInstalled),
    notInstalled: guilds.filter((g) => !g.botInstalled),
  }),

  /** Builds a Discord bot invite URL preselecting the given guild. */
  inviteUrl: (guild: GuildSummary, botClientId: string): string =>
    `https://discord.com/oauth2/authorize?client_id=${botClientId}&guild_id=${guild.id}&permissions=2048&scope=bot%20applications.commands`,

  /**
   * Attaches a derived channel summary to an existing guild summary.
   *
   * @param guild - Guild summary previously constructed for the target guild
   * @param channels - Channel configurations belonging to the guild
   * @returns New guild summary including enabled-count, total-count, and preview-name aggregates
   * @precondition guild must already be constructed via fromDiscordGuild
   * @postcondition Returns a new GuildSummary with channelSummary derived from channels
   */
  withChannelSummary: (
    guild: GuildSummary,
    channels: ChannelConfigType[],
  ): GuildSummary => {
    const enabled = channels.filter((c) => c.enabled);
    return {
      ...guild,
      channelSummary: {
        enabledCount: enabled.length,
        totalCount: channels.length,
        previewNames: enabled.slice(0, 3).map((c) => c.channelName),
      },
    };
  },

  /**
   * Returns a new guild summary with isAdmin overridden by a server-side check.
   *
   * @param guild - Existing guild summary
   * @param isAdmin - Result of a server-side admin role check
   * @returns New guild summary where isAdmin is true if either the guild or the server check indicates admin
   * @precondition guild must already be constructed via fromDiscordGuild
   * @postcondition return.isAdmin === (guild.isAdmin || isAdmin)
   */
  withAdminOverride: (guild: GuildSummary, isAdmin: boolean): GuildSummary => ({
    ...guild,
    isAdmin: guild.isAdmin || isAdmin,
  }),
} as const;

const GuildBotConfigSchema = z.object({
  guildId: z.string(),
  channels: z.array(ChannelConfig.schema),
});

type GuildBotConfig = z.infer<typeof GuildBotConfigSchema>;

const GuildBotConfig = {
  schema: GuildBotConfigSchema,
} as const;

export {
  type ChannelSummary as ChannelSummaryType,
  GuildBotConfig,
  type GuildBotConfig as GuildBotConfigType,
  GuildSummary,
  type GuildSummary as GuildSummaryType,
};
