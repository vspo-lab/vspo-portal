import { env } from "cloudflare:workers";
import type { GuildBotConfigType } from "~/features/guild/domain/guild";
import type { ApplicationService } from "~/types/api";

/**
 * APP_WORKER の RPC が利用不可（ローカル開発）かを判定する。
 * DEV_MOCK_AUTH=true かつ開発モードの場合、または APP_WORKER に RPC メソッドがない場合に true。
 */
export const isRpcUnavailable = (appWorker: ApplicationService): boolean =>
  ((env as unknown as Record<string, unknown>).DEV_MOCK_AUTH === "true" &&
    import.meta.env.DEV) ||
  !appWorker ||
  typeof appWorker.newDiscordUsecase !== "function";

const DEV_GUILD_ID = "111111111111111111";

/** ローカル開発用のモックデータ。APP_WORKER が利用不可な場合に使用する。 */
export const devMock = {
  guildConfig: (guildId: string): GuildBotConfigType => ({
    guildId,
    channels:
      guildId === DEV_GUILD_ID
        ? [
            {
              channelId: "ch-001",
              channelName: "vspo-notifications",
              enabled: true,
              language: "ja",
              memberType: "all" as const,
              customMembers: undefined,
            },
            {
              channelId: "ch-002",
              channelName: "schedule-en",
              enabled: true,
              language: "en",
              memberType: "vspo_en" as const,
              customMembers: undefined,
            },
            {
              channelId: "ch-003",
              channelName: "archives",
              enabled: false,
              language: "ja",
              memberType: "vspo_jp" as const,
              customMembers: undefined,
            },
          ]
        : [],
  }),

  guildChannels: (guildId: string): { id: string; name: string }[] =>
    guildId === DEV_GUILD_ID
      ? [
          { id: "ch-001", name: "vspo-notifications" },
          { id: "ch-002", name: "schedule-en" },
          { id: "ch-003", name: "archives" },
          { id: "ch-mock-1", name: "general" },
          { id: "ch-mock-2", name: "random" },
        ]
      : [],

  botGuildIds: new Set<string>([DEV_GUILD_ID]),
} as const;
