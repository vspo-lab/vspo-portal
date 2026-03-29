const ja = {
  // Common
  "app.name": "Spodule Bot",
  "app.title": "Spodule Bot ダッシュボード",

  // Login page
  "login.title": "ログイン",
  "login.headline": "すぽじゅーる Bot をサーバーに追加",
  "login.description":
    "ぶいすぽっ!メンバーの配信予定を Discord に自動で届けます",
  "login.button": "Discord でログイン",
  "login.addBot": "サーバーに追加する",
  "login.manageSettings": "通知設定を管理する",
  "login.previewCaption": "配信予定を、こんな感じで通知します",
  "login.permissions_note": "サーバー一覧の読み取り権限のみ使用します",
  "login.footer": "vspo-schedule.com",
  "login.feature.list": "まとめて管理",
  "login.feature.list.desc": "複数サーバーの設定をひとつの画面で確認・変更",
  "login.feature.filter": "通知対象を選べる",
  "login.feature.filter.desc":
    "チャンネルごとに JP / EN メンバーやカスタム選択で絞り込み",
  "login.pageSettings": "ページ設定",
  "login.features": "機能紹介",
  "login.feature.realtime": "コマンド入力なし",
  "login.feature.realtime.desc":
    "ブラウザ操作だけで完了。スラッシュコマンドは使いません",

  // Dashboard
  "dashboard.servers": "サーバー一覧",
  "dashboard.servers.desc": "Bot が導入されているサーバーの設定を管理します。",
  "dashboard.installed": "Bot 導入済み",
  "dashboard.notInstalled": "Bot 未導入",
  "dashboard.noServers": "管理者権限を持つサーバーがありません。",
  "dashboard.allServers": "すべてのサーバー",
  "dashboard.channelsEnabled": "{enabled}/{total} チャンネル有効",
  "dashboard.error": "エラー: {message}",

  // Guild
  "guild.serverTitle": "サーバー {guildId}",
  "guild.active": "導入済み",
  "guild.manageSettings": "設定を管理",
  "guild.addBot": "Bot を追加",
  "guild.channelSummary": "{enabled}/{total} チャンネル有効",

  // Channel table
  "channel.name": "チャンネル",
  "channel.enabled": "有効",
  "channel.language": "言語",
  "channel.members": "メンバー",
  "channel.actions": "操作",
  "channel.disable": "無効化",
  "channel.enable": "有効化",
  "channel.edit": "編集",
  "channel.delete": "削除",
  "channel.add": "チャンネルを追加",
  "channel.add.search": "チャンネル名で検索",
  "channel.add.registered": "登録済み",
  "channel.add.empty": "チャンネルが見つかりません",
  "channel.add.submit": "追加する",
  "channel.add.cancel": "キャンセル",
  "channel.empty": "設定済みのチャンネルがありません。",
  "channel.table": "チャンネル設定",
  "channel.deleteConfirm": "#{channelName} を削除しますか？",
  "channel.deleteConfirm.desc":
    "この操作は取り消せません。このチャンネルの Bot 設定が完全に削除されます。",
  "channel.deleteConfirm.cancel": "キャンセル",
  "channel.deleteConfirm.submit": "削除する",

  // Channel config form
  "channelConfig.title": "#{channelName} の設定",
  "channelConfig.language": "言語",
  "channelConfig.language.ja": "日本語",
  "channelConfig.language.en": "英語",
  "channelConfig.language.unknown": "未設定",
  "channelConfig.memberType": "メンバータイプ",
  "channelConfig.customMembers": "カスタムメンバー",
  "channelConfig.close": "閉じる",
  "channelConfig.cancel": "キャンセル",
  "channelConfig.save": "保存",

  // Navigation
  "nav.sidebar": "サーバーナビゲーション",
  "nav.menu": "メニュー",
  "nav.skipToContent": "メインコンテンツへスキップ",

  // Member types
  "memberType.vspo_jp": "VSPO JP",
  "memberType.vspo_en": "VSPO EN",
  "memberType.all": "全メンバー",
  "memberType.custom": "カスタム",

  // Settings
  "settings.theme": "テーマ",
  "settings.theme.toggle": "テーマ切替",
  "settings.theme.light": "ライト",
  "settings.theme.dark": "ダーク",
  "settings.theme.system": "システム",
  "settings.language": "言語",
  "settings.language.ja": "日本語",
  "settings.language.en": "English",

  // Error
  "error.auth_failed": "Discord 認証に失敗しました。もう一度お試しください。",
  "error.no_code": "認証コードが見つかりません。もう一度お試しください。",
  "error.fetch_failed":
    "ユーザー情報の取得に失敗しました。もう一度お試しください。",
  "error.invalid_state": "無効な認証リクエストです。もう一度お試しください。",

  // Toast / feedback
  "toast.addSuccess": "チャンネルを追加しました。",
  "toast.updateSuccess": "チャンネル設定を更新しました。",
  "toast.toggleSuccess": "チャンネルの有効/無効を切り替えました。",
  "toast.deleteSuccess": "チャンネル設定を削除しました。",
  "toast.dismiss": "閉じる",
  "toast.retry": "再読み込み",

  // Auth
  "auth.logout": "ログアウト",
} as const;

const en: Record<keyof typeof ja, string> = {
  // Common
  "app.name": "Spodule Bot",
  "app.title": "Spodule Bot Dashboard",

  // Login page
  "login.title": "Login",
  "login.headline": "Add Spodule Bot to your server",
  "login.description":
    "Get automatic Discord notifications for VSPO member streams",
  "login.button": "Login with Discord",
  "login.addBot": "Add to Server",
  "login.manageSettings": "Manage notification settings",
  "login.previewCaption": "Here's what notifications look like",
  "login.permissions_note": "Only requests read access to your server list",
  "login.footer": "vspo-schedule.com",
  "login.feature.list": "All servers, one screen",
  "login.feature.list.desc":
    "Check and change settings across servers without switching",
  "login.feature.filter": "Pick who to notify",
  "login.feature.filter.desc":
    "Filter by JP, EN, or select individual members per channel",
  "login.pageSettings": "Page settings",
  "login.features": "Features",
  "login.feature.realtime": "No commands needed",
  "login.feature.realtime.desc":
    "Everything works from the browser. No slash commands involved",

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
  "guild.channelSummary": "{enabled}/{total} channels active",

  // Channel table
  "channel.name": "Channel",
  "channel.enabled": "Enabled",
  "channel.language": "Language",
  "channel.members": "Members",
  "channel.actions": "Actions",
  "channel.disable": "Disable",
  "channel.enable": "Enable",
  "channel.edit": "Edit",
  "channel.delete": "Delete",
  "channel.add": "Add Channel",
  "channel.add.search": "Search by channel name",
  "channel.add.registered": "Registered",
  "channel.add.empty": "No channels found",
  "channel.add.submit": "Add",
  "channel.add.cancel": "Cancel",
  "channel.empty": "No channels configured.",
  "channel.table": "Channel settings",
  "channel.deleteConfirm": "Delete #{channelName}?",
  "channel.deleteConfirm.desc":
    "This action cannot be undone. The Bot configuration for this channel will be permanently removed.",
  "channel.deleteConfirm.cancel": "Cancel",
  "channel.deleteConfirm.submit": "Delete",

  // Channel config form
  "channelConfig.title": "#{channelName} Settings",
  "channelConfig.language": "Language",
  "channelConfig.language.ja": "Japanese",
  "channelConfig.language.en": "English",
  "channelConfig.language.unknown": "Not set",
  "channelConfig.memberType": "Member Type",
  "channelConfig.customMembers": "Custom Members",
  "channelConfig.close": "Close",
  "channelConfig.cancel": "Cancel",
  "channelConfig.save": "Save",

  // Navigation
  "nav.sidebar": "Server Navigation",
  "nav.menu": "Menu",
  "nav.skipToContent": "Skip to main content",

  // Member types
  "memberType.vspo_jp": "VSPO JP",
  "memberType.vspo_en": "VSPO EN",
  "memberType.all": "All Members",
  "memberType.custom": "Custom",

  // Settings
  "settings.theme": "Theme",
  "settings.theme.toggle": "Toggle theme",
  "settings.theme.light": "Light",
  "settings.theme.dark": "Dark",
  "settings.theme.system": "System",
  "settings.language": "Language",
  "settings.language.ja": "Japanese",
  "settings.language.en": "English",

  // Error
  "error.auth_failed": "Discord authentication failed. Please try again.",
  "error.no_code": "Authorization code not found. Please try again.",
  "error.fetch_failed": "Failed to fetch user information. Please try again.",
  "error.invalid_state": "Invalid authentication request. Please try again.",

  // Toast / feedback
  "toast.addSuccess": "Channel added successfully.",
  "toast.updateSuccess": "Channel settings updated.",
  "toast.toggleSuccess": "Channel toggled successfully.",
  "toast.deleteSuccess": "Channel configuration deleted.",
  "toast.dismiss": "Dismiss",
  "toast.retry": "Reload",

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

const languageDisplayKeys: Record<string, TranslationKey> = {
  ja: "channelConfig.language.ja",
  en: "channelConfig.language.en",
};

/** Map a language code to its translation key, falling back to "unknown". */
export const languageDisplayKey = (langCode: string): TranslationKey =>
  languageDisplayKeys[langCode] ?? "channelConfig.language.unknown";
