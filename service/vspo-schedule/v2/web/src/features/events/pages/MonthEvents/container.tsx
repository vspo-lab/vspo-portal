import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { ContentLayout } from "@/features/shared/components/Layout";
import type { Event } from "@/features/shared/domain";
import type { NextPageWithLayout } from "@/pages/_app";
import { Presenter } from "./presenter";

export type MonthEventsProps = {
  events: Event[];
  yearMonth: string;
  lastUpdateTimestamp: number;
  meta: {
    title: string;
    description: string;
  };
};

// Container component (page logic)
export const MonthEvents: NextPageWithLayout<MonthEventsProps> = (props) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");

  // Handle search text changes
  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  // Calculate previous and next month
  const adjacentMonths = useMemo(() => {
    const current = dayjs(props.yearMonth);
    const prevMonth = current.subtract(1, "month");
    const nextMonth = current.add(1, "month");

    return {
      prevYearMonth: prevMonth.format("YYYY-MM"),
      nextYearMonth: nextMonth.format("YYYY-MM"),
    };
  }, [props.yearMonth]);

  useEffect(() => {
    setIsProcessing(false);
  }, []);

  // Use the presenter component
  return (
    <Presenter
      events={props.events}
      currentYearMonth={props.yearMonth}
      prevYearMonth={adjacentMonths.prevYearMonth}
      nextYearMonth={adjacentMonths.nextYearMonth}
      isProcessing={isProcessing}
      searchText={searchText}
      onSearchChange={handleSearchChange}
    />
  );
};

// Layout configuration
MonthEvents.getLayout = (page, pageProps) => {
  return (
    <ContentLayout
      title={pageProps.meta.title}
      description={pageProps.meta.description}
      lastUpdateTimestamp={pageProps.lastUpdateTimestamp}
      path={`/events/${pageProps.yearMonth}`}
      maxPageWidth="md"
    >
      {page}
    </ContentLayout>
  );
};
