/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    APP_WORKER: import("~/types/api").ApplicationService;
    DISCORD_CLIENT_ID: string;
    DISCORD_BOT_CLIENT_ID: string;
    DISCORD_CLIENT_SECRET: string;
    DISCORD_REDIRECT_URI: string;
  }
}

declare namespace App {
  interface SessionData {
    /** Spec deviation: displayName, refreshToken, expiresAt added to support token refresh and display name */
    user: {
      id: string;
      username: string;
      displayName: string;
      avatar: string | null;
    };
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    oauth_state: string;
    locale: import("~/i18n/dict").Locale;
    /** Cached guild summaries to avoid re-fetching on guild detail pages */
    guildSummaries: Array<{
      id: string;
      name: string;
      icon: string | null;
      botInstalled: boolean;
    }>;
  }
  interface Locals {
    user: SessionData["user"] | null;
    accessToken: string | null;
    locale: import("~/i18n/dict").Locale;
  }
}
