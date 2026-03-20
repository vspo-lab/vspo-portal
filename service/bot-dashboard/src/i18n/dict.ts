const ja = {
  // Common
  "app.name": "すぽじゅーる Bot",
  "app.title": "すぽじゅーる Bot ダッシュボード",

  // Login page
  "login.title": "ログイン",
  "login.description":
    "Discord Bot の配信通知設定を Web から簡単に管理できます。チャンネルごとの言語やメンバーフィルターをひと目で確認・変更。",
  "login.button": "Discord でログイン",
  "login.feature.list": "一覧管理",
  "login.feature.list.desc": "サーバーとチャンネルの設定をひと目で確認",
  "login.feature.filter": "メンバーフィルター",
  "login.feature.filter.desc": "JP・EN・カスタムで通知対象を細かく設定",
  "login.feature.realtime": "即座に反映",
  "login.feature.realtime.desc": "Web から変更するだけで Bot に即座に反映",

  // Dashboard
  "dashboard.servers": "サーバー一覧",
  "dashboard.servers.desc":
    "Bot が導入されているサーバーの設定を管理できます。",
  "dashboard.installed": "Bot 導入済み",
  "dashboard.notInstalled": "Bot 未導入",
  "dashboard.noServers": "管理権限を持つサーバーがありません。",
  "dashboard.allServers": "全サーバー",
  "dashboard.channelsEnabled": "{enabled}/{total} チャンネルで有効",
  "dashboard.error": "エラー: {message}",

  // Guild
  "guild.serverTitle": "サーバー {guildId}",
  "guild.manageSettings": "設定を管理",
  "guild.addBot": "Bot を追加",

  // Channel table
  "channel.name": "チャンネル",
  "channel.enabled": "有効",
  "channel.language": "言語",
  "channel.members": "メンバー",
  "channel.actions": "操作",
  "channel.disable": "無効化",
  "channel.enable": "有効化",
  "channel.edit": "編集",
  "channel.empty": "設定されたチャンネルがありません。",
  "channel.table": "チャンネル設定一覧",

  // Channel config form
  "channelConfig.title": "#{channelName} の設定",
  "channelConfig.language": "言語",
  "channelConfig.language.ja": "日本語",
  "channelConfig.language.en": "English",
  "channelConfig.memberType": "メンバータイプ",
  "channelConfig.customMembers": "カスタムメンバー",
  "channelConfig.close": "閉じる",
  "channelConfig.cancel": "キャンセル",
  "channelConfig.save": "保存",

  // Navigation
  "nav.sidebar": "サーバーナビゲーション",

  // Member types
  "memberType.vspo_jp": "VSPO JP",
  "memberType.vspo_en": "VSPO EN",
  "memberType.all": "All Members",
  "memberType.custom": "Custom",

  // Error
  "error.auth_failed": "Discord 認証に失敗しました。もう一度お試しください。",
  "error.no_code": "認証コードが見つかりませんでした。もう一度お試しください。",
  "error.fetch_failed":
    "ユーザー情報の取得に失敗しました。もう一度お試しください。",
  "error.invalid_state":
    "認証リクエストが無効です。もう一度お試しください。",

  // Auth
  "auth.logout": "ログアウト",
} as const;

const en: Record<keyof typeof ja, string> = {
  // Common
  "app.name": "Spodule Bot",
  "app.title": "Spodule Bot Dashboard",

  // Login page
  "login.title": "Login",
  "login.description":
    "Easily manage your Discord Bot's stream notification settings from the web. View and update language and member filters per channel at a glance.",
  "login.button": "Login with Discord",
  "login.feature.list": "List Management",
  "login.feature.list.desc": "View server and channel settings at a glance",
  "login.feature.filter": "Member Filters",
  "login.feature.filter.desc":
    "Fine-tune notification targets with JP, EN, or custom filters",
  "login.feature.realtime": "Instant Updates",
  "login.feature.realtime.desc": "Changes take effect immediately on the Bot",

  // Dashboard
  "dashboard.servers": "Servers",
  "dashboard.servers.desc":
    "Manage settings for servers where the Bot is installed.",
  "dashboard.installed": "Bot Installed",
  "dashboard.notInstalled": "Bot Not Installed",
  "dashboard.noServers": "No servers with admin permissions found.",
  "dashboard.allServers": "All Servers",
  "dashboard.channelsEnabled": "{enabled}/{total} channels enabled",
  "dashboard.error": "Error: {message}",

  // Guild
  "guild.serverTitle": "Server {guildId}",
  "guild.manageSettings": "Manage Settings",
  "guild.addBot": "Add Bot",

  // Channel table
  "channel.name": "Channel",
  "channel.enabled": "Enabled",
  "channel.language": "Language",
  "channel.members": "Members",
  "channel.actions": "Actions",
  "channel.disable": "Disable",
  "channel.enable": "Enable",
  "channel.edit": "Edit",
  "channel.empty": "No channels configured.",
  "channel.table": "Channel settings",

  // Channel config form
  "channelConfig.title": "#{channelName} Settings",
  "channelConfig.language": "Language",
  "channelConfig.language.ja": "Japanese",
  "channelConfig.language.en": "English",
  "channelConfig.memberType": "Member Type",
  "channelConfig.customMembers": "Custom Members",
  "channelConfig.close": "Close",
  "channelConfig.cancel": "Cancel",
  "channelConfig.save": "Save",

  // Navigation
  "nav.sidebar": "Servers navigation",

  // Member types
  "memberType.vspo_jp": "VSPO JP",
  "memberType.vspo_en": "VSPO EN",
  "memberType.all": "All Members",
  "memberType.custom": "Custom",

  // Error
  "error.auth_failed": "Discord authentication failed. Please try again.",
  "error.no_code": "Authorization code not found. Please try again.",
  "error.fetch_failed": "Failed to fetch user information. Please try again.",
  "error.invalid_state": "Invalid authentication request. Please try again.",

  // Auth
  "auth.logout": "Logout",
};

export type Locale = "ja" | "en";
export type TranslationKey = keyof typeof ja;
type MemberTypeKey = Extract<TranslationKey, `memberType.${string}`>;

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  ja,
  en,
};

/**
 * Translate a key to the given locale, with optional interpolation.
 * @example t("ja", "dashboard.channelsEnabled", { enabled: "3", total: "5" })
 */
export const t = (
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string>,
): string => {
  let value = dictionaries[locale][key] ?? dictionaries.ja[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replaceAll(`{${k}}`, v);
    }
  }
  return value;
};

/** Type-safe key for member type translation lookup */
const memberTypeKeys = {
  vspo_jp: "memberType.vspo_jp",
  vspo_en: "memberType.vspo_en",
  all: "memberType.all",
  custom: "memberType.custom",
} as const satisfies Record<
  import("~/features/channel/domain/member-type").MemberTypeValue,
  MemberTypeKey
>;

export const memberTypeKey = (
  value: import("~/features/channel/domain/member-type").MemberTypeValue,
): MemberTypeKey => memberTypeKeys[value];
