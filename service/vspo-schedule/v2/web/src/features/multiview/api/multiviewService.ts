import { IncomingMessage } from "http";
import { fetchLivestreams } from "@/features/shared/api/livestream";
import { Livestream } from "@/features/shared/domain";
import { serverSideTranslations } from "@/lib/i18n/server";
import { getSessionId } from "@/lib/utils";
import { AppError } from "@vspo-lab/error";

export type MultiviewServiceResponse = {
  livestreams: Livestream[];
  translations: Record<string, unknown>;
};

export type FetchMultiviewServiceParams = {
  locale: string;
  req?: IncomingMessage;
  timezone?: string;
  limit?: number;
  includeUpcoming?: boolean;
  memberType?: string;
  platform?: string;
};

export const fetchMultiviewService = async ({
  locale,
  req,
  timezone = "UTC",
  limit = 50,
  includeUpcoming = true,
  memberType = "vspo_all",
  platform,
}: FetchMultiviewServiceParams): Promise<MultiviewServiceResponse> => {
  try {
    const sessionId = req ? getSessionId(req) : undefined;

    // Fetch live streams using existing API
    const livestreamResult = await fetchLivestreams({
      limit,
      lang: locale,
      status: "live",
      order: "desc",
      timezone,
      sessionId,
      memberType,
      platform,
    });

    if (livestreamResult.err) {
      throw livestreamResult.err;
    }

    const upcomingLivestreamsResult = await fetchLivestreams({
      limit: includeUpcoming ? 10 : 0,
      lang: locale,
      status: "upcoming",
      order: "desc",
      timezone,
      sessionId,
      memberType,
      platform,
    });

    if (upcomingLivestreamsResult.err) {
      throw upcomingLivestreamsResult.err;
    }

    const { livestreams: liveLivestreams } = livestreamResult.val;
    const { livestreams: upcomingLivestreams } = upcomingLivestreamsResult.val;

    const livestreams = [...liveLivestreams, ...upcomingLivestreams];

    // Sort by status (live first) and then by scheduled start time
    const sortedLivestreams = livestreams.sort((a, b) => {
      // Live streams first
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;

      // Then sort by scheduled start time (most recent first for live, upcoming first for scheduled)
      const aTime = new Date(a.scheduledStartTime || 0).getTime();
      const bTime = new Date(b.scheduledStartTime || 0).getTime();

      if (a.status === "live" && b.status === "live") {
        return bTime - aTime; // Most recent live streams first
      }

      return aTime - bTime;
    });

    const translations = await serverSideTranslations(locale, [
      "common",
      "multiview",
    ]);

    return {
      livestreams: sortedLivestreams,
      translations,
    };
  } catch (error) {
    console.error("Failed to fetch multiview service data:", error);

    // Log the error with more context
    if (error instanceof AppError) {
      console.error("Multiview API Error:", {
        message: error.message,
        code: error.code,
        context: error.context,
      });
    }

    const translations = await serverSideTranslations(locale, [
      "common",
      "multiview",
    ]);

    return {
      livestreams: [],
      translations,
    };
  }
};
