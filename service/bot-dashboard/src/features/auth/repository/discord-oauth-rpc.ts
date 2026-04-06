import type { Result } from "@vspo-lab/error";
import { type AppError, Ok } from "@vspo-lab/error";
import { devMock, isRpcUnavailable } from "~/features/shared/dev-mock";
import type { ApplicationService } from "~/types/api";

type OAuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

type OAuthUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  locale?: string;
};

type OAuthGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

/**
 * Discord OAuth2 API access layer via vspo-server RPC.
 * @precondition APP_WORKER Service Binding must be configured (except in dev-mock mode)
 */
const DiscordOAuthRpcRepository = {
  /** Exchange an authorization code for tokens via RPC. */
  exchangeCode: async (
    appWorker: ApplicationService,
    params: { code: string; redirectUri: string; codeVerifier?: string },
  ): Promise<Result<OAuthTokenResponse, AppError>> => {
    if (isRpcUnavailable(appWorker)) {
      return Ok(devMock.oauthToken);
    }
    const discord = appWorker.newDiscordUsecase();
    return discord.exchangeOAuthCode(params);
  },

  /** Refresh an access token via RPC. */
  refreshToken: async (
    appWorker: ApplicationService,
    refreshToken: string,
  ): Promise<Result<OAuthTokenResponse, AppError>> => {
    if (isRpcUnavailable(appWorker)) {
      return Ok(devMock.oauthToken);
    }
    const discord = appWorker.newDiscordUsecase();
    return discord.refreshOAuthToken(refreshToken);
  },

  /** Retrieve the currently logged-in user's information via RPC. */
  getCurrentUser: async (
    appWorker: ApplicationService,
    accessToken: string,
  ): Promise<Result<OAuthUser, AppError>> => {
    if (isRpcUnavailable(appWorker)) {
      return Ok(devMock.oauthUser);
    }
    const discord = appWorker.newDiscordUsecase();
    return discord.getOAuthUser(accessToken);
  },

  /** Retrieve the list of servers the user belongs to via RPC. */
  getUserGuilds: async (
    appWorker: ApplicationService,
    accessToken: string,
  ): Promise<Result<OAuthGuild[], AppError>> => {
    if (isRpcUnavailable(appWorker)) {
      return Ok([...devMock.oauthUserGuilds]);
    }
    const discord = appWorker.newDiscordUsecase();
    return discord.getOAuthUserGuilds(accessToken);
  },
} as const;

export {
  DiscordOAuthRpcRepository,
  type OAuthGuild,
  type OAuthTokenResponse,
  type OAuthUser,
};
