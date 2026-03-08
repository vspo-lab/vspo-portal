import type { Result } from "@vspo-lab/error";
import { AppError, Err, Ok } from "@vspo-lab/error";

type DiscordTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

type DiscordApiUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

type DiscordApiGuild = {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
};

type ExchangeCodeParams = {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

/**
 * Discord OAuth2/REST API アクセス層
 * @precondition 有効な OAuth2 credentials が必要
 */
const DiscordApiRepository = {
  /** Authorization code をアクセストークンに交換する */
  exchangeCode: async (
    params: ExchangeCodeParams,
  ): Promise<Result<DiscordTokenResponse, AppError>> => {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: params.clientId,
      client_secret: params.clientSecret,
    });

    const res = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      return Err(
        new AppError({
          message: `Discord token exchange failed: ${res.status}`,
          code: "UNAUTHORIZED",
        }),
      );
    }

    const data = (await res.json()) as DiscordTokenResponse;
    return Ok(data);
  },

  /** リフレッシュトークンでアクセストークンを更新する */
  refreshToken: async (params: {
    refreshToken: string;
    clientId: string;
    clientSecret: string;
  }): Promise<Result<DiscordTokenResponse, AppError>> => {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: params.refreshToken,
      client_id: params.clientId,
      client_secret: params.clientSecret,
    });

    const res = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      return Err(
        new AppError({
          message: `Discord token refresh failed: ${res.status}`,
          code: "UNAUTHORIZED",
        }),
      );
    }

    const data = (await res.json()) as DiscordTokenResponse;
    return Ok(data);
  },

  /** ログインユーザー情報を取得する */
  getCurrentUser: async (
    accessToken: string,
  ): Promise<Result<DiscordApiUser, AppError>> => {
    const res = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return Err(
        new AppError({
          message: `Discord get user failed: ${res.status}`,
          code: "UNAUTHORIZED",
        }),
      );
    }

    const data = (await res.json()) as DiscordApiUser;
    return Ok(data);
  },

  /** ユーザーが参加しているサーバー一覧を取得する */
  getUserGuilds: async (
    accessToken: string,
  ): Promise<Result<DiscordApiGuild[], AppError>> => {
    const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return Err(
        new AppError({
          message: `Discord get guilds failed: ${res.status}`,
          code: "UNAUTHORIZED",
        }),
      );
    }

    const data = (await res.json()) as DiscordApiGuild[];
    return Ok(data);
  },
} as const;

export {
  DiscordApiRepository,
  type DiscordTokenResponse,
  type DiscordApiUser,
  type DiscordApiGuild,
};
