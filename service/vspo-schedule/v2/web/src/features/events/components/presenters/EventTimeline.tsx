import type { EventsByDate } from "@/features/shared/domain";
import { formatDate } from "@/lib/utils";
import Timeline from "@mui/lab/Timeline";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import { Typography, useMediaQuery } from "@mui/material";
import { convertToUTCDate, getCurrentUTCDate } from "@vspo-lab/dayjs";
import type React from "react";
import { useRef } from "react";
import { EventCard } from "./EventCard";

export type EventTimelineProps = {
  eventsByDate: EventsByDate;
  timeZone: string;
  locale: string;
  isCompact?: boolean;
};

export const EventTimeline: React.FC<EventTimelineProps> = ({
  eventsByDate,
  timeZone,
  locale,
  isCompact,
}) => {
  const todayEventRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width:600px)");
  const matches = isCompact ?? isMobile;

  return (
    <Timeline position="right" sx={{ padding: "0px" }}>
      {Object.entries(eventsByDate).map(([date, eventsOnDate], index) => {
        const currentDate = getCurrentUTCDate();
        currentDate.setHours(0, 0, 0, 0);
        const isFutureEvent = convertToUTCDate(date) > currentDate;

        return (
          <TimelineItem key={date}>
            <TimelineOppositeContent
              sx={{
                maxWidth: matches ? "0px" : "140px",
                textAlign: matches ? "left" : "right",
                padding: matches ? "0px" : "20px",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: "text.secondary",
                  marginLeft: matches ? "30px" : "0px",
                  width: matches ? "130px" : "100px",
                }}
              >
                {formatDate(date, "MM/dd (E)", { localeCode: locale })}
              </Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={isFutureEvent ? "success" : "grey"} />
              {Object.entries(eventsByDate).length - 1 !== index && (
                <TimelineConnector />
              )}
            </TimelineSeparator>
            <TimelineContent sx={{ py: matches ? "40px" : "20px", px: 2 }}>
              {eventsOnDate.map((event, eventIndex) => {
                const today = formatDate(getCurrentUTCDate(), "yyyy-MM-dd", {
                  timeZone,
                });
                const isEventToday = date === today;

                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    isEventToday={isEventToday}
                    todayRef={isEventToday ? todayEventRef : undefined}
                    isCompact={matches}
                  />
                );
              })}
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
};
