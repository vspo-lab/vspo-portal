import { type AppError, Ok, type Result } from "@vspo-lab/error";
import type { Creators } from "../../domain/creator";
import { createPage, type Page } from "../../domain/pagination";
import type { IAppContext } from "../../infra/dependency";
import { withTracerResult } from "../../infra/http/trace";

export type ListByMemberTypeParam = {
  limit: number;
  page: number;
  memberType?: string;
  languageCode: string;
};

export type ListCreatorsResponse = {
  creators: Creators;
  pagination: Page;
};

export type SearchByChannelIdsParam = {
  channelIds: string[];
};

export type SearchByMemberTypeParam = {
  memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general";
};

// Query Service Interface
export interface ICreatorQueryService {
  searchByChannelIds(
    params: SearchByChannelIdsParam,
  ): Promise<Result<Creators, AppError>>;
  searchByMemberType(
    params: SearchByMemberTypeParam,
  ): Promise<Result<Creators, AppError>>;
  list(
    params: ListByMemberTypeParam,
  ): Promise<Result<ListCreatorsResponse, AppError>>;
}

// Factory function
export const createCreatorQueryService = (
  context: IAppContext,
): ICreatorQueryService => {
  return {
    searchByChannelIds: async (params) => {
      return await withTracerResult(
        "searchByChannelIds",
        "execute",
        async () => {
          return context.runInTx(async (_repos, services) => {
            const c = await services.creatorService.searchCreatorsByChannelIds(
              params.channelIds.map((channelId) => ({
                channelId,
                memberType: "vspo_jp",
              })),
            );
            if (c.err) {
              return c;
            }
            return Ok(c.val);
          });
        },
      );
    },
    searchByMemberType: async (params) => {
      return await withTracerResult(
        "searchByMemberType",
        "execute",
        async () => {
          return context.runInTx(async (_repos, services) => {
            const c =
              await services.creatorService.searchCreatorsByMemberType(params);
            if (c.err) {
              return c;
            }
            return Ok(c.val);
          });
        },
      );
    },
    list: async (params) => {
      return await withTracerResult("listCreators", "execute", async () => {
        return context.runInTx(async (repos, _services) => {
          const c = await repos.creatorRepository.list(params);
          if (c.err) {
            return c;
          }

          const count = await repos.creatorRepository.count(params);
          if (count.err) {
            return count;
          }

          return Ok({
            creators: c.val,
            pagination: createPage({
              currentPage: params.page,
              limit: params.limit,
              totalCount: count.val,
            }),
          });
        });
      });
    },
  };
};
