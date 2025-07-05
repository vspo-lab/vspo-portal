import { convertToUTC } from "@vspo-lab/dayjs";
import { AppError, Err, Ok, type Result, wrap } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import {
  type SQL,
  and,
  asc,
  countDistinct,
  desc,
  eq,
  inArray,
} from "drizzle-orm";
import { type Freechats, createFreechats } from "../../domain/freechat";
import { TargetLangSchema } from "../../domain/translate";
import { PlatformSchema } from "../../domain/video";
import { withTracerResult } from "../http/trace/cloudflare";
import {
  channelTable,
  creatorTable,
  creatorTranslationTable,
  videoTable,
  videoTranslationTable,
} from "./schema";
import type { DB } from "./transaction";

type ListQuery = {
  limit: number;
  page: number;
  memberType?: string;
  languageCode: string; // ISO 639-1 language code or [default] explicitly specified to narrow down to 1creator
  orderBy?: "asc" | "desc";
  orderKey?: "publishedAt" | "creatorName";
  channelIds?: string[];
  includeDeleted?: boolean;
};

export interface IFreechatRepository {
  list(query: ListQuery): Promise<Result<Freechats, AppError>>;
  count(query: ListQuery): Promise<Result<number, AppError>>;
}

function buildFilters(query: ListQuery): SQL[] {
  const filters: SQL[] = [];
  const languageCode = query.languageCode || "default";
  filters.push(eq(videoTable.videoType, "freechat"));
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

  return filters;
}

export function createFreechatRepository(db: DB): IFreechatRepository {
  const list = async (
    query: ListQuery,
  ): Promise<Result<Freechats, AppError>> => {
    return withTracerResult("FreechatRepository", "list", async (span) => {
      AppLogger.debug("FreechatRepository list", {
        query,
      });
      const filters = buildFilters(query);

      const freechatResult = await wrap(
        db
          .select()
          .from(videoTable)
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
                ? asc(creatorTranslationTable.name)
                : desc(creatorTranslationTable.name),
          )
          .limit(query.limit)
          .offset(query.page * query.limit)
          .execute(),
        (err) =>
          new AppError({
            message: `Database error during freechat list query: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (freechatResult.err) {
        return Err(freechatResult.err);
      }

      return Ok(
        createFreechats(
          freechatResult.val.map((r) => {
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
              viewCount: 0,
              thumbnailURL: r.video.thumbnailUrl,
              creatorName: r.creator_translation.name,
              creatorThumbnailURL: r.creator.representativeThumbnailUrl,
              link: r.video.link ?? "",
              deleted: r.video.deleted,
            };
          }),
        ),
      );
    });
  };

  const count = async (query: ListQuery): Promise<Result<number, AppError>> => {
    return withTracerResult("FreechatRepository", "count", async (span) => {
      const filters = buildFilters(query);

      const freechatResult = await wrap(
        db
          .select({ value: countDistinct(videoTable.id) })
          .from(videoTable)
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
            message: `Database error during freechat count query: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (freechatResult.err) {
        return Err(freechatResult.err);
      }

      return Ok(freechatResult.val.at(0)?.value ?? 0);
    });
  };

  return {
    list,
    count,
  };
}
