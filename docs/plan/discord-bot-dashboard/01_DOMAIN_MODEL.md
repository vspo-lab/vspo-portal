# Discord Bot Dashboard - Domain Model

## Overview

ダッシュボードで扱うドメインモデルを定義する。
各モデルは **Zod Schema + Companion Object** パターンで実装する。

### 設計原則

- `class` は使わない。Zod Schema から `z.infer` で型を導出する
- 関連ロジックは同名の Companion Object (const) にまとめる
- Companion Object は純粋関数のみ (副作用なし)
- 外部データのパースは `wrap(() => schema.parse(raw))` で Result 型に変換
- domain 層は外部依存を持たない (Zod + @vspo-lab/error のみ)

## Entities

### DiscordUser (認証済みユーザー) — `features/auth/internal/domain/`

```typescript
// discord-user.ts
const DiscordUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatar: z.string().nullable(),
});
type DiscordUser = z.infer<typeof DiscordUserSchema>;

const DiscordUser = {
  schema: DiscordUserSchema,
  /** Discord API レスポンスからパースする */
  fromApiResponse: (raw: unknown): Result<DiscordUser, AppError> =>
    wrap(() => DiscordUserSchema.parse(raw)),
  /** アバター URL を生成する */
  avatarUrl: (user: DiscordUser): string | null =>
    user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : null,
} as const;
```

### Session — `features/auth/internal/domain/`

```typescript
// session.ts
const SessionSchema = z.object({
  userId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
});
type Session = z.infer<typeof SessionSchema>;

const Session = {
  schema: SessionSchema,
  /** セッションが有効期限内か判定する */
  isExpired: (session: Session): boolean =>
    Date.now() > session.expiresAt,
  /** リフレッシュが必要か判定する (有効期限5分前) */
  needsRefresh: (session: Session): boolean =>
    Date.now() > session.expiresAt - 5 * 60 * 1000,
} as const;
```

### GuildSummary (サーバー概要) — `features/guild/internal/domain/`

```typescript
// guild.ts
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
  fromDiscordGuild: (raw: {
    id: string; name: string; icon: string | null; permissions: string;
  }, botGuildIds: ReadonlySet<string>): GuildSummary => ({
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
    guilds.filter(g => g.isAdmin),
  /** Bot 導入済み / 未導入で分類する */
  partition: (guilds: readonly GuildSummary[]): {
    installed: GuildSummary[];
    notInstalled: GuildSummary[];
  } => ({
    installed: guilds.filter(g => g.botInstalled),
    notInstalled: guilds.filter(g => !g.botInstalled),
  }),
  /** Bot 招待 URL を生成する */
  inviteUrl: (guild: GuildSummary, botClientId: string): string =>
    `https://discord.com/oauth2/authorize?client_id=${botClientId}&guild_id=${guild.id}&permissions=2048&scope=bot%20applications.commands`,
} as const;
```

### GuildBotConfig (サーバーの Bot 設定) — `features/guild/internal/domain/`

```typescript
// guild-bot-config.ts
const GuildBotConfigSchema = z.object({
  guildId: z.string(),
  channels: z.array(ChannelConfigSchema),
});
type GuildBotConfig = z.infer<typeof GuildBotConfigSchema>;

const GuildBotConfig = {
  schema: GuildBotConfigSchema,
  fromApiResponse: (raw: unknown): Result<GuildBotConfig, AppError> =>
    wrap(() => GuildBotConfigSchema.parse(raw)),
  /** 有効チャンネル数を返す */
  enabledCount: (config: GuildBotConfig): number =>
    config.channels.filter(c => c.enabled).length,
} as const;
```

### ChannelConfig (チャンネル設定) — `features/channel/internal/domain/`

```typescript
// member-type.ts
const MemberTypeSchema = z.enum(["vspo_jp", "vspo_en", "all", "custom"]);
type MemberType = z.infer<typeof MemberTypeSchema>;

const MemberType = {
  schema: MemberTypeSchema,
  /** 表示ラベルを返す */
  label: (mt: MemberType): string => ({
    vspo_jp: "VSPO JP",
    vspo_en: "VSPO EN",
    all: "All Members",
    custom: "Custom",
  })[mt],
  /** カスタムメンバー選択が必要か */
  requiresCustomSelection: (mt: MemberType): boolean => mt === "custom",
} as const;

// channel-config.ts
const ChannelConfigSchema = z.object({
  channelId: z.string(),
  channelName: z.string(),
  enabled: z.boolean(),
  language: z.string(),
  memberType: MemberTypeSchema,
  customMembers: z.array(z.string()).optional(),
});
type ChannelConfig = z.infer<typeof ChannelConfigSchema>;

const ChannelConfig = {
  schema: ChannelConfigSchema,
  fromApiResponse: (raw: unknown): Result<ChannelConfig, AppError> =>
    wrap(() => ChannelConfigSchema.parse(raw)),
  /** デフォルト設定を生成する */
  defaultFor: (channelId: string, channelName: string): ChannelConfig => ({
    channelId,
    channelName,
    enabled: true,
    language: "ja",
    memberType: "all",
    customMembers: undefined,
  }),
  /** FormData からバリデーション付きで変換する */
  fromFormData: (formData: FormData): Result<Partial<ChannelConfig>, AppError> =>
    wrap(() => ChannelConfigSchema.partial().parse({
      language: formData.get("language"),
      memberType: formData.get("memberType"),
      customMembers: JSON.parse(formData.get("customMembers") as string || "[]"),
    })),
} as const;
```

### Creator (メンバーマスタ - 読み取り専用) — `features/shared/internal/domain/`

```typescript
// creator.ts
const CreatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  memberType: z.enum(["vspo_jp", "vspo_en"]),
  thumbnailUrl: z.string().nullable(),
});
type Creator = z.infer<typeof CreatorSchema>;

const Creator = {
  schema: CreatorSchema,
  fromApiResponse: (raw: unknown): Result<Creator[], AppError> =>
    wrap(() => z.array(CreatorSchema).parse(raw)),
  /** メンバータイプでフィルタする */
  filterByType: (creators: readonly Creator[], type: "vspo_jp" | "vspo_en"): Creator[] =>
    creators.filter(c => c.memberType === type),
  /** ID セットに含まれるかでフィルタする */
  filterByIds: (creators: readonly Creator[], ids: ReadonlySet<string>): Creator[] =>
    creators.filter(c => ids.has(c.id)),
} as const;
```

## Business Rules

1. **管理権限チェック**: `MANAGE_GUILD` パーミッションを持つユーザーのみ設定変更可能 → `GuildSummary.filterManageable`
2. **Bot 導入済みチェック**: Bot が参加しているサーバーのみ設定変更可能 → `GuildSummary.partition`
3. **カスタムメンバー制約**: `memberType` が `"custom"` の場合のみ `customMembers` が有効 → `MemberType.requiresCustomSelection`
4. **言語選択肢**: vspo-server が対応する言語のみ選択可能 (ja, en, etc.)
5. **チャンネル種別**: テキストチャンネルのみ Bot 設定可能 (ボイスチャンネル等は除外)
6. **セッション管理**: 有効期限切れの自動検知 + リフレッシュ → `Session.isExpired`, `Session.needsRefresh`
