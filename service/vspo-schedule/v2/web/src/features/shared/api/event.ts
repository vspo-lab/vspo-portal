import { type ListEvents200EventsItem, VSPOApi } from "@vspo-lab/api";
import {
  AppError,
  type BaseError,
  Err,
  type Result,
  wrap,
} from "@vspo-lab/error";
import { getCloudflareEnvironmentContext } from "@/lib/cloudflare/context";
import type { Event } from "../domain/event";
import { eventSchema } from "../domain/event";

type FetchEventsParams = {
  lang: string;
  startedDateFrom: string;
  startedDateTo: string;
};

type EventFetchResult = Result<
  {
    events: Event[];
  },
  BaseError
>;

/**
 * Transforms API event data to domain Event model.
 * Validates each event through eventSchema.
 */
const transformEventsToDomain = (
  apiEvents?: ListEvents200EventsItem[],
): Event[] => {
  if (!apiEvents) {
    return [];
  }
  return apiEvents.map((event) => {
    const eventData = {
      id: event.id || "",
      type: "event",
      title: event.title,
      startedDate: event.startedDate || "",
      contentSummary: {},
      isNotLink: false,
    } satisfies Event;
    return eventSchema.parse(eventData);
  });
};

/**
 * Fetch events from the API.
 * Precondition: params must contain valid date range.
 * Postcondition: returns Ok with events array, or Err on failure.
 */
export const fetchEvents = async ({
  startedDateFrom,
  startedDateTo,
  sessionId,
}: FetchEventsParams & {
  startedDate?: string;
  sessionId?: string;
}): Promise<EventFetchResult> => {
  const { cfEnv } = await getCloudflareEnvironmentContext();

  if (cfEnv) {
    const { APP_WORKER } = cfEnv;

    const result = await APP_WORKER.newEventUsecase().list({
      limit: 50,
      page: 0,
      visibility: "public",
      startedDateFrom: startedDateFrom,
      startedDateTo: startedDateTo,
    });

    if (result.err) {
      return Err(result.err);
    }

    return wrap(
      (async () => ({
        events: transformEventsToDomain(result.val?.events),
      }))(),
      (error) =>
        new AppError({
          message: "Failed to parse event data",
          code: "INTERNAL_SERVER_ERROR",
          cause: error,
          context: { startedDateFrom, startedDateTo },
        }),
    );
  }

  // Use regular VSPO API
  const client = new VSPOApi({
    baseUrl: process.env.API_URL_V2 || "",
    sessionId,
  });

  const result = await client.events.list({
    limit: "50",
    page: "0",
    visibility: "public" as const,
    startedDateFrom: startedDateFrom,
    startedDateTo: startedDateTo,
  });

  if (result.err) {
    return Err(result.err);
  }

  return wrap(
    (async () => ({
      events: transformEventsToDomain(result.val?.events),
    }))(),
    (error) =>
      new AppError({
        message: "Failed to parse event data",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: { startedDateFrom, startedDateTo },
      }),
  );
};
