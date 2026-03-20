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

    // Fetch live, upcoming, and translations in parallel
    const [livestreamResult, upcomingResult, translations] = await Promise.all([
      fetchLivestreams({
        limit,
        lang: locale,
        status: "live",
        order: "desc",
        timezone,
        sessionId,
        memberType,
        platform,
      }),
      includeUpcoming
        ? fetchLivestreams({
            limit: 10,
            lang: locale,
            status: "upcoming",
            order: "desc",
            timezone,
            sessionId,
            memberType,
            platform,
          })
        : null,
      serverSideTranslations(locale, ["common", "multiview"]),
    ]);

    if (livestreamResult.err) {
      throw livestreamResult.err;
    }

    // Degrade gracefully: show live streams even if upcoming fetch fails
    // Deduplicate by id to prevent duplicate key errors in React
    const allStreams = [
      ...livestreamResult.val.livestreams,
      ...(upcomingResult?.val?.livestreams ?? []),
    ];
    const seen = new Set<string>();
    const livestreams = allStreams.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    // Sort: live first (most recent), then upcoming (soonest first)
    const sortedLivestreams = [...livestreams].sort((a, b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;

      const aTime = new Date(a.scheduledStartTime || 0).getTime();
      const bTime = new Date(b.scheduledStartTime || 0).getTime();

      return a.status === "live" ? bTime - aTime : aTime - bTime;
    });

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
