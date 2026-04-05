import { env } from "cloudflare:workers";
import type { GuildBotConfigType } from "~/features/guild/domain/guild";
import type { CreatorType } from "~/features/shared/domain/creator";
import type { ApplicationService } from "~/types/api";

/**
 * APP_WORKER の RPC が利用不可（ローカル開発）かを判定する。
 * DEV_MOCK_AUTH=true かつ開発モードの場合、または APP_WORKER に RPC メソッドがない場合に true。
 */
export const isRpcUnavailable = (appWorker: ApplicationService): boolean => {
  // In dev mode, use mocks by default. Set DEV_MOCK_AUTH=false to use real backend.
  if (import.meta.env.DEV) {
    const flag = (env as unknown as Record<string, unknown>).DEV_MOCK_AUTH;
    return flag !== "false";
  }
  if (!appWorker) return true;
  return typeof appWorker.newDiscordUsecase !== "function";
};

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

  creators: (): { jp: CreatorType[]; en: CreatorType[] } => ({
    jp: [
      {
        id: "creator-jp-001",
        name: "花芽すみれ",
        memberType: "vspo_jp" as const,
        thumbnailUrl: null,
      },
      {
        id: "creator-jp-002",
        name: "小雀とと",
        memberType: "vspo_jp" as const,
        thumbnailUrl: null,
      },
      {
        id: "creator-jp-003",
        name: "一ノ瀬うるは",
        memberType: "vspo_jp" as const,
        thumbnailUrl: null,
      },
      {
        id: "creator-jp-004",
        name: "胡桃のあ",
        memberType: "vspo_jp" as const,
        thumbnailUrl: null,
      },
      {
        id: "creator-jp-005",
        name: "紫宮るな",
        memberType: "vspo_jp" as const,
        thumbnailUrl: null,
      },
    ],
    en: [
      {
        id: "creator-en-001",
        name: "Arya Kuroha",
        memberType: "vspo_en" as const,
        thumbnailUrl: null,
      },
      {
        id: "creator-en-002",
        name: "Jira Jisaki",
        memberType: "vspo_en" as const,
        thumbnailUrl: null,
      },
      {
        id: "creator-en-003",
        name: "Remia Aotsuki",
        memberType: "vspo_en" as const,
        thumbnailUrl: null,
      },
      {
        id: "creator-en-004",
        name: "Komori Met",
        memberType: "vspo_en" as const,
        thumbnailUrl: null,
      },
      {
        id: "creator-en-005",
        name: "Renka Shinomiya",
        memberType: "vspo_en" as const,
        thumbnailUrl: null,
      },
    ],
  }),

  botGuildIds: new Set<string>([DEV_GUILD_ID]),

  botStats: { guildCount: 42, totalMemberCount: 1234 },

  userGuildAdmin: { [DEV_GUILD_ID]: true } as Record<string, boolean>,
} as const;
