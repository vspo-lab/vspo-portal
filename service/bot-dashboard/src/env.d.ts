/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

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
  }
  interface Locals {
    user: SessionData["user"] | null;
    accessToken: string | null;
    locale: import("~/i18n/dict").Locale;
  }
}
