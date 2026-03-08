import type { AppError, Result } from "@vspo-lab/error";
import { z } from "zod";
import { parseResult } from "~/features/shared";

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

  /** Discord API の guild オブジェクトから変換する */
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

  /** アイコン URL を生成する */
  iconUrl: (guild: GuildSummary): string | null =>
    guild.icon
      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
      : null,

  /** 管理可能なサーバーのみフィルタする */
  filterManageable: (guilds: readonly GuildSummary[]): GuildSummary[] =>
    guilds.filter((g) => g.isAdmin),

  /** Bot 導入済み / 未導入で分類する */
  partition: (
    guilds: readonly GuildSummary[],
  ): {
    installed: GuildSummary[];
    notInstalled: GuildSummary[];
  } => ({
    installed: guilds.filter((g) => g.botInstalled),
    notInstalled: guilds.filter((g) => !g.botInstalled),
  }),

  /** Bot 招待 URL を生成する */
  inviteUrl: (guild: GuildSummary, botClientId: string): string =>
    `https://discord.com/oauth2/authorize?client_id=${botClientId}&guild_id=${guild.id}&permissions=2048&scope=bot%20applications.commands`,
} as const;

const ChannelConfigInlineSchema = z.object({
  channelId: z.string(),
  channelName: z.string(),
  enabled: z.boolean(),
  language: z.string(),
  memberType: z.enum(["vspo_jp", "vspo_en", "all", "custom"]),
  customMembers: z.array(z.string()).optional(),
});

const GuildBotConfigSchema = z.object({
  guildId: z.string(),
  channels: z.array(ChannelConfigInlineSchema),
});

type GuildBotConfig = z.infer<typeof GuildBotConfigSchema>;

const GuildBotConfig = {
  schema: GuildBotConfigSchema,

  fromApiResponse: (raw: unknown): Result<GuildBotConfig, AppError> =>
    parseResult(GuildBotConfigSchema, raw),

  /** 有効チャンネル数を返す */
  enabledCount: (config: GuildBotConfig): number =>
    config.channels.filter((c) => c.enabled).length,
} as const;

export {
  GuildSummary,
  type GuildSummary as GuildSummaryType,
  GuildBotConfig,
  type GuildBotConfig as GuildBotConfigType,
};
