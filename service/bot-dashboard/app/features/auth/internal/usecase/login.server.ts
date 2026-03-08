import type { Result } from "@vspo-lab/error";
import { type AppError, Err, Ok } from "@vspo-lab/error";
import type { DiscordUserType } from "../domain/discord-user";
import { DiscordUser } from "../domain/discord-user";
import type { SessionType } from "../domain/session";
import { Session } from "../domain/session";
import { DiscordApiRepository } from "../repository/discord-api.server";
import { SessionStore } from "../repository/session-store.server";

type LoginEnv = {
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_REDIRECT_URI: string;
  SESSION_SECRET: string;
};

type LoginResult = {
  user: DiscordUserType;
  session: SessionType;
  setCookieHeader: string;
};

/**
 * Discord OAuth2 Authorization URL を生成する
 * @postcondition 有効な Discord OAuth2 URL を返す
 */
const buildAuthorizationUrl = (env: LoginEnv): string => {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
};

/**
 * OAuth2 コールバックを処理してセッションを作成する
 * @precondition 有効な authorization code が必要
 * @postcondition セッション cookie がセットされ、ユーザー情報が返る
 */
const handleCallback = async (
  code: string,
  env: LoginEnv,
): Promise<Result<LoginResult, AppError>> => {
  // 1. code → token
  const tokenResult = await DiscordApiRepository.exchangeCode({
    code,
    clientId: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    redirectUri: env.DISCORD_REDIRECT_URI,
  });
  if (tokenResult.err) return tokenResult;

  // 2. token → user info
  const userResult = await DiscordApiRepository.getCurrentUser(
    tokenResult.val.access_token,
  );
  if (userResult.err) return userResult;

  // 3. parse user
  const parsedUser = DiscordUser.fromApiResponse(userResult.val);
  if (parsedUser.err) return parsedUser;

  // 4. create session
  const session = Session.fromTokenResponse(parsedUser.val.id, tokenResult.val);
  const setCookieHeader = await SessionStore.create(
    session,
    env.SESSION_SECRET,
  );

  return Ok({ user: parsedUser.val, session, setCookieHeader });
};

export const LoginUsecase = {
  buildAuthorizationUrl,
  handleCallback,
} as const;
