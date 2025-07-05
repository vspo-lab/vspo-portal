import { type AppError, Ok, type Result } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import type { Clips } from "../domain/clip";
import type { Creators } from "../domain/creator";
import { type Page, createPage } from "../domain/pagination";
import type { IAppContext } from "../infra/dependency";
import { withTracerResult } from "../infra/http/trace";

export type BatchUpsertClipsParam = Clips;

export type ListClipsQuery = {
  limit: number;
  page: number;
  platform?: string;
  memberType?: string;
  languageCode: string;
  orderBy?: "asc" | "desc";
  channelIds?: string[];
  includeDeleted?: boolean;
  clipType?: "clip" | "short";
  orderKey?: "publishedAt" | "viewCount";
  afterPublishedAtDate?: Date;
  beforePublishedAtDate?: Date;
};

export type ListClipsResponse = {
  clips: Clips;
  pagination: Page;
};

export type FetchClipsByCreatorParams = {
  batchSize?: number;
  maxQuotaUsage?: number;
  memberType?: string;
};

export type FetchClipsByCreatorResponse = {
  clips: Clips;
  processedCreatorIds: string[];
  hasMore: boolean;
};

export interface IClipInteractor {
  list(query: ListClipsQuery): Promise<Result<ListClipsResponse, AppError>>;
  batchUpsert(params: BatchUpsertClipsParam): Promise<Result<Clips, AppError>>;
  searchNewVspoClipsAndNewCreators(): Promise<
    Result<{ newCreators: Creators; clips: Clips }, AppError>
  >;
  searchExistVspoClips({
    clipIds,
  }: {
    clipIds: string[];
  }): Promise<Result<{ clips: Clips; notExistsClipIds: string[] }, AppError>>;
  searchNewClipsByVspoMemberName(): Promise<
    Result<{ newCreators: Creators; clips: Clips }, AppError>
  >;
  deleteClips({
    clipIds,
  }: {
    clipIds: string[];
  }): Promise<Result<void, AppError>>;
  fetchClipsByCreator(
    params: FetchClipsByCreatorParams,
  ): Promise<Result<FetchClipsByCreatorResponse, AppError>>;
  updateCreatorsLastClipFetchedAt(
    creatorIds: string[],
  ): Promise<Result<void, AppError>>;
}

export const createClipInteractor = (context: IAppContext): IClipInteractor => {
  const INTERACTOR_NAME = "ClipInteractor";
  const DEFAULT_BATCH_SIZE = 300;

  const list = async (
    query: ListClipsQuery,
  ): Promise<Result<ListClipsResponse, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "list", async () => {
      return context.runInTx(async (repos, _services) => {
        const clips = await repos.clipRepository.list(query);

        if (clips.err) {
          return clips;
        }

        const pagination = await repos.clipRepository.count(query);

        if (pagination.err) {
          return pagination;
        }

        return Ok({
          clips: clips.val,
          pagination: createPage({
            currentPage: query.page,
            limit: query.limit,
            totalCount: pagination.val,
          }),
        });
      });
    });
  };

  const batchUpsert = async (
    params: BatchUpsertClipsParam,
  ): Promise<Result<Clips, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "batchUpsert", async () => {
      return context.runInTx(async (repos, _services) => {
        return repos.clipRepository.batchUpsert(params);
      });
    });
  };

  const searchNewVspoClipsAndNewCreators = async (): Promise<
    Result<{ newCreators: Creators; clips: Clips }, AppError>
  > => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "searchNewVspoClipsAndNewCreators",
      async () => {
        return context.runInTx(async (_repos, services) => {
          return services.clipService.searchNewVspoClipsAndNewCreators();
        });
      },
    );
  };

  const searchExistVspoClips = async ({
    clipIds,
  }: {
    clipIds: string[];
  }): Promise<
    Result<{ clips: Clips; notExistsClipIds: string[] }, AppError>
  > => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "searchExistVspoClips",
      async () => {
        return context.runInTx(async (_repos, services) => {
          return services.clipService.searchExistVspoClips({ clipIds });
        });
      },
    );
  };

  const searchNewClipsByVspoMemberName = async (): Promise<
    Result<{ newCreators: Creators; clips: Clips }, AppError>
  > => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "searchNewClipsByVspoMemberName",
      async () => {
        return context.runInTx(async (_repos, services) => {
          return services.clipService.searchNewClipsByVspoMemberName();
        });
      },
    );
  };

  const deleteClips = async ({
    clipIds,
  }: {
    clipIds: string[];
  }): Promise<Result<void, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "deleteClips", async () => {
      return context.runInTx(async (repos, _services) => {
        return repos.clipRepository.batchDelete(clipIds);
      });
    });
  };

  const fetchClipsByCreator = async (
    params: FetchClipsByCreatorParams,
  ): Promise<Result<FetchClipsByCreatorResponse, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "fetchClipsByCreator",
      async () => {
        const batchSize = params.batchSize || DEFAULT_BATCH_SIZE;

        return context.runInTx(async (repos, services) => {
          // Fetch creators ordered by lastClipFetchedAt (oldest first)
          const creators = await repos.creatorRepository.listByLastClipFetch({
            limit: batchSize,
            offset: 0,
            memberType: params.memberType,
            languageCode: "default",
          });

          if (creators.err) {
            return creators;
          }

          if (creators.val.length === 0) {
            AppLogger.debug("No creators found to fetch clips", {
              interactor: INTERACTOR_NAME,
            });
            return Ok({
              clips: [],
              processedCreatorIds: [],
              hasMore: false,
            });
          }

          // Fetch clips for these creators
          const fetchResult =
            await services.creatorClipFetchService.fetchClipsForCreators({
              creators: creators.val,
            });

          if (fetchResult.err) {
            return fetchResult;
          }

          const { clips, processedCreatorIds } = fetchResult.val;

          // Check if there are more creators to process
          const hasMore = creators.val.length === batchSize;

          AppLogger.debug("Fetched clips by creator", {
            interactor: INTERACTOR_NAME,
            totalCreators: creators.val.length,
            processedCreators: processedCreatorIds.length,
            clipsFound: clips.length,
            hasMore,
          });

          return Ok({
            clips,
            processedCreatorIds,
            hasMore,
          });
        });
      },
    );
  };

  const updateCreatorsLastClipFetchedAt = async (
    creatorIds: string[],
  ): Promise<Result<void, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "updateCreatorsLastClipFetchedAt",
      async () => {
        return context.runInTx(async (repos, _services) => {
          if (creatorIds.length === 0) {
            return Ok(undefined);
          }

          const updateResult =
            await repos.creatorRepository.updateLastClipFetchedAt(creatorIds);

          if (updateResult.err) {
            AppLogger.error("Failed to update lastClipFetchedAt", {
              interactor: INTERACTOR_NAME,
              error: updateResult.err,
              creatorCount: creatorIds.length,
            });
            return updateResult;
          }

          AppLogger.debug("Updated lastClipFetchedAt for creators", {
            interactor: INTERACTOR_NAME,
            creatorCount: creatorIds.length,
          });

          return Ok(undefined);
        });
      },
    );
  };

  return {
    list,
    batchUpsert,
    searchNewVspoClipsAndNewCreators,
    searchExistVspoClips,
    searchNewClipsByVspoMemberName,
    deleteClips,
    fetchClipsByCreator,
    updateCreatorsLastClipFetchedAt,
  };
};
