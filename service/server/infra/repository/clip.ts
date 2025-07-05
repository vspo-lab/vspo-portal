import {
  convertToUTC,
  convertToUTCDate,
  getCurrentUTCDate,
} from "@vspo-lab/dayjs";
import { AppError, Err, Ok, type Result, wrap } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import {
  type SQL,
  and,
  asc,
  countDistinct,
  desc,
  eq,
  gte,
  inArray,
  lte,
} from "drizzle-orm";
import { ClipTypeSchema, type Clips, createClips } from "../../domain/clip";
import { TargetLangSchema } from "../../domain/translate";
import { PlatformSchema } from "../../domain/video";
import { createUUID } from "../../pkg/uuid";
import { withTracerResult } from "../http/trace/cloudflare";
import { buildConflictUpdateColumns } from "./helper";
import {
  type InsertClipStats,
  type InsertVideo,
  type InsertVideoTranslation,
  channelTable,
  clipStatsTable,
  createInsertClipStats,
  createInsertVideo,
  creatorTable,
  creatorTranslationTable,
  videoTable,
  videoTranslationTable,
} from "./schema";
import type { DB } from "./transaction";

type ListQuery = {
  limit: number;
  page: number;
  platform?: string;
  memberType?: string;
  languageCode: string; // ISO 639-1 language code or [default] explicitly specified to narrow down to 1creator
  orderBy?: "asc" | "desc";
  channelIds?: string[];
  includeDeleted?: boolean;
  clipType?: "clip" | "short";
  orderKey?: "publishedAt" | "viewCount";
  videoIds?: string[]; // Filter by specific video IDs
  beforePublishedAtDate?: Date;
  afterPublishedAtDate?: Date;
};

export interface IClipRepository {
  list(query: ListQuery): Promise<Result<Clips, AppError>>;
  batchUpsert(clips: Clips): Promise<Result<Clips, AppError>>;
  count(query: ListQuery): Promise<Result<number, AppError>>;
  batchDelete(clipIds: string[]): Promise<Result<void, AppError>>;
}

function buildFilters(query: ListQuery): SQL[] {
  const filters: SQL[] = [];
  const languageCode = query.languageCode || "default";

  if (query.platform) {
    filters.push(eq(videoTable.platformType, query.platform));
  }
  // Always filter for clip type
  filters.push(eq(videoTable.videoType, query.clipType ?? "clip"));

  if (!query.includeDeleted) {
    filters.push(eq(videoTable.deleted, false));
  }

  // Always add language filters with default fallback
  filters.push(eq(videoTranslationTable.languageCode, languageCode));
  filters.push(eq(creatorTranslationTable.languageCode, languageCode));

  if (query.memberType) {
    if (query.memberType !== "vspo_all") {
      filters.push(eq(creatorTable.memberType, query.memberType));
    }
  }
  if (query.channelIds && query.channelIds.length > 0) {
    filters.push(inArray(videoTable.channelId, query.channelIds));
  }

  if (query.videoIds && query.videoIds.length > 0) {
    filters.push(inArray(videoTable.id, query.videoIds));
  }

  if (query.afterPublishedAtDate) {
    filters.push(
      gte(videoTable.publishedAt, convertToUTCDate(query.afterPublishedAtDate)),
    );
  }

  if (query.beforePublishedAtDate) {
    filters.push(
      lte(
        videoTable.publishedAt,
        convertToUTCDate(query.beforePublishedAtDate),
      ),
    );
  }

  return filters;
}

export function createClipRepository(db: DB): IClipRepository {
  const list = async (query: ListQuery): Promise<Result<Clips, AppError>> => {
    return withTracerResult("ClipRepository", "list", async (span) => {
      AppLogger.debug("ClipRepository list", {
        query,
      });
      const filters = buildFilters(query);

      const clipResult = await wrap(
        db
          .select()
          .from(videoTable)
          .innerJoin(
            clipStatsTable,
            eq(videoTable.rawId, clipStatsTable.videoId),
          )
          .innerJoin(
            videoTranslationTable,
            eq(videoTable.rawId, videoTranslationTable.videoId),
          )
          .innerJoin(
            channelTable,
            eq(videoTable.channelId, channelTable.platformChannelId),
          )
          .innerJoin(creatorTable, eq(channelTable.creatorId, creatorTable.id))
          .innerJoin(
            creatorTranslationTable,
            eq(creatorTable.id, creatorTranslationTable.creatorId),
          )
          .where(and(...filters))
          .orderBy(
            query.orderKey === "publishedAt"
              ? query.orderBy === "asc" || !query.orderBy
                ? asc(videoTable.publishedAt)
                : desc(videoTable.publishedAt)
              : query.orderBy === "asc" || !query.orderBy
                ? asc(clipStatsTable.viewCount)
                : desc(clipStatsTable.viewCount),
          )
          .limit(query.limit)
          .offset(query.page * query.limit)
          .execute(),
        (err) =>
          new AppError({
            message: `Database error during clip list query: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (clipResult.val?.length === 0) {
        return Ok([]);
      }

      if (clipResult.err) {
        return Err(clipResult.err);
      }

      return Ok(
        createClips(
          clipResult.val.map((r) => {
            // Ensure all required fields are included and properly typed
            return {
              id: r.video.id,
              rawId: r.video.rawId,
              rawChannelID: r.video.channelId,
              title: r.video_translation.title,
              languageCode: TargetLangSchema.parse(
                r.video_translation.languageCode,
              ),
              description: r.video_translation.description,
              publishedAt: r.video.publishedAt
                ? convertToUTC(r.video.publishedAt)
                : "",
              platform: PlatformSchema.parse(r.video.platformType),
              tags: r.video.tags.split(","),
              viewCount: r.clip_stats.viewCount,
              thumbnailURL: r.video.thumbnailUrl,
              creatorName: r.creator_translation.name,
              creatorThumbnailURL: r.creator.representativeThumbnailUrl,
              link: r.video.link ?? "",
              type: ClipTypeSchema.parse(r.video.videoType),
              deleted: r.video.deleted,
              duration: r.video.duration ?? 0,
            };
          }),
        ),
      );
    });
  };

  const count = async (query: ListQuery): Promise<Result<number, AppError>> => {
    return withTracerResult("ClipRepository", "count", async (span) => {
      const filters = buildFilters(query);

      const clipResult = await wrap(
        db
          .select({ value: countDistinct(videoTable.id) })
          .from(videoTable)
          .innerJoin(
            clipStatsTable,
            eq(videoTable.rawId, clipStatsTable.videoId),
          )
          .innerJoin(
            videoTranslationTable,
            eq(videoTable.rawId, videoTranslationTable.videoId),
          )
          .innerJoin(
            channelTable,
            eq(videoTable.channelId, channelTable.platformChannelId),
          )
          .innerJoin(creatorTable, eq(channelTable.creatorId, creatorTable.id))
          .innerJoin(
            creatorTranslationTable,
            eq(creatorTable.id, creatorTranslationTable.creatorId),
          )
          .where(and(...filters))
          .execute(),
        (err) =>
          new AppError({
            message: `Database error during clip count query: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (clipResult.err) {
        return Err(clipResult.err);
      }

      return Ok(clipResult.val.at(0)?.value ?? 0);
    });
  };

  const batchUpsert = async (
    clips: Clips,
  ): Promise<Result<Clips, AppError>> => {
    return withTracerResult("ClipRepository", "batchUpsert", async (span) => {
      const dbVideos: InsertVideo[] = [];
      const dbClipStats: InsertClipStats[] = [];
      const dbVideoTranslation: InsertVideoTranslation[] = [];

      for (const v of clips) {
        const videoId = v.id || createUUID();
        const existingVideo = dbVideos.find((video) => video.rawId === v.rawId);
        if (!existingVideo && !v.translated) {
          dbVideos.push(
            createInsertVideo({
              id: videoId,
              rawId: v.rawId,
              channelId: v.rawChannelID,
              platformType: v.platform,
              videoType: v.type,
              publishedAt: convertToUTCDate(v.publishedAt),
              tags: v.tags.join(","),
              thumbnailUrl: v.thumbnailURL,
              link: v.link,
              deleted: v.deleted,
              duration: v.duration ?? 0,
            }),
          );
        }

        const existingClipStats = dbClipStats.find(
          (stats) => stats.videoId === v.rawId,
        );
        if (!existingClipStats && !v.translated) {
          dbClipStats.push(
            createInsertClipStats({
              id: createUUID(),
              videoId: v.rawId,
              viewCount: v.viewCount,
              updatedAt: getCurrentUTCDate(),
            }),
          );
        }

        const existingTranslation = dbVideoTranslation.find(
          (translation) =>
            translation.videoId === v.rawId &&
            translation.languageCode === v.languageCode,
        );
        if (!existingTranslation) {
          dbVideoTranslation.push({
            id: createUUID(),
            videoId: v.rawId,
            languageCode: v.languageCode,
            title: v.title,
            description: v.description,
            updatedAt: getCurrentUTCDate(),
          });
        }
      }

      let videoResult: Result<(typeof videoTable.$inferSelect)[], AppError> =
        Ok([]);
      if (dbVideos.length > 0) {
        videoResult = await wrap(
          db
            .insert(videoTable)
            .values(dbVideos)
            .onConflictDoUpdate({
              target: videoTable.rawId,
              set: buildConflictUpdateColumns(videoTable, [
                "publishedAt",
                "tags",
                "thumbnailUrl",
                "deleted",
              ]),
            })
            .returning()
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during video batch upsert: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (videoResult.err) {
          return Err(videoResult.err);
        }
      }

      let clipStatsResult: Result<
        (typeof clipStatsTable.$inferSelect)[],
        AppError
      > = Ok([]);
      if (dbClipStats.length > 0) {
        clipStatsResult = await wrap(
          db
            .insert(clipStatsTable)
            .values(dbClipStats)
            .onConflictDoUpdate({
              target: clipStatsTable.videoId,
              set: buildConflictUpdateColumns(clipStatsTable, [
                "viewCount",
                "updatedAt",
              ]),
            })
            .returning()
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during clip stats batch upsert: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (clipStatsResult.err) {
          return Err(clipStatsResult.err);
        }
      }

      let videoTranslationResult: Result<
        (typeof videoTranslationTable.$inferSelect)[],
        AppError
      > = Ok([]);
      if (dbVideoTranslation.length > 0) {
        videoTranslationResult = await wrap(
          db
            .insert(videoTranslationTable)
            .values(dbVideoTranslation)
            .onConflictDoUpdate({
              target: [
                videoTranslationTable.videoId,
                videoTranslationTable.languageCode,
              ],
              set: buildConflictUpdateColumns(videoTranslationTable, [
                "title",
                "description",
                "updatedAt",
              ]),
            })
            .returning()
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during video translation batch upsert: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (videoTranslationResult.err) {
          return Err(videoTranslationResult.err);
        }
      }

      return Ok(
        createClips(
          videoResult.val.map((r) => {
            const clipStats = clipStatsResult.val.find(
              (s) => s.videoId === r.rawId,
            );
            const videoTranslation = videoTranslationResult.val.find(
              (t) => t.videoId === r.rawId,
            );

            return {
              id: r.id,
              rawId: r.rawId,
              rawChannelID: r.channelId,
              title: videoTranslation?.title ?? "",
              description: videoTranslation?.description ?? "",
              languageCode: TargetLangSchema.parse(
                videoTranslation?.languageCode ?? "default",
              ),
              publishedAt: convertToUTC(r.publishedAt),
              platform: PlatformSchema.parse(r.platformType),
              tags: r.tags.split(","),
              viewCount: clipStats?.viewCount ?? 0,
              thumbnailURL: r.thumbnailUrl,
              link: r.link ?? "",
              type: ClipTypeSchema.parse(r.videoType),
              deleted: r.deleted,
            };
          }),
        ),
      );
    });
  };

  const batchDelete = async (
    clipIds: string[],
  ): Promise<Result<void, AppError>> => {
    return withTracerResult("ClipRepository", "batchDelete", async (span) => {
      const result = await wrap(
        db.delete(videoTable).where(inArray(videoTable.id, clipIds)).execute(),
        (err) =>
          new AppError({
            message: `Database error during clip batch delete: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (result.err) {
        return Err(result.err);
      }

      return Ok();
    });
  };

  return {
    list,
    count,
    batchUpsert,
    batchDelete,
  };
}
