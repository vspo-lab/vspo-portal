import { type AppError, Ok, type Result } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import type { Clips } from "../domain/clip";
import type { IAppContext } from "../infra/dependency";
import { withTracerResult } from "../infra/http/trace";

export type FetchClipsByCreatorParams = {
  batchSize?: number;
  maxQuotaUsage?: number;
  memberType?: string;
};

export type FetchClipsByCreatorResponse = {
  clips: Clips;
  processedCreatorCount: number;
  hasMore: boolean;
};

export interface ICreatorClipFetchInteractor {
  fetchClipsByCreator(
    params: FetchClipsByCreatorParams,
  ): Promise<Result<FetchClipsByCreatorResponse, AppError>>;
}

export const createCreatorClipFetchInteractor = (
  context: IAppContext,
): ICreatorClipFetchInteractor => {
  const INTERACTOR_NAME = "CreatorClipFetchInteractor";
  const DEFAULT_BATCH_SIZE = 300;
  const DEFAULT_MAX_QUOTA_USAGE = 10000; // Default to 10k quota units per run

  const fetchClipsByCreator = async (
    params: FetchClipsByCreatorParams,
  ): Promise<Result<FetchClipsByCreatorResponse, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "fetchClipsByCreator",
      async () => {
        const batchSize = params.batchSize || DEFAULT_BATCH_SIZE;
        const maxQuotaUsage = params.maxQuotaUsage || DEFAULT_MAX_QUOTA_USAGE;

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
            AppLogger.info("No creators found to fetch clips", {
              interactor: INTERACTOR_NAME,
            });
            return Ok({
              clips: [],
              processedCreatorCount: 0,
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

          // Batch upsert clips if any were found
          if (clips.length > 0) {
            const upsertResult = await repos.clipRepository.batchUpsert(clips);
            if (upsertResult.err) {
              AppLogger.error("Failed to upsert clips", {
                interactor: INTERACTOR_NAME,
                error: upsertResult.err,
                clipCount: clips.length,
              });
              return upsertResult;
            }
          }

          // Update lastClipFetchedAt for processed creators
          if (processedCreatorIds.length > 0) {
            const updateResult =
              await repos.creatorRepository.updateLastClipFetchedAt(
                processedCreatorIds,
              );
            if (updateResult.err) {
              AppLogger.error("Failed to update lastClipFetchedAt", {
                interactor: INTERACTOR_NAME,
                error: updateResult.err,
                creatorCount: processedCreatorIds.length,
              });
              // Continue even if update fails - clips were already inserted
            }
          }

          // Check if there are more creators to process
          const hasMore = creators.val.length === batchSize;

          AppLogger.info("Completed clip fetch by creator", {
            interactor: INTERACTOR_NAME,
            totalCreators: creators.val.length,
            processedCreators: processedCreatorIds.length,
            clipsFound: clips.length,
            hasMore,
          });

          return Ok({
            clips,
            processedCreatorCount: processedCreatorIds.length,
            hasMore,
          });
        });
      },
    );
  };

  return {
    fetchClipsByCreator,
  };
};
