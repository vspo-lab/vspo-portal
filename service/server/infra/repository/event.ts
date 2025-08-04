import { convertToUTC, getCurrentUTCDate } from "@vspo-lab/dayjs";
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
import {
  createVspoEvent,
  createVspoEvents,
  type EventVisibility,
  EventVisibilitySchema,
  type VspoEvent,
  type VspoEvents,
} from "../../domain/event";
import { withTracerResult } from "../http/trace/cloudflare";
import { buildConflictUpdateColumns } from "./helper";
import { createInsertEvent, eventTable } from "./schema";
import type { DB } from "./transaction";

type ListQuery = {
  limit: number;
  page: number;
  orderBy?: "asc" | "desc";
  visibility?: EventVisibility;
  startedDateFrom?: string;
  startedDateTo?: string;
};

export interface IEventRepository {
  list(query: ListQuery): Promise<Result<VspoEvents, AppError>>;
  get(id: string): Promise<Result<VspoEvent | null, AppError>>;
  upsert(event: VspoEvent): Promise<Result<VspoEvent, AppError>>;
  count(query: ListQuery): Promise<Result<number, AppError>>;
  delete(eventId: string): Promise<Result<void, AppError>>;
  batchDelete(eventIds: string[]): Promise<Result<void, AppError>>;
  batchUpsert(events: VspoEvent[]): Promise<Result<VspoEvents, AppError>>;
}

function buildFilters(query: ListQuery): SQL[] {
  const filters: SQL[] = [];

  if (query.visibility) {
    filters.push(eq(eventTable.visibility, query.visibility));
  }

  if (query.startedDateFrom) {
    filters.push(gte(eventTable.startedDate, query.startedDateFrom));
  }

  if (query.startedDateTo) {
    filters.push(lte(eventTable.startedDate, query.startedDateTo));
  }

  return filters;
}

export function createEventRepository(db: DB): IEventRepository {
  const list = async (
    query: ListQuery,
  ): Promise<Result<VspoEvents, AppError>> => {
    return withTracerResult("EventRepository", "list", async (_span) => {
      AppLogger.debug("EventRepository list", {
        query,
      });
      const filters = buildFilters(query);

      const eventResult = await wrap(
        db
          .select()
          .from(eventTable)
          .where(and(...filters))
          .orderBy(
            query.orderBy === "asc" || !query.orderBy
              ? asc(eventTable.startedDate)
              : desc(eventTable.startedDate),
          )
          .limit(query.limit)
          .offset(query.page * query.limit)
          .execute(),
        (err) =>
          new AppError({
            message: `Database error during event list query: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (eventResult.val?.length === 0) {
        return Ok([]);
      }

      if (eventResult.err) {
        return Err(eventResult.err);
      }

      return Ok(
        createVspoEvents(
          eventResult.val.map((r) => {
            const event = {
              id: r.id,
              title: r.title,
              storageFileId: r.storageFileId ?? undefined,
              startedDate: r.startedDate,
              visibility: r.visibility as EventVisibility,
              tags: r.tags ? r.tags.split(",") : [],
              createdAt: convertToUTC(r.createdAt),
              updatedAt: convertToUTC(r.updatedAt),
            };

            return event;
          }),
        ),
      );
    });
  };

  const get = async (
    id: string,
  ): Promise<Result<VspoEvent | null, AppError>> => {
    return withTracerResult("EventRepository", "get", async (_span) => {
      const eventResult = await wrap(
        db.select().from(eventTable).where(eq(eventTable.id, id)).execute(),
        (err) =>
          new AppError({
            message: `Database error during event get query: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (eventResult.err) {
        return Err(eventResult.err);
      }

      if (eventResult.val.length === 0) {
        return Ok(null);
      }

      const r = eventResult.val[0];
      return Ok(
        createVspoEvent({
          id: r.id,
          title: r.title,
          storageFileId: r.storageFileId ?? undefined,
          startedDate: r.startedDate,
          visibility: r.visibility as EventVisibility,
          createdAt: convertToUTC(r.createdAt),
          updatedAt: convertToUTC(r.updatedAt),
        }),
      );
    });
  };

  const count = async (query: ListQuery): Promise<Result<number, AppError>> => {
    return withTracerResult("EventRepository", "count", async (_span) => {
      const filters = buildFilters(query);

      const countResult = await wrap(
        db
          .select({ value: countDistinct(eventTable.id) })
          .from(eventTable)
          .where(and(...filters))
          .execute(),
        (err) =>
          new AppError({
            message: `Database error during event count query: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (countResult.err) {
        return Err(countResult.err);
      }

      return Ok(countResult.val.at(0)?.value ?? 0);
    });
  };

  const upsert = async (
    event: VspoEvent,
  ): Promise<Result<VspoEvent, AppError>> => {
    return withTracerResult("EventRepository", "upsert", async (_span) => {
      const dbEvent = createInsertEvent({
        id: event.id,
        title: event.title,
        storageFileId: event.storageFileId,
        startedDate: event.startedDate,
        visibility: event.visibility,
        tags: event.tags.join(","),
        updatedAt: getCurrentUTCDate(),
      });

      const result = await wrap(
        db
          .insert(eventTable)
          .values(dbEvent)
          .onConflictDoUpdate({
            target: eventTable.id,
            set: buildConflictUpdateColumns(eventTable, [
              "title",
              "storageFileId",
              "startedDate",
              "visibility",
              "tags",
              "updatedAt",
            ]),
          })
          .returning()
          .execute(),
        (err) =>
          new AppError({
            message: `Database error during event upsert: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (result.err) {
        return Err(result.err);
      }

      const r = result.val[0];
      return Ok(
        createVspoEvent({
          id: r.id,
          title: r.title,
          storageFileId: r.storageFileId ?? undefined,
          startedDate: r.startedDate,
          visibility: r.visibility as EventVisibility,
          tags: r.tags ? r.tags.split(",") : [],
          createdAt: convertToUTC(r.createdAt),
          updatedAt: convertToUTC(r.updatedAt),
        }),
      );
    });
  };

  const deleteFunc = async (
    eventId: string,
  ): Promise<Result<void, AppError>> => {
    return withTracerResult("EventRepository", "delete", async (_span) => {
      const result = await wrap(
        db.delete(eventTable).where(eq(eventTable.id, eventId)).execute(),
        (err) =>
          new AppError({
            message: `Database error during event delete: ${err.message}`,
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

  const batchDelete = async (
    eventIds: string[],
  ): Promise<Result<void, AppError>> => {
    return withTracerResult("EventRepository", "batchDelete", async (_span) => {
      const result = await wrap(
        db.delete(eventTable).where(inArray(eventTable.id, eventIds)).execute(),
        (err) =>
          new AppError({
            message: `Database error during event batch delete: ${err.message}`,
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

  const batchUpsert = async (
    events: VspoEvent[],
  ): Promise<Result<VspoEvents, AppError>> => {
    return withTracerResult("EventRepository", "batchUpsert", async (_span) => {
      const dbEvents = events.map((event) =>
        createInsertEvent({
          id: event.id,
          title: event.title,
          storageFileId: event.storageFileId,
          startedDate: event.startedDate,
          visibility: event.visibility,
          tags: event.tags.join(","),
          updatedAt: getCurrentUTCDate(),
        }),
      );

      const result = await wrap(
        db
          .insert(eventTable)
          .values(dbEvents)
          .onConflictDoUpdate({
            target: eventTable.id,
            set: buildConflictUpdateColumns(eventTable, [
              "title",
              "storageFileId",
              "startedDate",
              "visibility",
              "tags",
              "updatedAt",
            ]),
          })
          .returning()
          .execute(),
        (err) =>
          new AppError({
            message: `Database error during event batch upsert: ${err.message}`,
            code: "INTERNAL_SERVER_ERROR",
            cause: err,
          }),
      );

      if (result.err) {
        return Err(result.err);
      }

      const vspoEvents = result.val.map((r) =>
        createVspoEvent({
          id: r.id,
          title: r.title,
          storageFileId: r.storageFileId ?? undefined,
          startedDate: r.startedDate,
          visibility: EventVisibilitySchema.parse(r.visibility),
          tags: r.tags ? r.tags.split(",") : [],
          createdAt: convertToUTC(r.createdAt),
          updatedAt: convertToUTC(r.updatedAt),
        }),
      );

      return Ok(vspoEvents);
    });
  };

  return {
    list,
    get,
    upsert,
    count,
    delete: deleteFunc,
    batchDelete,
    batchUpsert,
  };
}
