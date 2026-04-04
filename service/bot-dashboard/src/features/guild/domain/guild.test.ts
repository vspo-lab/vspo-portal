import { GuildSummary, type GuildSummaryType } from "./guild";

describe("GuildSummary", () => {
  const botGuildIds = new Set(["guild-1", "guild-3"]);

  describe("fromDiscordGuild", () => {
    it.each([
      {
        label: "owner with bot installed",
        raw: {
          id: "guild-1",
          name: "My Server",
          icon: "abc123",
          owner: true,
        },
        expected: {
          id: "guild-1",
          name: "My Server",
          icon: "abc123",
          isAdmin: true,
          botInstalled: true,
        },
      },
      {
        label: "non-owner without bot",
        raw: {
          id: "guild-2",
          name: "Other",
          icon: null,
          owner: false,
        },
        expected: {
          id: "guild-2",
          name: "Other",
          icon: null,
          isAdmin: false,
          botInstalled: false,
        },
      },
      {
        label: "non-owner with bot (isAdmin defaults to false)",
        raw: {
          id: "guild-1",
          name: "No Admin",
          icon: null,
          owner: false,
        },
        expected: {
          id: "guild-1",
          name: "No Admin",
          icon: null,
          isAdmin: false,
          botInstalled: true,
        },
      },
    ])("$label", ({ raw, expected }) => {
      expect(GuildSummary.fromDiscordGuild(raw, botGuildIds)).toEqual(expected);
    });
  });

  describe("withAdminOverride", () => {
    it("sets isAdmin to true when server check is true", () => {
      const guild: GuildSummaryType = {
        id: "1",
        name: "A",
        icon: null,
        isAdmin: false,
        botInstalled: true,
      };
      const result = GuildSummary.withAdminOverride(guild, true);
      expect(result.isAdmin).toBe(true);
    });

    it("preserves isAdmin true when server check is false (owner)", () => {
      const guild: GuildSummaryType = {
        id: "1",
        name: "A",
        icon: null,
        isAdmin: true,
        botInstalled: true,
      };
      const result = GuildSummary.withAdminOverride(guild, false);
      expect(result.isAdmin).toBe(true);
    });
  });

  describe("iconUrl", () => {
    it("returns CDN URL when icon is present", () => {
      const guild: GuildSummaryType = {
        id: "123",
        name: "Test",
        icon: "abc",
        isAdmin: true,
        botInstalled: true,
      };
      expect(GuildSummary.iconUrl(guild)).toBe(
        "https://cdn.discordapp.com/icons/123/abc.png",
      );
    });

    it("returns null when icon is null", () => {
      const guild: GuildSummaryType = {
        id: "123",
        name: "Test",
        icon: null,
        isAdmin: true,
        botInstalled: true,
      };
      expect(GuildSummary.iconUrl(guild)).toBeNull();
    });
  });

  describe("filterManageable", () => {
    it("keeps only guilds with isAdmin=true", () => {
      const guilds: GuildSummaryType[] = [
        {
          id: "1",
          name: "A",
          icon: null,
          isAdmin: true,
          botInstalled: false,
        },
        {
          id: "2",
          name: "B",
          icon: null,
          isAdmin: false,
          botInstalled: true,
        },
        {
          id: "3",
          name: "C",
          icon: null,
          isAdmin: true,
          botInstalled: true,
        },
      ];
      const result = GuildSummary.filterManageable(guilds);
      expect(result).toHaveLength(2);
      expect(result.map((g) => g.id)).toEqual(["1", "3"]);
    });

    it("returns empty array when none are admin", () => {
      const guilds: GuildSummaryType[] = [
        {
          id: "1",
          name: "A",
          icon: null,
          isAdmin: false,
          botInstalled: false,
        },
      ];
      expect(GuildSummary.filterManageable(guilds)).toEqual([]);
    });
  });

  describe("partition", () => {
    it("splits into installed and notInstalled", () => {
      const guilds: GuildSummaryType[] = [
        {
          id: "1",
          name: "A",
          icon: null,
          isAdmin: true,
          botInstalled: true,
        },
        {
          id: "2",
          name: "B",
          icon: null,
          isAdmin: true,
          botInstalled: false,
        },
        {
          id: "3",
          name: "C",
          icon: null,
          isAdmin: true,
          botInstalled: true,
        },
      ];
      const { installed, notInstalled } = GuildSummary.partition(guilds);
      expect(installed.map((g) => g.id)).toEqual(["1", "3"]);
      expect(notInstalled.map((g) => g.id)).toEqual(["2"]);
    });

    it("handles empty array", () => {
      const { installed, notInstalled } = GuildSummary.partition([]);
      expect(installed).toEqual([]);
      expect(notInstalled).toEqual([]);
    });
  });

  describe("inviteUrl", () => {
    it("returns a Discord OAuth2 authorize URL", () => {
      const guild: GuildSummaryType = {
        id: "guild-99",
        name: "Test",
        icon: null,
        isAdmin: true,
        botInstalled: false,
      };
      const url = GuildSummary.inviteUrl(guild, "my-client-id");
      expect(url).toBe(
        "https://discord.com/oauth2/authorize?client_id=my-client-id&guild_id=guild-99&permissions=2048&scope=bot%20applications.commands",
      );
    });
  });
});
