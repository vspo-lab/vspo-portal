import { Card, CardContent, Typography } from "@mui/material";
import type React from "react";
import type { Event } from "@/features/shared/domain";

export type EventCardProps = {
  event: Event;
  isEventToday: boolean;
  todayRef?: React.RefObject<HTMLDivElement | null>;
  isCompact?: boolean;
};

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isEventToday,
  todayRef,
  isCompact,
}) => {
  const matches = isCompact !== undefined ? isCompact : false;

  return (
    <Card
      sx={{
        marginBottom: "20px",
        border: isEventToday ? "2px solid red" : "none",
      }}
      ref={isEventToday ? todayRef : null}
    >
      <CardContent>
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontSize: matches ? "1.00rem" : "1.25rem",
            textAlign: "left",
          }}
        >
          {event.title}
        </Typography>
      </CardContent>
    </Card>
  );
};
