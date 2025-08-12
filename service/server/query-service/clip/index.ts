import { type AppError, Ok, type Result } from "@vspo-lab/error";
import type { Clips } from "../../domain/clip";
import { createPage, type Page } from "../../domain/pagination";
import type { IAppContext } from "../../infra/dependency";
import { withTracerResult } from "../../infra/http/trace";

export type ListClipsQuery = {
  limit: number;
  page: number;
  creatorChannelId?: string;
  creatorChannelIds?: string[];
  status?: string;
  memberType?: string;
  clipIds?: string[];
  publishedAtFrom?: Date;
  publishedAtTo?: Date;
  languageCode: string;
  orderBy?: "asc" | "desc";
};

export type ListClipsResponse = {
  clips: Clips;
  pagination: Page;
};

export type FetchClipsByCreatorParams = {
  channelId: string;
  limit?: number;
};

// Query Service Interface
export interface IClipQueryService {
  list(params: ListClipsQuery): Promise<Result<ListClipsResponse, AppError>>;
  searchNewVspoClipsAndNewCreators(): Promise<Result<Clips, AppError>>;
  searchExistVspoClips(params: {
    clipIds: string[];
  }): Promise<Result<Clips, AppError>>;
  searchNewClipsByVspoMemberName(): Promise<Result<Clips, AppError>>;
  fetchClipsByCreator(
    params: FetchClipsByCreatorParams,
  ): Promise<Result<Clips, AppError>>;
}

// Factory function
export const createClipQueryService = (
  context: IAppContext,
): IClipQueryService => {
  return {
    list: async (query) => {
      return await withTracerResult("listClips", "execute", async () => {
        return context.runInTx(async (repos, _services) => {
          const clips = await repos.clipRepository.list(query);
          if (clips.err) {
            return clips;
          }

          const count = await repos.clipRepository.count(query);
          if (count.err) {
            return count;
          }

          return Ok({
            clips: clips.val,
            pagination: createPage({
              currentPage: query.page,
              limit: query.limit,
              totalCount: count.val,
            }),
          });
        });
      });
    },

    searchExistVspoClips: async (params) => {
      return await withTracerResult(
        "searchExistVspoClips",
        "execute",
        async () => {
          return context.runInTx(async (_repos, services) => {
            const result = await services.clipService.searchExistVspoClips({
              clipIds: params.clipIds,
            });
            if (result.err) {
              return result;
            }
            return Ok(result.val.clips);
          });
        },
      );
    },

    searchNewVspoClipsAndNewCreators: async () => {
      return await withTracerResult(
        "searchNewVspoClipsAndNewCreators",
        "execute",
        async () => {
          return context.runInTx(async (_repos, services) => {
            const clips =
              await services.clipService.searchNewVspoClipsAndNewCreators();
            if (clips.err) {
              return clips;
            }
            return Ok(clips.val.clips);
          });
        },
      );
    },

    searchNewClipsByVspoMemberName: async () => {
      return await withTracerResult(
        "searchNewClipsByVspoMemberName",
        "execute",
        async () => {
          return context.runInTx(async (repos, services) => {
            const creators = await repos.creatorRepository.listByLastClipFetch({
              memberType: "vspo_jp",
              limit: 50,
              offset: 0,
              languageCode: "ja",
            });
            if (creators.err) {
              return creators;
            }

            const clips =
              await services.clipService.searchNewClipsByVspoMemberName();
            if (clips.err) {
              return clips;
            }

            return Ok(clips.val.clips);
          });
        },
      );
    },

    fetchClipsByCreator: async (_params) => {
      return await withTracerResult(
        "fetchClipsByCreator",
        "execute",
        async () => {
          return context.runInTx(async (_repos, _services) => {
            // Simply return empty array as clip fetching by creator is not a read operation
            // This should be handled by the write operation in the usecase
            return Ok([]);
          });
        },
      );
    },
  };
};
