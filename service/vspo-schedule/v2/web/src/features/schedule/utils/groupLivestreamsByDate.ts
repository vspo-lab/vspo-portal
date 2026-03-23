import { formatDate, groupBy } from "@/lib/utils";
import type { Livestream } from "../../shared/domain/livestream";

/**
 * Groups livestreams by their scheduled start date (yyyy-MM-dd format).
 * This is a pure function safe for use in both server and client contexts.
 * @param livestreams - Array of livestreams to group.
 * @param timeZone - The time zone used to determine date boundaries.
 * @returns A record mapping date strings to arrays of livestreams.
 * @idempotent Yes - given the same inputs, always produces the same output.
 */
export const groupLivestreamsByDate = (
  livestreams: Livestream[],
  timeZone: string,
): Record<string, Livestream[]> => {
  const safeStreams = Array.isArray(livestreams) ? livestreams : [];
  return groupBy(safeStreams, (livestream) =>
    formatDate(livestream.scheduledStartTime, "yyyy-MM-dd", { timeZone }),
  );
};
