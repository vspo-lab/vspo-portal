import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import { AppError, wrap } from "@vspo-lab/error";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { fetchSchedule } from "@/features/schedule/api/scheduleService";
import { ScheduleStatusContainer } from "@/features/schedule/pages/ScheduleStatus/container";
import type { FavoriteSearchCondition } from "@/features/schedule/types/favorite";
import { groupLivestreamsByDate } from "@/features/schedule/utils/groupLivestreamsByDate";
import { ScheduleSkeleton } from "@/features/shared/components/Elements/Loading/ScheduleSkeleton";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import {
  DEFAULT_TIME_ZONE,
  SESSION_ID_COOKIE,
  TIME_ZONE_COOKIE,
} from "@/lib/Const";
import { generateAlternates } from "@/lib/metadata";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; status: string }>;
}): Promise<Metadata> {
  const { locale, status } = await params;
  const t = await getTranslations({ locale, namespace: "streams" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  let title = "";
  switch (status) {
    case "all":
      title = t("titles.streamSchedule");
      break;
    case "live":
      title = t("titles.live");
      break;
    case "upcoming":
      title = t("titles.upcoming");
      break;
    case "archive":
      title = t("titles.archive");
      break;
    default:
      title = t("titles.dateStatus", { date: status });
      break;
  }

  return {
    title: `${tCommon("spodule")} | ${title}`,
    description: t("description"),
    alternates: generateAlternates(`/schedule/${status}`),
  };
}

/**
 * Async Server Component that performs all data fetching for the schedule page.
 * Rendered inside Suspense to enable streaming.
 * @precondition locale and status are valid route params.
 * @postcondition Returns the ScheduleStatusContainer with fetched data.
 * @idempotent Yes - given the same params and cookies, produces the same output.
 */
async function ScheduleContent({
  locale,
  status,
  query,
}: {
  locale: string;
  status: string;
  query: {
    limit?: string;
    date?: string;
    memberType?: string;
    platform?: string;
  };
}) {
  const cookieStore = await cookies();
  const timeZone =
    cookieStore.get(TIME_ZONE_COOKIE)?.value ?? DEFAULT_TIME_ZONE;
  const sessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;

  // Favorite search conditions from cookie
  const favoriteCookie = cookieStore.get("favorite-search-condition")?.value;
  const parsedResult = favoriteCookie
    ? await wrap(
        Promise.resolve().then(
          () => JSON.parse(favoriteCookie) as FavoriteSearchCondition,
        ),
        (error) =>
          new AppError({
            message: "Invalid favorite cookie JSON",
            code: "INTERNAL_SERVER_ERROR",
            cause: error,
            context: {},
          }),
      )
    : { val: null, err: undefined };
  const favoriteCondition = parsedResult.err ? null : parsedResult.val;

  const startedDate =
    typeof query.date === "string"
      ? query.date
      : formatDate(getCurrentUTCDate(), "yyyy-MM-dd", { timeZone });

  const limit =
    typeof query.limit === "string"
      ? Number.parseInt(query.limit, 10)
      : status === "archive"
        ? 300
        : 50;

  const order = status === "archive" ? "desc" : "asc";

  // Use favorite conditions if available and valid, otherwise use query parameters
  const memberType =
    favoriteCondition?.memberType && favoriteCondition.memberType !== "vspo_all"
      ? favoriteCondition.memberType
      : typeof query.memberType === "string"
        ? query.memberType
        : undefined;

  const platform = favoriteCondition?.platform
    ? favoriteCondition.platform
    : typeof query.platform === "string"
      ? query.platform
      : undefined;

  const schedule = await fetchSchedule({
    startedDate,
    limit,
    locale: locale ?? "ja",
    status: (status as "live" | "upcoming" | "archive" | "all") || "all",
    order: order as "asc" | "desc",
    timeZone,
    memberType,
    platform,
    sessionId,
  });

  const livestreams = schedule.livestreams || [];
  const groupedByDate = groupLivestreamsByDate(livestreams, timeZone);

  return (
    <ScheduleStatusContainer
      livestreams={livestreams}
      groupedByDate={groupedByDate}
      events={schedule.events}
      timeZone={timeZone}
      locale={locale}
      liveStatus={status}
      isArchivePage={status === "archive"}
    />
  );
}

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; status: string }>;
  searchParams: Promise<{
    limit?: string;
    date?: string;
    memberType?: string;
    platform?: string;
  }>;
}) {
  const { locale, status } = await params;
  const query = await searchParams;

  const t = await getTranslations({ locale, namespace: "streams" });
  const footerMessage = t("membersOnlyStreamsHidden");

  let title = "";
  switch (status) {
    case "all":
      title = t("titles.streamSchedule");
      break;
    case "live":
      title = t("titles.live");
      break;
    case "upcoming":
      title = t("titles.upcoming");
      break;
    case "archive":
      title = t("titles.archive");
      break;
    default:
      title = t("titles.streamSchedule");
      break;
  }

  return (
    <ContentLayout
      title={title}
      path={`/schedule/${status}`}
      lastUpdateTimestamp={Date.now()}
      footerMessage={footerMessage}
    >
      <Suspense fallback={<ScheduleSkeleton />}>
        <ScheduleContent locale={locale} status={status} query={query} />
      </Suspense>
    </ContentLayout>
  );
}
