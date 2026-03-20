const ja = {
  // Common
  "app.name": "Spodule Bot",
  "app.title": "Spodule Bot Dashboard",

  // Login page
  "login.title": "Login",
  "login.description":
    "Easily manage Discord Bot stream notification settings from the web. View and edit language and member filters per channel at a glance.",
  "login.button": "Login with Discord",
  "login.feature.list": "List Management",
  "login.feature.list.desc": "View server and channel settings at a glance",
  "login.feature.filter": "Member Filter",
  "login.feature.filter.desc":
    "Fine-tune notification targets with JP, EN, or custom settings",
  "login.feature.realtime": "Instant Apply",
  "login.feature.realtime.desc":
    "Changes from the web are instantly applied to the Bot",

  // Dashboard
  "dashboard.servers": "Server List",
  "dashboard.servers.desc":
    "Manage settings for servers where the Bot is installed.",
  "dashboard.installed": "Bot Installed",
  "dashboard.notInstalled": "Bot Not Installed",
  "dashboard.noServers": "No servers with admin permissions.",
  "dashboard.allServers": "All Servers",
  "dashboard.channelsEnabled": "{enabled}/{total} channels enabled",
  "dashboard.error": "Error: {message}",

  // Guild
  "guild.serverTitle": "Server {guildId}",
  "guild.active": "Installed",
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
  "channel.table": "Channel Settings",

  // Channel config form
  "channelConfig.title": "Settings for #{channelName}",
  "channelConfig.language": "Language",
  "channelConfig.language.ja": "Japanese",
  "channelConfig.language.en": "English",
  "channelConfig.memberType": "Member Type",
  "channelConfig.customMembers": "Custom Members",
  "channelConfig.close": "Close",
  "channelConfig.cancel": "Cancel",
  "channelConfig.save": "Save",

  // Navigation
  "nav.sidebar": "Server Navigation",
  "nav.menu": "Menu",

  // Member types
  "memberType.vspo_jp": "VSPO JP",
  "memberType.vspo_en": "VSPO EN",
  "memberType.all": "All Members",
  "memberType.custom": "Custom",

  // Error
  "error.auth_failed": "Discord authentication failed. Please try again.",
  "error.no_code": "Authorization code not found. Please try again.",
  "error.fetch_failed":
    "Failed to retrieve user information. Please try again.",
  "error.invalid_state": "Invalid authentication request. Please try again.",

  // Auth
  "auth.logout": "Logout",
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
  "guild.active": "Active",
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
  "nav.sidebar": "Server Navigation",
  "nav.menu": "Menu",

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
