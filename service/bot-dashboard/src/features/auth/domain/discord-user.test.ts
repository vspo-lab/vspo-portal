import { AppError } from "@vspo-lab/error";
import { DiscordUser } from "./discord-user";

describe("DiscordUser", () => {
  describe("fromApiResponse", () => {
    it("parses valid response with global_name", () => {
      const result = DiscordUser.fromApiResponse({
        id: "123",
        username: "testuser",
        global_name: "Test User",
        avatar: "abc123",
      });
      expect(result.err).toBeUndefined();
      expect(result.val).toEqual({
        id: "123",
        username: "testuser",
        displayName: "Test User",
        avatar: "abc123",
      });
    });

    it("falls back to username when global_name is null", () => {
      const result = DiscordUser.fromApiResponse({
        id: "123",
        username: "fallback_user",
        global_name: null,
        avatar: null,
      });
      expect(result.err).toBeUndefined();
      expect(result.val).toEqual({
        id: "123",
        username: "fallback_user",
        displayName: "fallback_user",
        avatar: null,
      });
    });

    it("falls back to username when global_name is omitted", () => {
      const result = DiscordUser.fromApiResponse({
        id: "456",
        username: "no_global",
        avatar: "xyz",
      });
      expect(result.err).toBeUndefined();
      expect(result.val).toEqual({
        id: "456",
        username: "no_global",
        displayName: "no_global",
        avatar: "xyz",
      });
    });

    it.each([
      ["null", null],
      ["undefined", undefined],
      ["empty object", {}],
      ["missing id", { username: "x", avatar: null }],
      ["wrong type for id", { id: 123, username: "x", avatar: null }],
    ])("returns Err for invalid input: %s", (_label, raw) => {
      const result = DiscordUser.fromApiResponse(raw);
      expect(result.err).toBeDefined();
      expect(result.err).toBeInstanceOf(AppError);
      expect(result.err?.code).toBe("BAD_REQUEST");
    });
  });

  describe("avatarUrl", () => {
    it("returns CDN URL when avatar is present", () => {
      const user = {
        id: "123",
        username: "test",
        displayName: "Test",
        avatar: "abc",
      };
      expect(DiscordUser.avatarUrl(user)).toBe(
        "https://cdn.discordapp.com/avatars/123/abc.png",
      );
    });

    it("returns null when avatar is null", () => {
      const user = {
        id: "123",
        username: "test",
        displayName: "Test",
        avatar: null,
      };
      expect(DiscordUser.avatarUrl(user)).toBeNull();
    });
  });
});
