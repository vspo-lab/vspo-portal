import { useRouter } from "next/router";
import type React from "react";
import { useEffect, useState } from "react";
import type { Event } from "@/features/shared/domain";
import type { Livestream } from "../../../shared/domain/livestream";
import { useGroupedLivestreams } from "../../hooks/useGroupedLivestreams";
import { ScheduleStatusPresenter } from "./presenter";

// Props received from getServerSideProps
type ScheduleStatusContainerProps = {
  livestreams: Livestream[];
  events: Event[];
  initialDate?: string;
  timeZone: string;
  locale: string;
  error?: string;
  liveStatus?: string;
  isArchivePage?: boolean;
};

export const ScheduleStatusContainer: React.FC<
  ScheduleStatusContainerProps
> = ({
  livestreams,
  events,
  timeZone = "Asia/Tokyo", // Default to JST if not provided
  locale = "ja-JP", // Default to Japanese if not provided
  liveStatus = "all", // Default to all if not provided
  isArchivePage = false, // Default to false if not provided
}) => {
  // Validate status to make sure it's one of the valid values
  const validStatus = ["all", "live", "upcoming"].includes(liveStatus)
    ? (liveStatus as "all" | "live" | "upcoming")
    : "all";

  const router = useRouter();
  const [currentStatusFilter, setCurrentStatusFilter] = useState<
    "live" | "upcoming" | "all"
  >(validStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // Use the custom hook for grouping and filtering logic
  const { livestreamsByDate, allTabLabel } = useGroupedLivestreams({
    livestreams,
    timeZone,
    locale,
    currentStatusFilter,
    liveStatus,
  });

  // Setup router events for loading state
  useEffect(() => {
    const handleStart = (url: string) => {
      // Only set loading state for tab navigation
      if (url.includes("/schedule/")) {
        setIsLoading(true);
      }
    };

    const handleComplete = () => {
      setIsLoading(false);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  const handleStatusFilterChange = (status: "live" | "upcoming" | "all") => {
    if (status === currentStatusFilter) {
      return;
    }
    setCurrentStatusFilter(status);
    router.push(`/${locale}/schedule/${status}`, undefined, { shallow: false });
  };

  const handleSearchDialogOpen = () => {
    setIsSearchDialogOpen(true);
  };

  const handleSearchDialogClose = () => {
    setIsSearchDialogOpen(false);
  };

  return (
    <ScheduleStatusPresenter
      livestreamsByDate={livestreamsByDate}
      events={events}
      timeZone={timeZone}
      statusFilter={currentStatusFilter}
      onStatusFilterChange={handleStatusFilterChange}
      isLoading={isLoading}
      isSearchDialogOpen={isSearchDialogOpen}
      onSearchDialogOpen={handleSearchDialogOpen}
      onSearchDialogClose={handleSearchDialogClose}
      allTabLabel={allTabLabel}
      isArchivePage={isArchivePage}
    />
  );
};
