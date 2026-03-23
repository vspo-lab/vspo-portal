import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { formatDate } from "@/lib/utils";
import type { Livestream } from "../../shared/domain/livestream";
import { groupLivestreamsByDate } from "../utils/groupLivestreamsByDate";

type StatusFilter = "live" | "upcoming" | "all";

interface UseGroupedLivestreamsParams {
  /** Raw livestreams array. Used as fallback when groupedByDate is not provided. */
  livestreams: Livestream[];
  timeZone: string;
  locale: string;
  currentStatusFilter: StatusFilter;
  liveStatus: string;
  /** Pre-computed grouped livestreams from the server. When provided, skips client-side grouping. */
  groupedByDate?: Record<string, Livestream[]>;
}

interface UseGroupedLivestreamsReturn {
  livestreamsByDate: Record<string, Livestream[]>;
  firstDate: string | null;
  formattedDate: string;
  allTabLabel: string;
}

export const useGroupedLivestreams = ({
  livestreams,
  timeZone,
  locale,
  currentStatusFilter,
  liveStatus,
  groupedByDate,
}: UseGroupedLivestreamsParams): UseGroupedLivestreamsReturn => {
  const t = useTranslations("schedule");
  // Use server-precomputed groups when available; otherwise fall back to client-side grouping
  const livestreamsByDate = useMemo(() => {
    if (groupedByDate) return groupedByDate;
    return groupLivestreamsByDate(livestreams, timeZone);
  }, [livestreams, timeZone, groupedByDate]);

  // Process filtering, sorting, and metadata in a single useMemo
  const processedData = useMemo(() => {
    // Get first date for the All tab
    const firstDate =
      currentStatusFilter === "all"
        ? (() => {
            const dates = Object.keys(livestreamsByDate).sort();
            return dates.length > 0 ? dates[0] : null;
          })()
        : null;

    // Format first date for display
    const formattedDate = firstDate
      ? formatDate(firstDate, "M/d", { localeCode: locale, timeZone })
      : "";

    // Filter and sort livestreams based on the current status
    const filteredLivestreamsByDate = (() => {
      if (currentStatusFilter === "all") {
        // For archive pages, sort dates in descending order but streams in ascending order
        if (liveStatus === "archive") {
          const sortedByDate: Record<string, Livestream[]> = {};
          const sortedDates = Object.keys(livestreamsByDate).sort().reverse();

          for (const date of sortedDates) {
            sortedByDate[date] = [...livestreamsByDate[date]].sort(
              (a, b) =>
                new Date(a.scheduledStartTime).getTime() -
                new Date(b.scheduledStartTime).getTime(),
            );
          }

          return sortedByDate;
        }
        return livestreamsByDate;
      }

      const filtered: Record<string, Livestream[]> = {};
      const entries =
        liveStatus === "archive"
          ? Object.entries(livestreamsByDate).sort((a, b) =>
              b[0].localeCompare(a[0]),
            )
          : Object.entries(livestreamsByDate);

      for (const [date, streams] of entries) {
        let filteredStreams = streams.filter((stream) => {
          if (currentStatusFilter === "live") {
            return stream.status === "live";
          }
          return stream.status === "upcoming";
        });

        if (liveStatus === "archive") {
          filteredStreams = filteredStreams.sort(
            (a, b) =>
              new Date(a.scheduledStartTime).getTime() -
              new Date(b.scheduledStartTime).getTime(),
          );
        }

        if (filteredStreams.length > 0) {
          filtered[date] = filteredStreams;
        }
      }

      return filtered;
    })();

    // Prepare tab label
    const allTabLabel =
      liveStatus === "all" && formattedDate
        ? t("tabs.allWithDate", { date: formattedDate })
        : t("tabs.all");

    return {
      livestreamsByDate: filteredLivestreamsByDate,
      firstDate,
      formattedDate,
      allTabLabel,
    };
  }, [livestreamsByDate, currentStatusFilter, liveStatus, locale, timeZone, t]);

  return processedData;
};
