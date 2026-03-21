"use client";

import type React from "react";
import { useState, useTransition } from "react";
import type { Event } from "@/features/shared/domain";
import { useRouter } from "@/i18n/navigation";
import type { Livestream } from "../../../shared/domain/livestream";
import { useGroupedLivestreams } from "../../hooks/useGroupedLivestreams";
import { ScheduleStatusPresenter } from "./presenter";

// Props received from the App Router server component
type ScheduleStatusContainerProps = {
  livestreams: Livestream[];
  events: Event[];
  timeZone: string;
  locale: string;
  liveStatus?: string;
  isArchivePage?: boolean;
};

export const ScheduleStatusContainer: React.FC<
  ScheduleStatusContainerProps
> = ({
  livestreams,
  events,
  timeZone = "Asia/Tokyo",
  locale = "ja-JP",
  liveStatus = "all",
  isArchivePage = false,
}) => {
  // Validate status to make sure it's one of the valid values
  const validStatus = ["all", "live", "upcoming"].includes(liveStatus)
    ? (liveStatus as "all" | "live" | "upcoming")
    : "all";

  const router = useRouter();
  const [currentStatusFilter, setCurrentStatusFilter] = useState<
    "live" | "upcoming" | "all"
  >(validStatus);
  const [isLoading, startTransition] = useTransition();
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // Use the custom hook for grouping and filtering logic
  const { livestreamsByDate, allTabLabel } = useGroupedLivestreams({
    livestreams,
    timeZone,
    locale,
    currentStatusFilter,
    liveStatus,
  });

  const handleStatusFilterChange = (status: "live" | "upcoming" | "all") => {
    if (status === currentStatusFilter) {
      return;
    }
    setCurrentStatusFilter(status);
    startTransition(() => {
      router.push(`/schedule/${status}`);
    });
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
