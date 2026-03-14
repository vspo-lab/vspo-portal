import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";
import type { DiscordUserType } from "../domain/discord-user";
import { DiscordUser } from "../domain/discord-user";
import { DiscordApiRepository } from "../repository/discord-api";

type AuthUrlEnv = {
  DISCORD_CLIENT_ID: string;
  DISCORD_REDIRECT_URI: string;
};

type LoginEnv = AuthUrlEnv & {
  DISCORD_CLIENT_SECRET: string;
};

type LoginResult = {
  user: DiscordUserType;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

/**
 * Discord OAuth2 Authorization URL を生成する
 * @postcondition 有効な Discord OAuth2 URL を返す
 */
const buildAuthorizationUrl = (env: AuthUrlEnv): string => {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
};

/**
 * OAuth2 コールバックを処理する
 * @precondition 有効な authorization code が必要
 * @postcondition ユーザー情報とトークンを返す。セッション保存は呼び出し側が行う。
 */
const handleCallback = async (
  code: string,
  env: LoginEnv,
): Promise<Result<LoginResult, AppError>> => {
  const tokenResult = await DiscordApiRepository.exchangeCode({
    code,
    clientId: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    redirectUri: env.DISCORD_REDIRECT_URI,
  });
  if (tokenResult.err) return tokenResult;

  const userResult = await DiscordApiRepository.getCurrentUser(
    tokenResult.val.access_token,
  );
  if (userResult.err) return userResult;

  const parsedUser = DiscordUser.fromApiResponse(userResult.val);
  if (parsedUser.err) return parsedUser;

  return Ok({
    user: parsedUser.val,
    accessToken: tokenResult.val.access_token,
    refreshToken: tokenResult.val.refresh_token,
    expiresAt: Date.now() + tokenResult.val.expires_in * 1000,
  });
};

export const LoginUsecase = {
  buildAuthorizationUrl,
  handleCallback,
} as const;
