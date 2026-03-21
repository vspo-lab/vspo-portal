import { AppError, Err, Ok } from "@vspo-lab/error";
import { DiscordApiRepository } from "../repository/discord-api";
import { LoginUsecase } from "./login";

vi.mock("../repository/discord-api", () => ({
  DiscordApiRepository: {
    exchangeCode: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

const env = {
  DISCORD_CLIENT_ID: "test-client-id",
  DISCORD_CLIENT_SECRET: "test-secret",
  DISCORD_REDIRECT_URI: "https://example.com/callback",
};

describe("LoginUsecase", () => {
  describe("buildAuthorizationUrl", () => {
    it("returns a valid Discord OAuth2 URL", () => {
      const result = LoginUsecase.buildAuthorizationUrl(env);
      const url = new URL(result.url);
      expect(url.origin).toBe("https://discord.com");
      expect(url.pathname).toBe("/api/oauth2/authorize");
      expect(url.searchParams.get("client_id")).toBe("test-client-id");
      expect(url.searchParams.get("redirect_uri")).toBe(
        "https://example.com/callback",
      );
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("scope")).toBe("identify guilds");
    });

    it("returns a state value for CSRF protection", () => {
      const result = LoginUsecase.buildAuthorizationUrl(env);
      expect(result.state).toBeDefined();
      expect(result.state.length).toBeGreaterThan(0);
      // Should include state in URL
      const url = new URL(result.url);
      expect(url.searchParams.get("state")).toBe(result.state);
    });

    it("generates unique state per invocation", () => {
      const r1 = LoginUsecase.buildAuthorizationUrl(env);
      const r2 = LoginUsecase.buildAuthorizationUrl(env);
      expect(r1.state).not.toBe(r2.state);
    });
  });

  describe("handleCallback", () => {
    const tokenResponse = {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_in: 604800,
      token_type: "Bearer",
      scope: "identify guilds",
    };

    const apiUser = {
      id: "123",
      username: "testuser",
      global_name: "Test User",
      avatar: "abc123",
    };

    it("returns LoginResult on success", async () => {
      vi.mocked(DiscordApiRepository.exchangeCode).mockResolvedValue(
        Ok(tokenResponse),
      );
      vi.mocked(DiscordApiRepository.getCurrentUser).mockResolvedValue(
        Ok(apiUser),
      );

      const before = Date.now();
      const result = await LoginUsecase.handleCallback("auth-code", env);
      const after = Date.now();

      expect(result.err).toBeUndefined();
      expect(result.val).toBeDefined();
      expect(result.val?.user).toEqual({
        id: "123",
        username: "testuser",
        displayName: "Test User",
        avatar: "abc123",
      });
      expect(result.val?.accessToken).toBe("mock-access-token");
      expect(result.val?.refreshToken).toBe("mock-refresh-token");
      expect(result.val?.expiresAt).toBeGreaterThanOrEqual(
        before + 604800 * 1000,
      );
      expect(result.val?.expiresAt).toBeLessThanOrEqual(after + 604800 * 1000);

      expect(DiscordApiRepository.exchangeCode).toHaveBeenCalledWith({
        code: "auth-code",
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
        redirectUri: env.DISCORD_REDIRECT_URI,
      });
    });

    it("returns Err when token exchange fails", async () => {
      const error = new AppError({
        message: "token exchange failed",
        code: "UNAUTHORIZED",
      });
      vi.mocked(DiscordApiRepository.exchangeCode).mockResolvedValue(
        Err(error),
      );

      const result = await LoginUsecase.handleCallback("bad-code", env);

      expect(result.err).toBeDefined();
      expect(result.err).toBe(error);
      expect(DiscordApiRepository.getCurrentUser).not.toHaveBeenCalled();
    });

    it("returns Err when user fetch fails", async () => {
      vi.mocked(DiscordApiRepository.exchangeCode).mockResolvedValue(
        Ok(tokenResponse),
      );
      const error = new AppError({
        message: "user fetch failed",
        code: "UNAUTHORIZED",
      });
      vi.mocked(DiscordApiRepository.getCurrentUser).mockResolvedValue(
        Err(error),
      );

      const result = await LoginUsecase.handleCallback("code", env);

      expect(result.err).toBeDefined();
      expect(result.err).toBe(error);
    });
  });
});
