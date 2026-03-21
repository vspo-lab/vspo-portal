import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { fetchClipService } from "@/features/clips/api/clipService";
import { ClipsHome } from "@/features/clips/pages/ClipsHome/container";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";

export const dynamic = "force-dynamic";

/**
 * Get the ISO date string for N days ago.
 * @precondition days >= 0
 * @postcondition Returns a valid ISO date string.
 * @idempotent Yes - pure computation based on current time.
 */
const getDaysAgoISO = (days: number): string => {
  const date = getCurrentUTCDate();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "clips" });
  return {
    title: t("home.meta.title"),
    description: t("home.meta.description"),
  };
}

export default async function ClipsHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  const period = (resolvedSearchParams.period as string) || "week";

  // Set date filters based on period
  let afterDate: string | undefined;
  switch (period) {
    case "day":
      afterDate = getDaysAgoISO(1);
      break;
    case "week":
      afterDate = getDaysAgoISO(7);
      break;
    case "month":
      afterDate = getDaysAgoISO(30);
      break;
    case "year":
      afterDate = getDaysAgoISO(365);
      break;
    default:
      afterDate = undefined;
      break;
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("x-session-id")?.value;

  const clipService = await fetchClipService({
    afterPublishedAtDate: afterDate,
    sessionId,
  });

  const lastUpdateTimestamp = getCurrentUTCDate().getTime();

  const t = await getTranslations({ locale, namespace: "clips" });
  const title = t("home.meta.title");

  return (
    <ContentLayout
      title={title}
      path="/clips"
      lastUpdateTimestamp={lastUpdateTimestamp}
    >
      <ClipsHome
        popularYoutubeClips={clipService.popularYoutubeClips}
        popularShortsClips={clipService.popularShortsClips}
        popularTwitchClips={clipService.popularTwitchClips}
        vspoMembers={clipService.vspoMembers}
        lastUpdateTimestamp={lastUpdateTimestamp}
        currentPeriod={period || "week"}
      />
    </ContentLayout>
  );
}
