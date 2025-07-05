import type { IncomingMessage } from "node:http";
import { fetchEvents } from "@/features/shared/api/event";
import type { Event } from "@/features/shared/domain";
import { serverSideTranslations } from "@/lib/i18n/server";
import { getSessionId } from "@/lib/utils";
import type { SSRConfig } from "next-i18next";

type EventService = {
  events: Event[];
  translations: SSRConfig;
};

type FetchEventServiceParams = {
  startedDateFrom: string;
  startedDateTo: string;
  locale: string;
  req: IncomingMessage;
};

const fetchEventService = async (
  params: FetchEventServiceParams,
): Promise<EventService> => {
  const { startedDateFrom, startedDateTo, locale, req } = params;

  const sessionId = getSessionId(req);

  const results = await Promise.allSettled([
    fetchEvents({
      startedDateFrom,
      startedDateTo,
      sessionId,
      lang: locale,
    }),
    serverSideTranslations(locale, ["common", "events"]),
  ]);

  const events =
    results[0].status === "fulfilled" && !results[0].value.err
      ? results[0].value.val?.events || []
      : [];

  const translations =
    results[1].status === "fulfilled"
      ? results[1].value
      : await serverSideTranslations(locale, ["common", "events"]);

  return {
    events,
    translations,
  };
};

export { fetchEventService, type EventService, type FetchEventServiceParams };
