import { AppError, Err, Ok, type Result } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import type { ClipAnalysisResponse, IMastraService } from "../../infra/mastra";
import type { IClipRepository } from "../../infra/repository/clip";
import type { IClipAnalysisRepository } from "../../infra/repository/clipAnalysis";
import { type AnalysisResult, createAnalysisResult } from "../clipAnalysis";

export interface IClipAnalysisService {
  analyzeUnanalyzedClips(
    limit: number,
  ): Promise<Result<ClipAnalysisResults, AppError>>;
  getAnalysisStats(): Promise<Result<AnalysisStats, AppError>>;
}

export type ClipAnalysisResults = {
  results: Array<{
    videoId: string;
    analysisResult: AnalysisResult;
  }>;
  stats: {
    processed: number;
    skipped: number;
    failed: number;
  };
};

export type AnalysisStats = {
  analyzed: number;
  unanalyzed: number;
  newlyAnalyzed?: number;
  skipped?: number;
  failed?: number;
};

// Configuration for rate limiting
const RATE_LIMIT_CONFIG = {
  delayBetweenRequests: 1000, // 1 second between requests
  batchSize: 10, // Process 10 clips then pause
  batchDelay: 5000, // 5 seconds pause between batches
};

// Helper function to wait for a specified number of milliseconds
const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const createClipAnalysisService = (deps: {
  mastraService: IMastraService;
  clipRepository: IClipRepository;
  clipAnalysisRepository: IClipAnalysisRepository;
}): IClipAnalysisService => {
  const SERVICE_NAME = "ClipAnalysisService";

  const convertAnalysisResult = (
    mastraResult: ClipAnalysisResponse,
  ): Result<AnalysisResult, AppError> => {
    try {
      const result = createAnalysisResult({
        isShort: mastraResult.isYouTubeShort.result,
        isVspoClip: mastraResult.isVSPOClip.result,
        confidence: mastraResult.isVSPOClip.confidence,
        reasoning: [
          mastraResult.isVSPOClip.reasoning,
          mastraResult.isYouTubeShort.reasoning,
        ]
          .filter(Boolean)
          .join(" "),
      });
      return Ok(result);
    } catch (error) {
      return Err(
        new AppError({
          message: "Failed to convert Mastra analysis result",
          code: "INTERNAL_SERVER_ERROR",
          cause: error,
        }),
      );
    }
  };

  const analyzeUnanalyzedClips = async (
    limit: number,
  ): Promise<Result<ClipAnalysisResults, AppError>> => {
    AppLogger.info("Starting clip analysis", {
      service: SERVICE_NAME,
      limit,
    });

    // Get unanalyzed video IDs
    const unanalyzedIds =
      await deps.clipAnalysisRepository.getUnanalyzedVideoIds(limit);
    if (unanalyzedIds.err) {
      return unanalyzedIds;
    }

    if (unanalyzedIds.val.length === 0) {
      AppLogger.info("No unanalyzed clips found", {
        service: SERVICE_NAME,
      });
      return Ok({
        results: [],
        stats: {
          processed: 0,
          skipped: 0,
          failed: 0,
        },
      });
    }

    // Fetch clip details
    const clips = await deps.clipRepository.list({
      limit: unanalyzedIds.val.length,
      page: 0,
      languageCode: "default",
      includeDeleted: false,
      clipType: "clip",
      platform: "youtube",
    });
    if (clips.err) {
      return clips;
    }

    // Filter clips to only those in unanalyzed IDs
    const clipsToAnalyze = clips.val.filter((clip) =>
      unanalyzedIds.val.includes(clip.id),
    );

    AppLogger.info("Clips to analyze", {
      service: SERVICE_NAME,
      count: clipsToAnalyze.length,
    });

    const analysisResults: Array<{
      videoId: string;
      analysisResult: AnalysisResult;
    }> = [];
    let skipped = 0;
    let failed = 0;

    // Process clips with rate limiting
    for (let i = 0; i < clipsToAnalyze.length; i++) {
      const clip = clipsToAnalyze[i];

      // Check if already analyzed (race condition protection)
      const existing = await deps.clipAnalysisRepository.findByVideoId(clip.id);
      if (existing.err) {
        AppLogger.error("Failed to check existing analysis", {
          service: SERVICE_NAME,
          error: existing.err,
          clipId: clip.id,
        });
        failed++;
        continue;
      }

      if (existing.val) {
        AppLogger.debug("Clip already analyzed, skipping", {
          service: SERVICE_NAME,
          clipId: clip.id,
        });
        skipped++;
        continue;
      }

      // Analyze the clip
      const analysisResult = await deps.mastraService.analyzeClip({
        title: clip.title,
        description: clip.description || "",
        tags: clip.tags,
        duration: clip.duration || 0,
      });

      if (analysisResult.err) {
        AppLogger.error("Failed to analyze clip", {
          service: SERVICE_NAME,
          error: analysisResult.err,
          clipId: clip.id,
        });
        failed++;
        continue;
      }

      // Convert the result
      const convertedResult = convertAnalysisResult(analysisResult.val);
      if (convertedResult.err) {
        AppLogger.error("Failed to convert analysis result", {
          service: SERVICE_NAME,
          error: convertedResult.err,
          clipId: clip.id,
        });
        failed++;
        continue;
      }

      analysisResults.push({
        videoId: clip.id,
        analysisResult: convertedResult.val,
      });

      // Apply rate limiting
      if ((i + 1) % RATE_LIMIT_CONFIG.batchSize === 0) {
        AppLogger.debug("Batch complete, pausing", {
          service: SERVICE_NAME,
          processed: i + 1,
          batchSize: RATE_LIMIT_CONFIG.batchSize,
        });
        await wait(RATE_LIMIT_CONFIG.batchDelay);
      } else {
        await wait(RATE_LIMIT_CONFIG.delayBetweenRequests);
      }
    }

    return Ok({
      results: analysisResults,
      stats: {
        processed: analysisResults.length,
        skipped,
        failed,
      },
    });
  };

  const getAnalysisStats = async (): Promise<
    Result<AnalysisStats, AppError>
  > => {
    const [analyzed, unanalyzed] = await Promise.all([
      deps.clipAnalysisRepository.countAnalyzed(),
      deps.clipAnalysisRepository.countUnanalyzed(),
    ]);

    if (analyzed.err) {
      return analyzed;
    }
    if (unanalyzed.err) {
      return unanalyzed;
    }

    return Ok({
      analyzed: analyzed.val,
      unanalyzed: unanalyzed.val,
    });
  };

  return {
    analyzeUnanalyzedClips,
    getAnalysisStats,
  };
};
