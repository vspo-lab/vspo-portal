import { getPreviousDay } from "@vspo-lab/dayjs";
import { fetchEvents } from "@/features/shared/api/event";
import { fetchLivestreams } from "@/features/shared/api/livestream";
import type { Event, Livestream } from "@/features/shared/domain";

type Schedule = {
  events: Event[];
  livestreams: Livestream[];
};

type FetchScheduleParams = {
  startedDate: string;
  limit: number;
  locale: string;
  status: "live" | "upcoming" | "archive" | "all";
  order: "asc" | "desc";
  timeZone: string;
  memberType?: string;
  platform?: string;
  sessionId?: string;
};

/**
 * Fetches schedule data including events and livestreams.
 * Falls back to the previous day if no livestreams are found for status "all".
 * @param params - Schedule fetch parameters including date, locale, status, and optional filters.
 * @returns Events and livestreams for the requested schedule.
 */
const fetchSchedule = async (
  params: FetchScheduleParams,
): Promise<Schedule> => {
  const {
    startedDate,
    limit,
    locale,
    status,
    order,
    timeZone,
    memberType,
    platform,
    sessionId,
  } = params;

  const results = await Promise.allSettled([
    fetchEvents({
      startedDateFrom: startedDate,
      startedDateTo: startedDate,
      lang: locale,
      sessionId,
    }),
    fetchLivestreams({
      limit,
      lang: locale ?? "default",
      status: status || "all",
      order: order,
      timezone: timeZone,
      startedDate,
      memberType,
      platform,
      sessionId,
    }),
  ]);

  const events =
    results[0].status === "fulfilled" && !results[0].value.err
      ? results[0].value.val?.events || []
      : [];

  let livestreams =
    results[1].status === "fulfilled" && !results[1].value.err
      ? results[1].value.val?.livestreams || []
      : [];

  // Fallback logic: if no livestreams found for current date, try previous day
  if (livestreams.length === 0 && status === "all") {
    const previousDay = getPreviousDay(startedDate, timeZone);
    const fallbackResult = await fetchLivestreams({
      limit,
      lang: locale ?? "default",
      status: "all",
      order: order,
      timezone: timeZone,
      startedDate: previousDay,
      memberType,
      platform,
      sessionId,
    });

    if (!fallbackResult.err && fallbackResult.val?.livestreams) {
      livestreams = fallbackResult.val.livestreams;
    }
  }

  return {
    events,
    livestreams,
  };
};

export { fetchSchedule };
