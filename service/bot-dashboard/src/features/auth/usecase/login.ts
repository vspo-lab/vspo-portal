import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";
import { z } from "zod";
import type { ApplicationService } from "~/types/api";
import { DiscordUser, type DiscordUserType } from "../domain/discord-user";
import { PKCE } from "../domain/pkce";
import { DiscordOAuthRpcRepository } from "../repository/discord-oauth-rpc";

const AuthUrlEnvSchema = z.object({
  DISCORD_CLIENT_ID: z.string(),
  DISCORD_REDIRECT_URI: z.string(),
});

type AuthUrlEnv = z.infer<typeof AuthUrlEnvSchema>;

const LoginEnvSchema = z.object({
  DISCORD_REDIRECT_URI: z.string(),
});

type LoginEnv = z.infer<typeof LoginEnvSchema>;

const LoginResultSchema = z.object({
  user: z.custom<DiscordUserType>(),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
  locale: z.string().optional(),
});

type LoginResult = z.infer<typeof LoginResultSchema>;

const AuthorizationUrlResultSchema = z.object({
  url: z.string(),
  state: z.string(),
  codeVerifier: z.string(),
});

type AuthorizationUrlResult = z.infer<typeof AuthorizationUrlResultSchema>;

/**
 * Generates a Discord OAuth2 authorization URL with PKCE (S256).
 *
 * @param env - Discord OAuth2 client settings used to build the authorization URL
 * @returns Authorization URL parameters containing the redirect target, CSRF state, and PKCE code verifier
 * @precondition env.DISCORD_CLIENT_ID !== "" && env.DISCORD_REDIRECT_URI !== ""
 * @postcondition return.url contains return.state and a code_challenge derived from return.codeVerifier
 * @idempotent false - A new random state and code verifier are generated on every invocation
 */
const buildAuthorizationUrl = async (
  env: AuthUrlEnv,
): Promise<AuthorizationUrlResult> => {
  const state = crypto.randomUUID();
  const codeVerifier = PKCE.generateCodeVerifier();
  const codeChallenge = await PKCE.generateCodeChallenge(codeVerifier);
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return {
    url: `https://discord.com/api/oauth2/authorize?${params.toString()}`,
    state,
    codeVerifier,
  };
};

/**
 * Exchanges a Discord OAuth2 callback code for authenticated user data and tokens.
 *
 * @param code - Authorization code received from the Discord OAuth2 callback
 * @param env - Discord OAuth2 redirect URI used for token exchange
 * @param appWorker - APP_WORKER service binding used for RPC calls to vspo-server
 * @returns Parsed Discord user information together with access and refresh tokens, or an AppError
 * @precondition code !== "" && env.DISCORD_REDIRECT_URI !== "" && appWorker is configured
 * @postcondition On Ok, return.val.user is parsed from the Discord API response and return.val.expiresAt is later than the invocation time
 * @idempotent false - Discord authorization codes are single-use and repeated calls can fail or yield different tokens
 */
const handleCallback = async (
  code: string,
  env: LoginEnv,
  appWorker: ApplicationService,
  codeVerifier?: string,
): Promise<Result<LoginResult, AppError>> => {
  const tokenResult = await DiscordOAuthRpcRepository.exchangeCode(appWorker, {
    code,
    redirectUri: env.DISCORD_REDIRECT_URI,
    codeVerifier,
  });
  if (tokenResult.err) return tokenResult;

  const userResult = await DiscordOAuthRpcRepository.getCurrentUser(
    appWorker,
    tokenResult.val.access_token,
  );
  if (userResult.err) return userResult;

  const parsedUser = DiscordUser.fromApiResponse(userResult.val);
  if (parsedUser.err) return parsedUser;

  return Ok({
    user: parsedUser.val,
    accessToken: tokenResult.val.access_token,
    refreshToken: tokenResult.val.refresh_token,
    expiresAt:
      getCurrentUTCDate().getTime() + tokenResult.val.expires_in * 1000,
    locale: userResult.val.locale,
  });
};

export const LoginUsecase = {
  buildAuthorizationUrl,
  handleCallback,
} as const;
