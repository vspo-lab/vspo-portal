import { AppError, Err, Ok } from "@vspo-lab/error";
import { DiscordOAuthRpcRepository } from "~/features/auth/repository/discord-oauth-rpc";
import { VspoChannelApiRepository } from "~/features/channel/repository/vspo-channel-api";
import type { ApplicationService } from "~/types/api";
import { VspoGuildApiRepository } from "../repository/vspo-guild-api";
import { ListGuildsUsecase } from "./list-guilds";

vi.mock("~/features/auth/repository/discord-oauth-rpc", () => ({
  DiscordOAuthRpcRepository: {
    getUserGuilds: vi.fn(),
  },
}));

vi.mock("~/features/channel/repository/vspo-channel-api", () => ({
  VspoChannelApiRepository: {
    getGuildConfig: vi.fn(),
  },
}));

vi.mock("../repository/vspo-guild-api", () => ({
  VspoGuildApiRepository: {
    getBotGuildIds: vi.fn(),
    checkUserGuildAdmin: vi.fn(),
  },
}));

const appWorker = {} as ApplicationService;

const ownerGuild = {
  id: "1",
  name: "Owner Guild",
  icon: "icon1",
  owner: true,
  permissions: "0",
};

const nonOwnerGuild = {
  id: "2",
  name: "Non-Owner Guild",
  icon: null,
  owner: false,
  permissions: "0",
};

const anotherNonOwnerGuild = {
  id: "3",
  name: "Another Non-Owner",
  icon: "icon3",
  owner: false,
  permissions: "0",
};

describe("ListGuildsUsecase", () => {
  describe("execute", () => {
    it("owner guilds are always admin, server check upgrades non-owner installed guilds", async () => {
      vi.mocked(DiscordOAuthRpcRepository.getUserGuilds).mockResolvedValue(
        Ok([ownerGuild, nonOwnerGuild, anotherNonOwnerGuild]),
      );
      vi.mocked(VspoGuildApiRepository.getBotGuildIds).mockResolvedValue(
        Ok(new Set(["1", "2"])),
      );
      vi.mocked(VspoGuildApiRepository.checkUserGuildAdmin).mockResolvedValue(
        Ok({ "1": true, "2": true }),
      );
      vi.mocked(VspoChannelApiRepository.getGuildConfig).mockResolvedValue(
        Ok({ channels: [] } as never),
      );

      const result = await ListGuildsUsecase.execute({
        accessToken: "token",
        userId: "user-1",
        appWorker,
      });

      expect(result.err).toBeUndefined();
      if (result.err) return;
      expect(result.val.installed).toHaveLength(2);
      expect(result.val.installed.map((g) => g.id)).toEqual(["1", "2"]);
      expect(result.val.notInstalled).toHaveLength(0);
    });

    it("falls back to owner-only when checkUserGuildAdmin fails", async () => {
      vi.mocked(DiscordOAuthRpcRepository.getUserGuilds).mockResolvedValue(
        Ok([ownerGuild, nonOwnerGuild]),
      );
      vi.mocked(VspoGuildApiRepository.getBotGuildIds).mockResolvedValue(
        Ok(new Set(["1", "2"])),
      );
      vi.mocked(VspoGuildApiRepository.checkUserGuildAdmin).mockResolvedValue(
        Err(
          new AppError({ message: "rpc error", code: "INTERNAL_SERVER_ERROR" }),
        ),
      );
      vi.mocked(VspoChannelApiRepository.getGuildConfig).mockResolvedValue(
        Ok({ channels: [] } as never),
      );

      const result = await ListGuildsUsecase.execute({
        accessToken: "token",
        userId: "user-1",
        appWorker,
      });

      expect(result.err).toBeUndefined();
      if (result.err) return;
      expect(result.val.installed).toHaveLength(1);
      expect(result.val.installed[0].id).toBe("1");
    });

    it("builds sidebarGuilds from installed admin guilds", async () => {
      vi.mocked(DiscordOAuthRpcRepository.getUserGuilds).mockResolvedValue(
        Ok([ownerGuild]),
      );
      vi.mocked(VspoGuildApiRepository.getBotGuildIds).mockResolvedValue(
        Ok(new Set(["1"])),
      );
      vi.mocked(VspoGuildApiRepository.checkUserGuildAdmin).mockResolvedValue(
        Ok({ "1": true }),
      );
      vi.mocked(VspoChannelApiRepository.getGuildConfig).mockResolvedValue(
        Ok({ channels: [] } as never),
      );

      const result = await ListGuildsUsecase.execute({
        accessToken: "token",
        userId: "user-1",
        appWorker,
      });

      expect(result.err).toBeUndefined();
      if (result.err) return;
      expect(result.val.sidebarGuilds).toEqual([
        {
          id: "1",
          name: "Owner Guild",
          iconUrl: "https://cdn.discordapp.com/icons/1/icon1.png",
        },
      ]);
    });

    it("does not fetch channel summaries when includeChannelSummary is false", async () => {
      vi.mocked(DiscordOAuthRpcRepository.getUserGuilds).mockResolvedValue(
        Ok([ownerGuild]),
      );
      vi.mocked(VspoGuildApiRepository.getBotGuildIds).mockResolvedValue(
        Ok(new Set(["1"])),
      );
      vi.mocked(VspoGuildApiRepository.checkUserGuildAdmin).mockResolvedValue(
        Ok({ "1": true }),
      );

      const result = await ListGuildsUsecase.execute({
        accessToken: "token",
        userId: "user-1",
        appWorker,
        includeChannelSummary: false,
      });

      expect(result.err).toBeUndefined();
      expect(VspoChannelApiRepository.getGuildConfig).not.toHaveBeenCalled();
      if (result.err) return;
      expect(result.val.installed[0].channelSummary).toBeUndefined();
    });

    it("returns Err when getUserGuilds fails", async () => {
      const error = new AppError({
        message: "guild fetch failed",
        code: "UNAUTHORIZED",
      });
      vi.mocked(DiscordOAuthRpcRepository.getUserGuilds).mockResolvedValue(
        Err(error),
      );
      vi.mocked(VspoGuildApiRepository.getBotGuildIds).mockResolvedValue(
        Ok(new Set()),
      );

      const result = await ListGuildsUsecase.execute({
        accessToken: "token",
        userId: "user-1",
        appWorker,
      });

      expect(result.err).toBe(error);
    });

    it("returns Err when getBotGuildIds fails", async () => {
      const error = new AppError({
        message: "bot guild ids failed",
        code: "INTERNAL_SERVER_ERROR",
      });
      vi.mocked(DiscordOAuthRpcRepository.getUserGuilds).mockResolvedValue(
        Ok([ownerGuild]),
      );
      vi.mocked(VspoGuildApiRepository.getBotGuildIds).mockResolvedValue(
        Err(error),
      );

      const result = await ListGuildsUsecase.execute({
        accessToken: "token",
        userId: "user-1",
        appWorker,
      });

      expect(result.err).toBe(error);
    });

    it("returns empty arrays when no guilds exist", async () => {
      vi.mocked(DiscordOAuthRpcRepository.getUserGuilds).mockResolvedValue(
        Ok([]),
      );
      vi.mocked(VspoGuildApiRepository.getBotGuildIds).mockResolvedValue(
        Ok(new Set()),
      );
      vi.mocked(VspoGuildApiRepository.checkUserGuildAdmin).mockResolvedValue(
        Ok({}),
      );

      const result = await ListGuildsUsecase.execute({
        accessToken: "token",
        userId: "user-1",
        appWorker,
      });

      expect(result.err).toBeUndefined();
      if (result.err) return;
      expect(result.val.installed).toEqual([]);
      expect(result.val.notInstalled).toEqual([]);
      expect(result.val.sidebarGuilds).toEqual([]);
    });
  });
});
