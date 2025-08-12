import { type AppError, Ok, type Result } from "@vspo-lab/error";
import type {
  VspoEvent as Event,
  VspoEvents as Events,
} from "../../domain/event";
import { createPage, type Page } from "../../domain/pagination";
import type { IAppContext } from "../../infra/dependency";
import { withTracerResult } from "../../infra/http/trace";

export type ListEventsQuery = {
  limit: number;
  page: number;
  eventIds?: string[];
  creatorIds?: string[];
  startAtFrom?: Date;
  startAtTo?: Date;
  endAtFrom?: Date;
  endAtTo?: Date;
  languageCode: string;
  orderBy?: "asc" | "desc";
};

export type ListEventsResponse = {
  events: Events;
  pagination: Page;
};

// Query Service Interface
export interface IEventQueryService {
  list(params: ListEventsQuery): Promise<Result<ListEventsResponse, AppError>>;
  get(id: string): Promise<Result<Event | null, AppError>>;
}

// Factory function
export const createEventQueryService = (
  context: IAppContext,
): IEventQueryService => {
  return {
    list: async (query) => {
      return await withTracerResult("listEvents", "execute", async () => {
        return context.runInTx(async (repos, _services) => {
          const events = await repos.eventRepository.list(query);
          if (events.err) {
            return events;
          }

          const count = await repos.eventRepository.count(query);
          if (count.err) {
            return count;
          }

          return Ok({
            events: events.val,
            pagination: createPage({
              currentPage: query.page,
              limit: query.limit,
              totalCount: count.val,
            }),
          });
        });
      });
    },
    get: async (id) => {
      return await withTracerResult("getEvent", "execute", async () => {
        return context.runInTx(async (repos, _services) => {
          const event = await repos.eventRepository.get(id);
          if (event.err) {
            return event;
          }
          return Ok(event.val);
        });
      });
    },
  };
};
