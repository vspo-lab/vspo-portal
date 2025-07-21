import { Box, TextField, Toolbar } from "@mui/material";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type React from "react";
import { useEffect, useMemo, useRef } from "react";
import type { Event, EventsByDate } from "@/features/shared/domain";
import { useTimeZoneContext } from "@/hooks";
import { DEFAULT_LOCALE } from "@/lib/Const";
import { EventTimeline, YearMonthSelector } from "../../components/presenters";

export type MonthEventsPresenterProps = {
  events: Event[];
  prevYearMonth?: string;
  currentYearMonth: string;
  nextYearMonth?: string;
  isProcessing: boolean;
  searchText: string;
  onSearchChange: (text: string) => void;
};

export const Presenter: React.FC<MonthEventsPresenterProps> = ({
  events,
  currentYearMonth,
  prevYearMonth,
  nextYearMonth,
  isProcessing,
  searchText,
  onSearchChange,
}) => {
  const router = useRouter();
  const todayEventRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("common");
  const locale = router.locale ?? DEFAULT_LOCALE;
  const { timeZone } = useTimeZoneContext();

  const filteredEvents = useMemo(() => {
    if (searchText === "") return events;
    return events.filter((event) =>
      event.title.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [events, searchText]);

  let eventsByDate: EventsByDate = {};

  if (filteredEvents.length > 0) {
    eventsByDate = filteredEvents.reduce((acc: EventsByDate, event: Event) => {
      const date = event.startedDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as EventsByDate);
  }

  useEffect(() => {
    if (todayEventRef.current) {
      todayEventRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  if (isProcessing) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Toolbar
        disableGutters
        sx={(theme) => ({
          justifyContent: "center",
          color: theme.vars.palette.text.primary,
        })}
      >
        <YearMonthSelector
          prevYearMonth={prevYearMonth}
          currentYearMonth={currentYearMonth}
          nextYearMonth={nextYearMonth}
        />
      </Toolbar>

      <Box sx={{ pt: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          label={t("search")}
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ marginBottom: "20px" }}
        />

        <EventTimeline
          eventsByDate={eventsByDate}
          timeZone={timeZone}
          locale={locale}
        />
      </Box>
    </>
  );
};
