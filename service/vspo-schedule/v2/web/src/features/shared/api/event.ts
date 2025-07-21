import { type ListEvents200EventsItem, VSPOApi } from "@vspo-lab/api";
import type { BaseError, Result } from "@vspo-lab/error";
import { AppError, wrap } from "@vspo-lab/error";
import { getCloudflareEnvironmentContext } from "@/lib/cloudflare/context";
import type { Event } from "../domain/event";
import { eventSchema } from "../domain/event";

export type FetchEventsParams = {
  lang: string;
  startedDateFrom: string;
  startedDateTo: string;
};

export type EventFetchResult = Result<
  {
    events: Event[];
  },
  BaseError
>;

/**
 * Transforms API event data to domain Event model
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
 * Fetch events from the API
 */
export const fetchEvents = async ({
  startedDateFrom,
  startedDateTo,
  sessionId,
}: FetchEventsParams & {
  startedDate?: string;
  sessionId?: string;
}): Promise<EventFetchResult> => {
  const getEventsData = async (): Promise<{ events: Event[] }> => {
    const { cfEnv } = await getCloudflareEnvironmentContext();

    let events: Event[] = [];

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
        throw result.err;
      }

      events = transformEventsToDomain(result.val?.events);
    } else {
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
        throw result.err;
      }

      events = transformEventsToDomain(result.val?.events);
    }

    return { events };
  };

  return wrap(
    getEventsData(),
    (error) =>
      new AppError({
        message: "Failed to fetch events",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: { startedDateFrom, startedDateTo },
      }),
  );
};
