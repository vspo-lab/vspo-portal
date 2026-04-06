import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import { AppError, Err, Ok } from "@vspo-lab/error";
import type { ApplicationService } from "~/types/api";
import { LoginUsecase } from "./login";

const createMockAppWorker = (overrides?: {
  exchangeOAuthCode?: ReturnType<typeof vi.fn>;
  getOAuthUser?: ReturnType<typeof vi.fn>;
}) =>
  ({
    newDiscordUsecase: () => ({
      exchangeOAuthCode:
        overrides?.exchangeOAuthCode ??
        vi.fn().mockResolvedValue(
          Ok({
            access_token: "mock-access",
            refresh_token: "mock-refresh",
            expires_in: 604800,
            token_type: "Bearer",
            scope: "identify guilds",
          }),
        ),
      getOAuthUser:
        overrides?.getOAuthUser ??
        vi.fn().mockResolvedValue(
          Ok({
            id: "123456789",
            username: "testuser",
            global_name: "Test User",
            avatar: "abc123",
            locale: "ja",
          }),
        ),
    }),
  }) as unknown as ApplicationService;

const env = {
  DISCORD_CLIENT_ID: "test-client-id",
  DISCORD_REDIRECT_URI: "https://example.com/callback",
};

describe("LoginUsecase", () => {
  describe("buildAuthorizationUrl", () => {
    it("returns a valid Discord OAuth2 URL", async () => {
      const result = await LoginUsecase.buildAuthorizationUrl(env);
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

    it("returns a state value for CSRF protection", async () => {
      const result = await LoginUsecase.buildAuthorizationUrl(env);
      expect(result.state).toBeDefined();
      expect(result.state.length).toBeGreaterThan(0);
      // Should include state in URL
      const url = new URL(result.url);
      expect(url.searchParams.get("state")).toBe(result.state);
    });

    it("generates unique state per invocation", async () => {
      const r1 = await LoginUsecase.buildAuthorizationUrl(env);
      const r2 = await LoginUsecase.buildAuthorizationUrl(env);
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
      locale: "ja",
    };

    it("returns LoginResult on success", async () => {
      const mockAppWorker = createMockAppWorker({
        exchangeOAuthCode: vi.fn().mockResolvedValue(Ok(tokenResponse)),
        getOAuthUser: vi.fn().mockResolvedValue(Ok(apiUser)),
      });

      const before = getCurrentUTCDate().getTime();
      const result = await LoginUsecase.handleCallback(
        "auth-code",
        env,
        mockAppWorker,
      );
      const after = getCurrentUTCDate().getTime();

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
    });

    it("returns Err when token exchange fails", async () => {
      const error = new AppError({
        message: "token exchange failed",
        code: "UNAUTHORIZED",
      });
      const mockAppWorker = createMockAppWorker({
        exchangeOAuthCode: vi.fn().mockResolvedValue(Err(error)),
      });

      const result = await LoginUsecase.handleCallback(
        "bad-code",
        env,
        mockAppWorker,
      );

      expect(result.err).toBeDefined();
      expect(result.err).toBe(error);
    });

    it("returns Err when user parsing fails", async () => {
      const mockAppWorker = createMockAppWorker({
        exchangeOAuthCode: vi.fn().mockResolvedValue(Ok(tokenResponse)),
        getOAuthUser: vi.fn().mockResolvedValue(
          Ok({
            id: 123 as unknown as string,
            username: "u",
            global_name: null,
            avatar: null,
          }),
        ),
      });

      const result = await LoginUsecase.handleCallback(
        "code",
        env,
        mockAppWorker,
      );
      expect(result.err).toBeDefined();
    });

    it("returns Err when user fetch fails", async () => {
      const error = new AppError({
        message: "user fetch failed",
        code: "UNAUTHORIZED",
      });
      const mockAppWorker = createMockAppWorker({
        exchangeOAuthCode: vi.fn().mockResolvedValue(Ok(tokenResponse)),
        getOAuthUser: vi.fn().mockResolvedValue(Err(error)),
      });

      const result = await LoginUsecase.handleCallback(
        "code",
        env,
        mockAppWorker,
      );

      expect(result.err).toBeDefined();
      expect(result.err).toBe(error);
    });
  });
});
