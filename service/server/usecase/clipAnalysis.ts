import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import { type AppError, Ok, type Result } from "@vspo-lab/error";
import type { ClipAnalysisInput } from "../domain/clipAnalysis";
import type { AnalysisStats } from "../domain/service/clipAnalysis";
import type { IAppContext } from "../infra/dependency";
import { withTracerResult } from "../infra/http/trace";

export interface IClipAnalysisInteractor {
  analyzeClips(limit?: number): Promise<Result<AnalysisStats, AppError>>;
  getAnalysisStats(): Promise<Result<AnalysisStats, AppError>>;
}

const DEFAULT_ANALYSIS_LIMIT = 100;

export const createClipAnalysisInteractor = (
  context: IAppContext,
): IClipAnalysisInteractor => {
  const INTERACTOR_NAME = "ClipAnalysisInteractor";

  const analyzeClips = async (
    limit = DEFAULT_ANALYSIS_LIMIT,
  ): Promise<Result<AnalysisStats, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "analyzeClips", async () => {
      return context.runInTx(async (repos, services) => {
        // Analyze clips using the service
        const analysisResults =
          await services.clipAnalysisService.analyzeUnanalyzedClips(limit);
        if (analysisResults.err) {
          return analysisResults;
        }

        // Persist the results
        if (analysisResults.val.results.length > 0) {
          const clipAnalysisInputs: ClipAnalysisInput[] =
            analysisResults.val.results.map(({ videoId, analysisResult }) => ({
              videoId,
              ...analysisResult,
              analyzedAt: getCurrentUTCDate(),
            }));

          const insertResult =
            await repos.clipAnalysisRepository.batchInsert(clipAnalysisInputs);
          if (insertResult.err) {
            return insertResult;
          }
        }

        // Get final stats
        const stats = await services.clipAnalysisService.getAnalysisStats();
        if (stats.err) {
          return stats;
        }

        return Ok({
          ...stats.val,
          newlyAnalyzed: analysisResults.val.stats.processed,
          skipped: analysisResults.val.stats.skipped,
          failed: analysisResults.val.stats.failed,
        });
      });
    });
  };

  const getAnalysisStats = async (): Promise<
    Result<AnalysisStats, AppError>
  > => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "getAnalysisStats",
      async () => {
        return context.runInTx(async (_, services) => {
          return services.clipAnalysisService.getAnalysisStats();
        });
      },
    );
  };

  return {
    analyzeClips,
    getAnalysisStats,
  };
};
