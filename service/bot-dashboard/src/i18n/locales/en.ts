import type { ja } from "./ja";

export const en: Record<keyof typeof ja, string> = {
  // Common
  "app.name": "Spodule Bot",
  "app.title": "Spodule Bot Dashboard",

  // Login page
  "login.title": "Login",
  "login.headline": "VSPO stream schedules,\nto Discord",
  "login.description": "",
  "login.button": "Log in to Dashboard with Discord",
  "login.addBot": "Add to Server",
  "login.previewCaption": "Preview",
  "login.previewAlt1": "Example notification for official VSPO member streams",
  "login.previewAlt2": "Example notification for individual member streams",
  "login.stat.servers": "Servers",
  "login.stat.users": "Total Users",
  "footer.poweredBy": "Powered by Spodule",
  "footer.schedule": "View stream schedules",
  "footer.terms": "Terms of Service",
  "footer.privacy": "Privacy Policy",
  "login.feature.list": "All servers, one screen",
  "login.feature.list.desc":
    "View and edit settings for all your servers in one place",
  "login.feature.filter": "Pick who to notify",
  "login.feature.filter.desc":
    "Filter by JP, EN, or select individual members per channel",
  "login.pageSettings": "Page settings",
  "login.features": "Dashboard",
  "login.features.desc":
    "No commands required. Set everything up in your browser.",
  "login.cta.headline": "Try it out",
  "login.cta.description": "Free to use. No slash commands needed.",
  "login.feature.realtime": "Browser only",
  "login.feature.realtime.desc":
    "All setup happens in your browser, no slash commands",
  "login.feature.settings": "Settings from the web",
  "login.feature.settings.desc":
    "Change notification channels and target members from the dashboard",
  "login.feature.close": "Close",
  "login.feature.imagePlaceholder": "Coming soon",

  // Getting Started
  "login.howto": "3 Easy Steps",
  "login.howto.desc": "Get started in minutes.",
  "login.howto.step1.title": "Add Bot to your server",
  "login.howto.step1.desc": "Invite the bot using the 'Add to Server' button.",
  "login.howto.step2.title": "Run /setting",
  "login.howto.step2.desc":
    "Execute /setting in Discord to configure your notification channel and language.",
  "login.howto.step3.title": "Receive schedules",
  "login.howto.step3.desc":
    "VSPO! member stream schedules are automatically sent to your channel.",

  // Command Section
  "login.command": "/setting Command",
  "login.command.desc":
    "A slash command to configure the bot directly from Discord.",
  "login.command.add.title": "Add Bot",
  "login.command.add.desc":
    "Add the bot to a channel and start receiving notifications.",
  "login.command.remove.title": "Remove Bot",
  "login.command.remove.desc":
    "Stop notifications and remove the bot from the channel.",
  "login.command.lang.title": "Language",
  "login.command.lang.desc":
    "Choose from 8 languages including English and Japanese.",
  "login.command.member.title": "Member Selection",
  "login.command.member.desc":
    "Filter notifications by JP, EN, All, or Custom members.",

  // Dashboard
  "dashboard.servers": "Servers",
  "dashboard.servers.desc":
    "Manage settings for servers where the Bot is installed.",
  "dashboard.installed": "Bot Installed",
  "dashboard.notInstalled": "Bot Not Installed",
  "dashboard.noServers": "No servers with admin permissions found.",
  "dashboard.allServers": "All Servers",
  "dashboard.channelsCount": "{total} channels configured",
  "dashboard.stat.channels": "Active Channels",
  "dashboard.error": "Error: {message}",

  // Guild
  "guild.serverTitle": "Server {guildId}",
  "guild.active": "Active",
  "guild.manageSettings": "Manage Settings",
  "guild.addBot": "Add Bot",

  // Channel table
  "channel.name": "Channel",
  "channel.language": "Language",
  "channel.members": "Members",
  "channel.status": "Status",
  "channel.status.active": "Active",
  "channel.status.paused": "Paused",
  "channel.actions": "Actions",
  "channel.edit": "Edit",
  "channel.delete": "Delete",
  "channel.add": "Add Channel",
  "channel.add.search": "Search by channel name",
  "channel.add.error": "Failed to fetch channels",
  "channel.add.registered": "Registered",
  "channel.add.empty": "No channels found",
  "channel.add.submit": "Add",
  "channel.add.cancel": "Cancel",
  "channel.empty": "No channels configured.",
  "channel.table": "Channel settings",
  "channel.deleteConfirm": "Delete #{channelName}?",
  "channel.deleteConfirm.desc":
    "This permanently deletes the Bot configuration for this channel.",
  "channel.deleteConfirm.cancel": "Cancel",
  "channel.deleteConfirm.submit": "Delete",

  // Channel config form
  "channelConfig.title": "#{channelName} Settings",
  "channelConfig.language": "Language",
  "channelConfig.language.ja": "Japanese",
  "channelConfig.language.en": "English",
  "channelConfig.language.fr": "French",
  "channelConfig.language.de": "German",
  "channelConfig.language.es": "Spanish",
  "channelConfig.language.cn": "Simplified Chinese",
  "channelConfig.language.tw": "Traditional Chinese",
  "channelConfig.language.ko": "Korean",
  "channelConfig.language.default": "Default",
  "channelConfig.language.unknown": "Not set",
  "channelConfig.memberType": "Member Type",
  "channelConfig.customMembers": "Custom Members",
  "channelConfig.reset": "Reset to Default",
  "channelConfig.reset.confirm": "Reset settings to default?",
  "channelConfig.members.search": "Search members",
  "channelConfig.members.selectAll": "Select All",
  "channelConfig.members.deselectAll": "Deselect All",
  "channelConfig.members.selected": "{count} selected",
  "channelConfig.members.jpGroup": "JP Members",
  "channelConfig.members.enGroup": "EN Members",
  "channelConfig.close": "Close",
  "channelConfig.cancel": "Cancel",
  "channelConfig.save": "Save",
  "channelConfig.diff.title": "Change Preview",
  "channelConfig.diff.language": "Language",
  "channelConfig.diff.memberType": "Members",
  "channelConfig.diff.customMembers": "Custom Members",

  // Navigation
  "nav.sidebar": "Server Navigation",
  "nav.menu": "Menu",
  "nav.skipToContent": "Skip to main content",
  "nav.channels": "Channel Settings",
  "nav.notifications": "Announcements",
  "nav.announcements": "Announcements",
  "nav.comingSoon": "Coming Soon",
  "nav.breadcrumb": "Breadcrumb",
  "nav.sidebarCollapse": "Toggle sidebar",
  "nav.contact": "Contact Us",
  "announcements.title": "Announcements",
  "announcements.empty": "No announcements",
  "announcements.type.info": "Info",
  "announcements.type.update": "Update",
  "announcements.type.maintenance": "Maintenance",

  // Member types
  "memberType.vspo_jp": "VSPO JP",
  "memberType.vspo_jp.desc": "Notify for JP member streams only",
  "memberType.vspo_en": "VSPO EN",
  "memberType.vspo_en.desc": "Notify for EN member streams only",
  "memberType.all": "All Members",
  "memberType.all.desc": "Notify for all member streams",
  "memberType.custom": "Custom",
  "memberType.custom.desc": "Select individual members",

  // Settings
  "settings.theme": "Theme",
  "settings.theme.toggle": "Toggle theme",
  "settings.theme.light": "Light",
  "settings.theme.dark": "Dark",
  "settings.theme.system": "System",
  "settings.language": "Language",
  "settings.language.ja": "Japanese",
  "settings.language.en": "English",

  // Error (404)
  "error.notFound.title": "Page not found",
  "error.notFound.back": "Back to Home",

  // Error
  "error.auth_failed": "Discord authentication failed. Please try again.",
  "error.no_code": "Authorization code not found. Please try again.",
  "error.fetch_failed": "Failed to fetch user information. Please try again.",
  "error.invalid_state": "Invalid authentication request. Please try again.",

  // Toast / feedback
  "toast.addSuccess": "Channel added.",
  "toast.updateSuccess": "Channel settings updated.",
  "toast.deleteSuccess": "Channel configuration deleted.",
  "toast.resetSuccess": "Settings reset to default.",
  "toast.error": "Operation failed.",
  "toast.dismiss": "Dismiss",
  "toast.retry": "Reload",

  // Auth
  "auth.logout": "Logout",

  // Meta descriptions
  "meta.login.description":
    "Discord notifications for VSPO streams. Set up from your browser, no commands needed.",
  "meta.dashboard.description":
    "Manage notification settings for your Discord servers.",
  "meta.guildDetail.description":
    "Manage notification channels for {guildName}.",
};
