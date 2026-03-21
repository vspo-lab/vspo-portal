import { AppError, Err, Ok } from "@vspo-lab/error";
import { DiscordApiRepository } from "~/features/auth/repository/discord-api";
import { VspoGuildApiRepository } from "../repository/vspo-guild-api";
import { ListGuildsUsecase } from "./list-guilds";

vi.mock("~/features/auth/repository/discord-api", () => ({
  DiscordApiRepository: {
    getUserGuilds: vi.fn(),
  },
}));

vi.mock("../repository/vspo-guild-api", () => ({
  VspoGuildApiRepository: {
    getBotGuildIds: vi.fn(),
  },
}));

const appWorker = {} as Fetcher;

const adminGuild = {
  id: "1",
  name: "Admin Guild",
  icon: "icon1",
  permissions: "32", // MANAGE_GUILD (0x20)
};

const nonAdminGuild = {
  id: "2",
  name: "Non-Admin Guild",
  icon: null,
  permissions: "0",
};

const anotherAdminGuild = {
  id: "3",
  name: "Another Admin",
  icon: "icon3",
  permissions: "32",
};

describe("ListGuildsUsecase", () => {
  describe("execute", () => {
    it("returns only admin guilds partitioned into installed and notInstalled", async () => {
      vi.mocked(DiscordApiRepository.getUserGuilds).mockResolvedValue(
        Ok([adminGuild, nonAdminGuild, anotherAdminGuild]),
      );
      vi.mocked(VspoGuildApiRepository.getBotGuildIds).mockResolvedValue(
        Ok(new Set(["1"])),
      );

      const result = await ListGuildsUsecase.execute({
        accessToken: "token",
        appWorker,
      });

      expect(result.err).toBeUndefined();
      if (result.err) return;
      expect(result.val.installed).toHaveLength(1);
      expect(result.val.installed[0].id).toBe("1");
      expect(result.val.installed[0].botInstalled).toBe(true);
      expect(result.val.notInstalled).toHaveLength(1);
      expect(result.val.notInstalled[0].id).toBe("3");
      expect(result.val.notInstalled[0].botInstalled).toBe(false);
    });

    it("builds sidebarGuilds from installed guilds with iconUrl", async () => {
      vi.mocked(DiscordApiRepository.getUserGuilds).mockResolvedValue(
        Ok([adminGuild]),
      );
      vi.mocked(VspoGuildApiRepository.getBotGuildIds).mockResolvedValue(
        Ok(new Set(["1"])),
      );

      const result = await ListGuildsUsecase.execute({
        accessToken: "token",
        appWorker,
      });

      expect(result.err).toBeUndefined();
      if (result.err) return;
      expect(result.val.sidebarGuilds).toEqual([
        {
          id: "1",
          name: "Admin Guild",
          iconUrl: "https://cdn.discordapp.com/icons/1/icon1.png",
        },
      ]);
    });

    it("returns sidebarGuilds with null iconUrl when icon is absent", async () => {
      const adminNoIcon = { ...adminGuild, icon: null };
      vi.mocked(DiscordApiRepository.getUserGuilds).mockResolvedValue(
        Ok([adminNoIcon]),
      );
      vi.mocked(VspoGuildApiRepository.getBotGuildIds).mockResolvedValue(
        Ok(new Set(["1"])),
      );

      const result = await ListGuildsUsecase.execute({
        accessToken: "token",
        appWorker,
      });

      expect(result.err).toBeUndefined();
      if (result.err) return;
      expect(result.val.sidebarGuilds[0].iconUrl).toBeNull();
    });

    it("returns Err when getUserGuilds fails", async () => {
      const error = new AppError({
        message: "guild fetch failed",
        code: "UNAUTHORIZED",
      });
      vi.mocked(DiscordApiRepository.getUserGuilds).mockResolvedValue(
        Err(error),
      );
      vi.mocked(VspoGuildApiRepository.getBotGuildIds).mockResolvedValue(
        Ok(new Set()),
      );

      const result = await ListGuildsUsecase.execute({
        accessToken: "token",
        appWorker,
      });

      expect(result.err).toBe(error);
    });

    it("returns Err when getBotGuildIds fails", async () => {
      const error = new AppError({
        message: "bot guild ids failed",
        code: "INTERNAL_SERVER_ERROR",
      });
      vi.mocked(DiscordApiRepository.getUserGuilds).mockResolvedValue(
        Ok([adminGuild]),
      );
      vi.mocked(VspoGuildApiRepository.getBotGuildIds).mockResolvedValue(
        Err(error),
      );

      const result = await ListGuildsUsecase.execute({
        accessToken: "token",
        appWorker,
      });

      expect(result.err).toBe(error);
    });

    it("returns empty arrays when no guilds exist", async () => {
      vi.mocked(DiscordApiRepository.getUserGuilds).mockResolvedValue(Ok([]));
      vi.mocked(VspoGuildApiRepository.getBotGuildIds).mockResolvedValue(
        Ok(new Set()),
      );

      const result = await ListGuildsUsecase.execute({
        accessToken: "token",
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
