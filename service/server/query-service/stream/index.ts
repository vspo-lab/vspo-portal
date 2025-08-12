import { type AppError, Ok, type Result } from "@vspo-lab/error";
import { createPage, type Page } from "../../domain/pagination";
import type { Streams } from "../../domain/stream";
import type { IAppContext } from "../../infra/dependency";
import { withTracerResult } from "../../infra/http/trace";

export type ListParam = {
  limit: number;
  page: number;
  platform?: string;
  status?: string;
  memberType?: string;
  creatorIds?: string[];
  startDateFrom?: Date;
  startDateTo?: Date;
  endedAt?: Date;
  languageCode: string;
  orderBy?: "asc" | "desc";
};

export type GetDeletedStreamIdsParam = {
  creatorIds: string[];
};

export type StreamsPage = {
  streams: Streams;
  pagination: Page;
};

// Query Service Interface
export interface IStreamQueryService {
  searchLive(): Promise<Result<Streams, AppError>>;
  searchExist(): Promise<Result<Streams, AppError>>;
  list(params: ListParam): Promise<Result<StreamsPage, AppError>>;
  searchDeletedCheck(): Promise<Result<Streams, AppError>>;
  getMemberStreams(): Promise<Result<Streams, AppError>>;
  deletedListIds(): Promise<Result<string[], AppError>>;
}

// Factory function
export const createStreamQueryService = (
  context: IAppContext,
): IStreamQueryService => {
  return {
    searchLive: async () => {
      return await withTracerResult(
        "searchLiveStreams",
        "execute",
        async () => {
          return context.runInTx(async (_repos, services) => {
            const sv = await services.streamService.searchAllLiveStreams();
            if (sv.err) {
              return sv;
            }
            return Ok(sv.val);
          });
        },
      );
    },
    searchExist: async () => {
      return await withTracerResult(
        "searchExistStreams",
        "execute",
        async () => {
          return context.runInTx(async (_repos, services) => {
            const sv = await services.streamService.searchExistStreams();
            if (sv.err) {
              return sv;
            }
            return Ok(sv.val);
          });
        },
      );
    },
    list: async (params) => {
      return await withTracerResult("listStreams", "execute", async () => {
        return context.runInTx(async (repos, _services) => {
          const sv = await repos.streamRepository.list(params);
          if (sv.err) {
            return sv;
          }

          const c = await repos.streamRepository.count(params);
          if (c.err) {
            return c;
          }
          return Ok({
            streams: sv.val,
            pagination: createPage({
              currentPage: params.page,
              limit: params.limit,
              totalCount: c.val,
            }),
          });
        });
      });
    },
    searchDeletedCheck: async () => {
      return await withTracerResult(
        "searchDeletedStreams",
        "execute",
        async () => {
          return context.runInTx(async (_repos, services) => {
            const sv = await services.streamService.searchDeletedStreams();
            if (sv.err) {
              return sv;
            }
            return Ok(sv.val);
          });
        },
      );
    },
    getMemberStreams: async () => {
      return await withTracerResult("getMemberStreams", "execute", async () => {
        return context.runInTx(async (_repos, services) => {
          const sv = await services.streamService.getMemberStreams();
          if (sv.err) {
            return sv;
          }
          return Ok(sv.val);
        });
      });
    },
    deletedListIds: async () => {
      return await withTracerResult(
        "getDeletedStreamIds",
        "execute",
        async () => {
          return context.runInTx(async (repos, _services) => {
            const ids = await repos.streamRepository.deletedListIds();
            if (ids.err) {
              return ids;
            }
            return Ok(ids.val);
          });
        },
      );
    },
  };
};
