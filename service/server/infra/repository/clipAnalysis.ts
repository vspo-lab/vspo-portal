import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import { AppError, Err, Ok, type Result, wrap } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import { and, countDistinct, eq, isNull, sql } from "drizzle-orm";
import {
  type ClipAnalysis,
  type ClipAnalysisInput,
  ClipAnalysisSchema,
} from "../../domain/clipAnalysis";
import { createUUID } from "../../pkg/uuid";
import { withTracerResult } from "../http/trace/cloudflare";
import {
  type InsertClipAnalysis,
  clipAnalysisTable,
  createInsertClipAnalysis,
  videoTable,
} from "./schema";
import type { DB } from "./transaction";

export interface IClipAnalysisRepository {
  findByVideoId(
    videoId: string,
  ): Promise<Result<ClipAnalysis | null, AppError>>;
  batchInsert(analyses: ClipAnalysisInput[]): Promise<Result<void, AppError>>;
  getUnanalyzedVideoIds(limit: number): Promise<Result<string[], AppError>>;
  countAnalyzed(): Promise<Result<number, AppError>>;
  countUnanalyzed(): Promise<Result<number, AppError>>;
}

export function createClipAnalysisRepository(db: DB): IClipAnalysisRepository {
  const findByVideoId = async (
    videoId: string,
  ): Promise<Result<ClipAnalysis | null, AppError>> => {
    return withTracerResult(
      "ClipAnalysisRepository",
      "findByVideoId",
      async (span) => {
        const result = await wrap(
          db
            .select()
            .from(clipAnalysisTable)
            .where(eq(clipAnalysisTable.videoId, videoId))
            .limit(1)
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during clip analysis find: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (result.err) {
          return Err(result.err);
        }

        if (result.val.length === 0) {
          return Ok(null);
        }

        const analysis = result.val[0];
        return Ok(
          ClipAnalysisSchema.parse({
            id: analysis.id,
            videoId: analysis.videoId,
            isShort: analysis.isShort,
            isVspoClip: analysis.isVspoClip,
            confidence: Number(analysis.confidence),
            analyzedAt: analysis.analyzedAt,
            createdAt: analysis.createdAt,
            updatedAt: analysis.updatedAt,
          }),
        );
      },
    );
  };

  const batchInsert = async (
    analyses: ClipAnalysisInput[],
  ): Promise<Result<void, AppError>> => {
    return withTracerResult(
      "ClipAnalysisRepository",
      "batchInsert",
      async (span) => {
        if (analyses.length === 0) {
          return Ok();
        }

        const dbAnalyses: InsertClipAnalysis[] = analyses.map((analysis) =>
          createInsertClipAnalysis({
            id: createUUID(),
            videoId: analysis.videoId,
            isShort: analysis.isShort,
            isVspoClip: analysis.isVspoClip,
            confidence: analysis.confidence.toString(),
            analyzedAt: analysis.analyzedAt,
            createdAt: getCurrentUTCDate(),
            updatedAt: getCurrentUTCDate(),
          }),
        );

        const result = await wrap(
          db
            .insert(clipAnalysisTable)
            .values(dbAnalyses)
            .onConflictDoNothing()
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during clip analysis batch insert: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (result.err) {
          return Err(result.err);
        }

        AppLogger.info("Clip analyses batch inserted", {
          count: analyses.length,
        });

        return Ok();
      },
    );
  };

  const getUnanalyzedVideoIds = async (
    limit: number,
  ): Promise<Result<string[], AppError>> => {
    return withTracerResult(
      "ClipAnalysisRepository",
      "getUnanalyzedVideoIds",
      async (span) => {
        const result = await wrap(
          db
            .select({ videoId: videoTable.id })
            .from(videoTable)
            .leftJoin(
              clipAnalysisTable,
              eq(videoTable.id, clipAnalysisTable.videoId),
            )
            .where(
              and(
                isNull(clipAnalysisTable.id),
                eq(videoTable.videoType, "clip"),
                eq(videoTable.deleted, false),
                eq(videoTable.platformType, "youtube"),
              ),
            )
            .limit(limit)
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during unanalyzed videos query: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (result.err) {
          return Err(result.err);
        }

        return Ok(result.val.map((r) => r.videoId));
      },
    );
  };

  const countAnalyzed = async (): Promise<Result<number, AppError>> => {
    return withTracerResult(
      "ClipAnalysisRepository",
      "countAnalyzed",
      async (span) => {
        const result = await wrap(
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(clipAnalysisTable)
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during analyzed count query: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (result.err) {
          return Err(result.err);
        }

        return Ok(result.val[0]?.count ?? 0);
      },
    );
  };

  const countUnanalyzed = async (): Promise<Result<number, AppError>> => {
    return withTracerResult(
      "ClipAnalysisRepository",
      "countUnanalyzed",
      async (span) => {
        const result = await wrap(
          db
            .select({ value: countDistinct(videoTable.id) })
            .from(videoTable)
            .leftJoin(
              clipAnalysisTable,
              eq(videoTable.id, clipAnalysisTable.videoId),
            )
            .where(
              and(
                isNull(clipAnalysisTable.id),
                eq(videoTable.videoType, "clip"),
                eq(videoTable.deleted, false),
                eq(videoTable.platformType, "youtube"),
              ),
            )
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during unanalyzed count query: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (result.err) {
          return Err(result.err);
        }

        return Ok(result.val[0]?.value ?? 0);
      },
    );
  };

  return {
    findByVideoId,
    batchInsert,
    getUnanalyzedVideoIds,
    countAnalyzed,
    countUnanalyzed,
  };
}
