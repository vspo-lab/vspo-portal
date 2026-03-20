import { env } from "cloudflare:workers";
import type { Result } from "@vspo-lab/error";
import { AppError, Err, Ok } from "@vspo-lab/error";
import { z } from "zod";
import { parseResult } from "~/features/shared/lib/parse";

const isDevMock = () =>
  (env as Record<string, unknown>).DEV_MOCK_AUTH === "true" &&
  import.meta.env.DEV;

const DiscordTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
  scope: z.string(),
});

type DiscordTokenResponse = z.infer<typeof DiscordTokenResponseSchema>;

const DiscordApiUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  global_name: z.string().nullable(),
  avatar: z.string().nullable(),
});

type DiscordApiUser = z.infer<typeof DiscordApiUserSchema>;

const DiscordApiGuildSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  permissions: z.string(),
});

type DiscordApiGuild = z.infer<typeof DiscordApiGuildSchema>;

const ExchangeCodeParamsSchema = z.object({
  code: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
});

type ExchangeCodeParams = z.infer<typeof ExchangeCodeParamsSchema>;

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

    return parseResult(DiscordTokenResponseSchema, await res.json());
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

    return parseResult(DiscordTokenResponseSchema, await res.json());
  },

  /** ログインユーザー情報を取得する */
  getCurrentUser: async (
    accessToken: string,
  ): Promise<Result<DiscordApiUser, AppError>> => {
    if (isDevMock()) {
      return Ok({
        id: "000000000000000000",
        username: "dev-user",
        global_name: "Dev User",
        avatar: null,
      });
    }

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

    return parseResult(DiscordApiUserSchema, await res.json());
  },

  /** ユーザーが参加しているサーバー一覧を取得する */
  getUserGuilds: async (
    accessToken: string,
  ): Promise<Result<DiscordApiGuild[], AppError>> => {
    if (isDevMock()) {
      return Ok([
        {
          id: "111111111111111111",
          name: "Dev Server 1",
          icon: null,
          permissions: "32",
        },
        {
          id: "222222222222222222",
          name: "Dev Server 2",
          icon: null,
          permissions: "32",
        },
      ]);
    }

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

    return parseResult(z.array(DiscordApiGuildSchema), await res.json());
  },
} as const;

export {
  DiscordApiRepository,
  type DiscordTokenResponse,
  type DiscordApiUser,
  type DiscordApiGuild,
};
