import { type AppError, Ok, type Result } from "@vspo-lab/error";
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

// Query Service Interface
export interface IDiscordQueryService {
  get(serverId: string): Promise<Result<DiscordServer | null, AppError>>;
  list(
    params: ListDiscordServerParam,
  ): Promise<Result<ListDiscordServerResponse, AppError>>;
  exists(serverId: string): Promise<Result<boolean, AppError>>;
  existsChannel(channelId: string): Promise<Result<boolean, AppError>>;
}

// Factory function
export const createDiscordQueryService = (
  context: IAppContext,
): IDiscordQueryService => {
  return {
    get: async (serverId) => {
      return await withTracerResult("getDiscordServer", "execute", async () => {
        return context.runInTx(async (repos, _services) => {
          const sv = await repos.discordServerRepository.get({ serverId });
          if (sv.err) {
            return sv;
          }
          return Ok(sv.val);
        });
      });
    },
    list: async (params) => {
      return await withTracerResult(
        "listDiscordServers",
        "execute",
        async () => {
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
        },
      );
    },
    exists: async (serverId) => {
      return await withTracerResult(
        "existsDiscordServer",
        "execute",
        async () => {
          return context.runInTx(async (repos, _services) => {
            const sv = await repos.discordServerRepository.get({ serverId });
            if (sv.err) {
              return sv;
            }
            return Ok(sv.val !== null);
          });
        },
      );
    },
    existsChannel: async (channelId) => {
      return await withTracerResult(
        "existsDiscordChannel",
        "execute",
        async () => {
          return context.runInTx(async (repos, _services) => {
            const channel = await repos.discordServerRepository.existsChannel({
              channelId,
            });
            if (channel.err) {
              return channel;
            }
            return Ok(channel.val);
          });
        },
      );
    },
  };
};
