import { useCallback, useEffect, useState } from "react";
import type { Analytics } from "../types";

interface UseRoomAnalyticsReturn {
  analytics: Analytics | null;
  isLoadingAnalytics: boolean;
  refreshAnalytics: () => Promise<void>;
}

export const useRoomAnalytics = (
  roomId: string | undefined,
): UseRoomAnalyticsReturn => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (roomId) {
      fetchAnalytics();
    }
  }, [roomId]);

  const fetchAnalytics = useCallback(async () => {
    if (!roomId) return;

    setIsLoadingAnalytics(true);
    try {
      // TODO: Implement API call
      const response = await fetch(
        `/api/watch-party/rooms/${roomId}/analytics`,
      );
      if (!response.ok) throw new Error("Failed to fetch analytics");

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [roomId]);

  const refreshAnalytics = useCallback(async () => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoadingAnalytics,
    refreshAnalytics,
  };
};
