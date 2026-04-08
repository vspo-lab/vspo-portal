import "server-only";
import { fetchLivestreams } from "@/features/shared/api/livestream";
import { Livestream } from "@/features/shared/domain";

export type MultiviewServiceResponse = {
  livestreams: Livestream[];
};

export type FetchMultiviewServiceParams = {
  locale: string;
  sessionId?: string;
  timezone?: string;
  limit?: number;
  includeUpcoming?: boolean;
  memberType?: string;
  platform?: string;
};

/**
 * Fetch livestreams for the multiview page.
 * @precondition locale must be a valid locale string.
 * @postcondition Returns livestreams sorted by status (live first) and time.
 * @idempotent Yes - read-only fetch.
 */
export const fetchMultiviewService = async ({
  locale,
  sessionId,
  timezone = "UTC",
  limit = 50,
  includeUpcoming = true,
  memberType = "vspo_all",
  platform,
}: FetchMultiviewServiceParams): Promise<MultiviewServiceResponse> => {
  // Fetch live and upcoming in parallel
  const [livestreamResult, upcomingResult] = await Promise.all([
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
  ]);

  if (livestreamResult.err) {
    console.error("Multiview API Error:", {
      message: livestreamResult.err.message,
      context: livestreamResult.err.context,
    });
    return { livestreams: [] };
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
  };
};
