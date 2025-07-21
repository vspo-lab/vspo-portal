import type React from "react";
import { LivestreamContentPresenter } from "@/features/schedule/pages/ScheduleStatus/components/LivestreamContent/presenter";
import type { Event } from "@/features/shared/domain";
import type { Livestream } from "@/features/shared/domain/livestream";

type LivestreamContentContainerProps = {
  livestreamsByDate: Record<string, Livestream[]>;
  events?: Event[];
  timeZone: string;
};

export const LivestreamContentContainer: React.FC<
  LivestreamContentContainerProps
> = ({ livestreamsByDate, timeZone }) => {
  return (
    <LivestreamContentPresenter
      livestreamsByDate={livestreamsByDate}
      timeZone={timeZone}
    />
  );
};
