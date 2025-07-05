import { DEFAULT_LOCALE } from "@/lib/Const";
import { getInitializedI18nInstance, matchesDateFormat } from "@/lib/utils";
import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { GetServerSideProps } from "next";
import { fetchEventService } from "../../api/eventService";
import type { MonthEventsProps } from "./container";

type Params = {
  /**
   * Date in format YYYY-MM
   */
  yearMonth: string;
};

export const getServerSideProps: GetServerSideProps<
  MonthEventsProps,
  Params
> = async ({ params, locale = DEFAULT_LOCALE, req }) => {
  const yearMonth = params?.yearMonth;
  const isValidYearMonth =
    yearMonth !== undefined && matchesDateFormat(yearMonth, "yyyy-MM");
  if (!isValidYearMonth) {
    return {
      notFound: true,
    };
  }

  const eventService = await fetchEventService({
    startedDateFrom: `${yearMonth}-01`,
    startedDateTo: `${yearMonth}-31`,
    locale,
    req,
  });

  const events = eventService.events;
  const translations = eventService.translations;

  if (events.length === 0) {
    console.error("No events found for period:", {
      yearMonth,
      startedDateFrom: `${yearMonth}-01`,
      startedDateTo: `${yearMonth}-31`,
    });
    return {
      notFound: true,
    };
  }

  const { t } = getInitializedI18nInstance(translations);

  return {
    props: {
      ...translations,
      events,
      yearMonth,
      lastUpdateTimestamp: getCurrentUTCDate().getTime(),
      meta: {
        title: t("title", { ns: "events" }),
        description: t("description", { ns: "events" }),
      },
    },
  };
};
