import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";
import { z } from "zod";
import { DiscordUser, type DiscordUserType } from "../domain/discord-user";
import { DiscordApiRepository } from "../repository/discord-api";

const AuthUrlEnvSchema = z.object({
  DISCORD_CLIENT_ID: z.string(),
  DISCORD_REDIRECT_URI: z.string(),
});

type AuthUrlEnv = z.infer<typeof AuthUrlEnvSchema>;

const LoginEnvSchema = AuthUrlEnvSchema.extend({
  DISCORD_CLIENT_SECRET: z.string(),
});

type LoginEnv = z.infer<typeof LoginEnvSchema>;

const LoginResultSchema = z.object({
  user: z.custom<DiscordUserType>(),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
});

type LoginResult = z.infer<typeof LoginResultSchema>;

const AuthorizationUrlResultSchema = z.object({
  url: z.string(),
  state: z.string(),
});

type AuthorizationUrlResult = z.infer<typeof AuthorizationUrlResultSchema>;

/**
 * Generate a Discord OAuth2 Authorization URL
 * @postcondition Returns a valid Discord OAuth2 URL and a state value for CSRF protection
 */
const buildAuthorizationUrl = (env: AuthUrlEnv): AuthorizationUrlResult => {
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds",
    state,
  });
  return {
    url: `https://discord.com/api/oauth2/authorize?${params.toString()}`,
    state,
  };
};

/**
 * Handle the OAuth2 callback
 * @precondition A valid authorization code is required
 * @postcondition Returns user information and tokens. Session persistence is the caller's responsibility.
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
