import {
  convertToUTC,
  convertToUTCDate,
  getCurrentUTCDate,
} from "@vspo-lab/dayjs";
import { AppError, Err, Ok, type Result, wrap } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import {
  and,
  asc,
  countDistinct,
  desc,
  eq,
  gte,
  inArray,
  lte,
  type SQL,
} from "drizzle-orm";
import { createStreams, StatusSchema, type Streams } from "../../domain/stream";
import { TargetLangSchema } from "../../domain/translate";
import { PlatformSchema } from "../../domain/video";
import { createUUID } from "../../pkg/uuid";
import { withTracerResult } from "../http/trace/cloudflare";
import { buildConflictUpdateColumns } from "./helper";
import {
  channelTable,
  createInsertStreamStatus,
  createInsertVideo,
  creatorTable,
  creatorTranslationTable,
  type InsertStreamStatus,
  type InsertVideo,
  type InsertVideoTranslation,
  streamStatusTable,
  videoTable,
  videoTranslationTable,
} from "./schema";
import type { DB } from "./transaction";

type ListQuery = {
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
  channelIds?: string[];
  includeDeleted?: boolean;
};

export interface IStreamRepository {
  list(query: ListQuery): Promise<Result<Streams, AppError>>;
  batchUpsert(streams: Streams): Promise<Result<Streams, AppError>>;
  count(query: ListQuery): Promise<Result<number, AppError>>;
  batchDelete(streamIds: string[]): Promise<Result<void, AppError>>;
  deletedListIds(): Promise<Result<string[], AppError>>;
}

const buildFilters = (query: ListQuery): SQL[] => {
  const filters: SQL[] = [];
  const languageCode = query.languageCode || "default";

  if (query.platform) {
    filters.push(eq(videoTable.platformType, query.platform));
  }
  filters.push(eq(videoTable.videoType, "vspo_stream"));
  if (query.status) {
    filters.push(eq(streamStatusTable.status, query.status));
  }
  if (query.startDateFrom) {
    filters.push(
      gte(streamStatusTable.startedAt, convertToUTCDate(query.startDateFrom)),
    );
  }

  if (query.startDateTo) {
    filters.push(
      lte(streamStatusTable.startedAt, convertToUTCDate(query.startDateTo)),
    );
  }
  if (query.endedAt) {
    filters.push(
      lte(streamStatusTable.endedAt, convertToUTCDate(query.endedAt)),
    );
  }

  if (!query.includeDeleted) {
    filters.push(eq(videoTable.deleted, false));
  }

  filters.push(eq(videoTranslationTable.languageCode, languageCode));
  filters.push(eq(creatorTranslationTable.languageCode, languageCode));

  if (query.memberType) {
    if (query.memberType !== "vspo_all" && query.memberType !== "custom") {
      filters.push(eq(creatorTable.memberType, query.memberType));
    }
  }
  if (query.channelIds && query.channelIds.length > 0) {
    filters.push(inArray(videoTable.channelId, query.channelIds));
  }
  if (query.creatorIds && query.creatorIds.length > 0) {
    filters.push(inArray(creatorTable.id, query.creatorIds));
  }

  return filters;
};

export const createStreamRepository = (db: DB): IStreamRepository => {
  const list = async (query: ListQuery): Promise<Result<Streams, AppError>> => {
    return withTracerResult("StreamRepository", "list", async (_span) => {
      AppLogger.debug("StreamRepository list", {
        query,
      });
      const filters = buildFilters(query);

      const streamResult = await wrap(
        db
          .select()
          .from(videoTable)
          .innerJoin(
            streamStatusTable,
            eq(videoTable.rawId, streamStatusTable.videoId),
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
            query.orderBy === "asc" || !query.orderBy
              ? asc(streamStatusTable.startedAt)
              : desc(streamStatusTable.startedAt),
          )
          .limit(query.limit)
          .offset(query.page * query.limit)
          .execute(),
        (err) =>
          new AppError({
            message: `Database error during stream list query: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (streamResult.val?.length === 0) {
        return Ok([]);
      }

      if (streamResult.err) {
        return Err(streamResult.err);
      }

      return Ok(
        createStreams(
          streamResult.val.map((r) => ({
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
            startedAt: r.stream_status.startedAt
              ? convertToUTC(r.stream_status.startedAt)
              : null,
            endedAt: r.stream_status.endedAt
              ? convertToUTC(r.stream_status.endedAt)
              : null,
            platform: PlatformSchema.parse(r.video.platformType),
            status: StatusSchema.parse(r.stream_status.status),
            tags: r.video.tags.split(","),
            viewCount: r.stream_status.viewCount,
            thumbnailURL: r.video.thumbnailUrl,
            creatorName: r.creator_translation.name,
            creatorThumbnailURL: r.creator.representativeThumbnailUrl,
            link: r.video.link ?? "",
          })),
        ),
      );
    });
  };

  const count = async (query: ListQuery): Promise<Result<number, AppError>> => {
    return withTracerResult("StreamRepository", "count", async (_span) => {
      const filters = buildFilters(query);

      const streamResult = await wrap(
        db
          .select({ value: countDistinct(videoTable.id) })
          .from(videoTable)
          .innerJoin(
            streamStatusTable,
            eq(videoTable.rawId, streamStatusTable.videoId),
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
            message: `Database error during stream count query: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (streamResult.err) {
        return Err(streamResult.err);
      }

      return Ok(streamResult.val.at(0)?.value ?? 0);
    });
  };

  const batchUpsert = async (
    streams: Streams,
  ): Promise<Result<Streams, AppError>> => {
    return withTracerResult(
      "StreamRepository",
      "batchUpsert",
      async (_span) => {
        const dbVideos: InsertVideo[] = [];
        const dbStreamStatus: InsertStreamStatus[] = [];
        const dbVideoTranslation: InsertVideoTranslation[] = [];

        for (const v of streams) {
          const videoId = v.id || createUUID();
          const existingVideo = dbVideos.find(
            (video) => video.rawId === v.rawId,
          );
          if (!existingVideo && !v.translated) {
            dbVideos.push(
              createInsertVideo({
                id: videoId,
                rawId: v.rawId,
                channelId: v.rawChannelID,
                platformType: v.platform,
                videoType: "vspo_stream",
                publishedAt: convertToUTCDate(v.publishedAt),
                tags: v.tags.join(","),
                thumbnailUrl: v.thumbnailURL,
                link: v.link,
                deleted: v.deleted,
              }),
            );
          }

          const existingStreamStatus = dbStreamStatus.find(
            (status) => status.videoId === v.rawId,
          );
          if (!existingStreamStatus && !v.translated) {
            dbStreamStatus.push(
              createInsertStreamStatus({
                id: createUUID(),
                videoId: v.rawId,
                status: v.status,
                startedAt: v.startedAt ? convertToUTCDate(v.startedAt) : null,
                endedAt: v.endedAt ? convertToUTCDate(v.endedAt) : null,
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

        let streamStatusResult: Result<
          (typeof streamStatusTable.$inferSelect)[],
          AppError
        > = Ok([]);
        if (dbStreamStatus.length > 0) {
          streamStatusResult = await wrap(
            db
              .insert(streamStatusTable)
              .values(dbStreamStatus)
              .onConflictDoUpdate({
                target: streamStatusTable.videoId,
                set: buildConflictUpdateColumns(streamStatusTable, [
                  "status",
                  "startedAt",
                  "endedAt",
                  "viewCount",
                  "updatedAt",
                ]),
              })
              .returning()
              .execute(),
            (err) =>
              new AppError({
                message: `Database error during stream status batch upsert: ${err.message}`,
                code: "INTERNAL_SERVER_ERROR",
                cause: err,
              }),
          );

          if (streamStatusResult.err) {
            return Err(streamStatusResult.err);
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
          createStreams(
            videoResult.val.map((r) => {
              const streamStatus = streamStatusResult.val.find(
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
                startedAt: streamStatus?.startedAt
                  ? convertToUTC(streamStatus.startedAt)
                  : null,
                endedAt: streamStatus?.endedAt
                  ? convertToUTC(streamStatus.endedAt)
                  : null,
                platform: PlatformSchema.parse(r.platformType),
                status: StatusSchema.parse(streamStatus?.status ?? "unknown"),
                tags: r.tags.split(","),
                viewCount: streamStatus?.viewCount ?? 0,
                thumbnailURL: r.thumbnailUrl,
                link: r.link ?? "",
              };
            }),
          ),
        );
      },
    );
  };

  const batchDelete = async (
    streamIds: string[],
  ): Promise<Result<void, AppError>> => {
    return withTracerResult(
      "StreamRepository",
      "batchDelete",
      async (_span) => {
        const result = await wrap(
          db
            .delete(videoTable)
            .where(inArray(videoTable.id, streamIds))
            .execute(),
          (err) =>
            new AppError({
              message: `Database error during stream batch delete: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (result.err) {
          return Err(result.err);
        }

        return Ok();
      },
    );
  };

  const deletedListIds = async (): Promise<Result<string[], AppError>> => {
    return withTracerResult(
      "StreamRepository",
      "deletedListIds",
      async (_span) => {
        const result = await wrap(
          db
            .select({ rawId: videoTable.rawId })
            .from(videoTable)
            .where(eq(videoTable.deleted, true)),
          (err) =>
            new AppError({
              message: `Database error during stream deleted list: ${err.message}`,
              code: "INTERNAL_SERVER_ERROR",
              cause: err,
            }),
        );

        if (result.err) {
          return Err(result.err);
        }

        return Ok(result.val.map((v) => v.rawId));
      },
    );
  };

  return {
    list,
    count,
    batchUpsert,
    batchDelete,
    deletedListIds,
  };
};
