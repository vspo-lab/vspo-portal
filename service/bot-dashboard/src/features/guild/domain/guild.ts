import { z } from "zod";
import { ChannelConfig } from "~/features/channel/domain/channel-config";

const MANAGE_GUILD = 0x20;

const GuildSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  isAdmin: z.boolean(),
  botInstalled: z.boolean(),
});

type GuildSummary = z.infer<typeof GuildSummarySchema>;

const GuildSummary = {
  schema: GuildSummarySchema,

  fromDiscordGuild: (
    raw: {
      id: string;
      name: string;
      icon: string | null;
      permissions: string;
    },
    botGuildIds: ReadonlySet<string>,
  ): GuildSummary => ({
    id: raw.id,
    name: raw.name,
    icon: raw.icon,
    isAdmin: (Number(raw.permissions) & MANAGE_GUILD) === MANAGE_GUILD,
    botInstalled: botGuildIds.has(raw.id),
  }),

  iconUrl: (guild: GuildSummary): string | null =>
    guild.icon
      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
      : null,

  filterManageable: (guilds: readonly GuildSummary[]): GuildSummary[] =>
    guilds.filter((g) => g.isAdmin),

  partition: (
    guilds: readonly GuildSummary[],
  ): {
    installed: GuildSummary[];
    notInstalled: GuildSummary[];
  } => ({
    installed: guilds.filter((g) => g.botInstalled),
    notInstalled: guilds.filter((g) => !g.botInstalled),
  }),

  inviteUrl: (guild: GuildSummary, botClientId: string): string =>
    `https://discord.com/oauth2/authorize?client_id=${botClientId}&guild_id=${guild.id}&permissions=2048&scope=bot%20applications.commands`,
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
  GuildBotConfig,
  type GuildBotConfig as GuildBotConfigType,
  GuildSummary,
  type GuildSummary as GuildSummaryType,
};
