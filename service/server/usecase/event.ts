import { type AppError, Ok, type Result } from "@vspo-lab/error";
import type { EventVisibility, VspoEvent, VspoEvents } from "../domain/event";
import { createPage, type Page } from "../domain/pagination";
import type { IAppContext } from "../infra/dependency";
import { withTracerResult } from "../infra/http/trace";

export type UpsertEventParam = VspoEvent;
export type BatchUpsertEventParam = VspoEvent[];

export type ListEventsQuery = {
  limit: number;
  page: number;
  orderBy?: "asc" | "desc";
  visibility?: EventVisibility;
  startedDateFrom?: string;
  startedDateTo?: string;
};

export type ListEventsResponse = {
  events: VspoEvents;
  pagination: Page;
};

export interface IEventInteractor {
  list(query: ListEventsQuery): Promise<Result<ListEventsResponse, AppError>>;
  upsert(params: UpsertEventParam): Promise<Result<VspoEvent, AppError>>;
  get(id: string): Promise<Result<VspoEvent | null, AppError>>;
  delete(eventId: string): Promise<Result<void, AppError>>;
  batchUpsert(
    events: BatchUpsertEventParam,
  ): Promise<Result<VspoEvents, AppError>>;
  batchDelete(eventIds: string[]): Promise<Result<void, AppError>>;
}

export const createEventInteractor = (
  context: IAppContext,
): IEventInteractor => {
  const INTERACTOR_NAME = "EventInteractor";

  const list = async (
    query: ListEventsQuery,
  ): Promise<Result<ListEventsResponse, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "list", async () => {
      return context.runInTx(async (repos, _services) => {
        const events = await repos.eventRepository.list(query);

        if (events.err) {
          return events;
        }

        const pagination = await repos.eventRepository.count(query);

        if (pagination.err) {
          return pagination;
        }

        return Ok({
          events: events.val,
          pagination: createPage({
            currentPage: query.page,
            limit: query.limit,
            totalCount: pagination.val,
          }),
        });
      });
    });
  };

  const upsert = async (
    params: UpsertEventParam,
  ): Promise<Result<VspoEvent, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "upsert", async () => {
      return context.runInTx(async (repos, _services) => {
        return repos.eventRepository.upsert(params);
      });
    });
  };

  const get = async (
    id: string,
  ): Promise<Result<VspoEvent | null, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "get", async () => {
      return context.runInTx(async (repos, _services) => {
        return repos.eventRepository.get(id);
      });
    });
  };

  const deleteEvent = async (
    eventId: string,
  ): Promise<Result<void, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "delete", async () => {
      return context.runInTx(async (repos, _services) => {
        return repos.eventRepository.delete(eventId);
      });
    });
  };

  const batchUpsert = async (
    events: BatchUpsertEventParam,
  ): Promise<Result<VspoEvents, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "batchUpsert", async () => {
      return context.runInTx(async (repos, _services) => {
        return repos.eventRepository.batchUpsert(events);
      });
    });
  };

  const batchDelete = async (
    eventIds: string[],
  ): Promise<Result<void, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "batchDelete", async () => {
      return context.runInTx(async (repos, _services) => {
        return repos.eventRepository.batchDelete(eventIds);
      });
    });
  };

  return {
    list,
    upsert,
    get,
    delete: deleteEvent,
    batchUpsert,
    batchDelete,
  };
};
