import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { fetchSchedule } from "@/features/schedule/api/scheduleService";
import { ScheduleStatusContainer } from "@/features/schedule/pages/ScheduleStatus/container";
import { favoriteSearchConditionSchema } from "@/features/schedule/types/favorite";
import {
  normalizeScheduleStatus,
  scheduleSearchParamsSchema,
} from "@/features/schedule/types/scheduleQuery";
import { groupLivestreamsByDate } from "@/features/schedule/utils/groupLivestreamsByDate";
import { ScheduleSkeleton } from "@/features/shared/components/Elements/Loading/ScheduleSkeleton";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import {
  DEFAULT_TIME_ZONE,
  SESSION_ID_COOKIE,
  TIME_ZONE_COOKIE,
} from "@/lib/Const";
import { generateAlternates } from "@/lib/metadata";
import { getSessionSecret, verifySessionId } from "@/lib/session";
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
  query: unknown;
}) {
  const cookieStore = await cookies();
  const timeZone =
    cookieStore.get(TIME_ZONE_COOKIE)?.value ?? DEFAULT_TIME_ZONE;
  const rawSessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;
  const sessionId =
    (await verifySessionId(rawSessionId, getSessionSecret())) ?? undefined;

  const normalizedStatus = normalizeScheduleStatus(status);
  const safeQuery = scheduleSearchParamsSchema.safeParse(query);
  const validatedQuery = safeQuery.success ? safeQuery.data : {};

  const favoriteCookie = cookieStore.get("favorite-search-condition")?.value;
  const favoriteCondition = (() => {
    if (!favoriteCookie) return null;
    try {
      const parsed = JSON.parse(favoriteCookie);
      const result = favoriteSearchConditionSchema.safeParse(parsed);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  })();

  const startedDate =
    validatedQuery.date ??
    formatDate(getCurrentUTCDate(), "yyyy-MM-dd", { timeZone });

  const limit =
    validatedQuery.limit ?? (normalizedStatus === "archive" ? 300 : 50);

  const order: "asc" | "desc" = normalizedStatus === "archive" ? "desc" : "asc";

  const memberType =
    favoriteCondition?.memberType && favoriteCondition.memberType !== "vspo_all"
      ? favoriteCondition.memberType
      : validatedQuery.memberType;

  const platform =
    (favoriteCondition?.platform !== "" ? favoriteCondition?.platform : null) ??
    validatedQuery.platform;

  const schedule = await fetchSchedule({
    startedDate,
    limit,
    locale: locale ?? "ja",
    status: normalizedStatus,
    order,
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
      liveStatus={normalizedStatus}
      isArchivePage={normalizedStatus === "archive"}
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
