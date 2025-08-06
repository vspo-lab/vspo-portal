import { Ok } from "@vspo-lab/error";
import type { DiscordServer, DiscordServers } from "../../domain/discord";
import { createPage, type Page } from "../../domain/pagination";
import type { IAppContext } from "../../infra/dependency";
import { withTracerResult } from "../../infra/http/trace";

export type ListDiscordServerParam = {
  limit: number;
  page: number;
  serverId?: string;
  isEnabled?: boolean;
  channelId?: string;
  channelIds?: string[];
};

export type ListDiscordServerResponse = {
  servers: DiscordServers;
  pagination: Page;
};

export async function getDiscordServer(
  context: IAppContext,
  serverId: string,
): Promise<ReturnType<typeof context.runInTx<DiscordServer | null>>> {
  return await withTracerResult("getDiscordServer", "execute", async () => {
    return context.runInTx(async (repos, _services) => {
      const sv = await repos.discordServerRepository.get({ serverId });
      if (sv.err) {
        return sv;
      }
      return Ok(sv.val);
    });
  });
}

export async function listDiscordServers(
  context: IAppContext,
  params: ListDiscordServerParam,
): Promise<ReturnType<typeof context.runInTx<ListDiscordServerResponse>>> {
  return await withTracerResult("listDiscordServers", "execute", async () => {
    return context.runInTx(async (repos, _services) => {
      const sv = await repos.discordServerRepository.list(params);
      if (sv.err) {
        return sv;
      }

      const count = await repos.discordServerRepository.count(params);
      if (count.err) {
        return count;
      }

      return Ok({
        servers: sv.val,
        pagination: createPage({
          currentPage: params.page,
          limit: params.limit,
          totalCount: count.val,
        }),
      });
    });
  });
}

export async function existsDiscordServer(
  context: IAppContext,
  serverId: string,
): Promise<ReturnType<typeof context.runInTx<boolean>>> {
  return await withTracerResult("existsDiscordServer", "execute", async () => {
    return context.runInTx(async (repos, _services) => {
      const sv = await repos.discordServerRepository.get({ serverId });
      if (sv.err) {
        return sv;
      }
      return Ok(sv.val !== null);
    });
  });
}

export async function existsDiscordChannel(
  context: IAppContext,
  channelId: string,
): Promise<ReturnType<typeof context.runInTx<boolean>>> {
  return await withTracerResult("existsDiscordChannel", "execute", async () => {
    return context.runInTx(async (repos, _services) => {
      const channel = await repos.discordServerRepository.existsChannel({
        channelId,
      });
      if (channel.err) {
        return channel;
      }
      return Ok(channel.val);
    });
  });
}
