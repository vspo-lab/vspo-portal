import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { fetchClipService } from "@/features/clips/api/clipService";
import { ClipsHome } from "@/features/clips/pages/ClipsHome/container";
import {
  getPeriodStartDate,
  getSearchParam,
} from "@/features/clips/utils/params";
import { ClipsSkeleton } from "@/features/shared/components/Elements/Loading/ClipsSkeleton";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { generateAlternates } from "@/lib/metadata";

export const dynamic = "force-dynamic";

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
    alternates: generateAlternates("/clips"),
  };
}

/**
 * Async Server Component that performs all data fetching for the clips page.
 * Rendered inside Suspense to enable streaming.
 * @precondition period is a valid period filter.
 * @postcondition Returns the ClipsHome container with fetched clip data.
 * @idempotent No - output includes a current timestamp, so repeated calls with the same period may produce different results.
 */
async function ClipsContent({ period }: { period: string }) {
  const afterDate = getPeriodStartDate(period);

  const clipService = await fetchClipService({
    afterPublishedAtDate: afterDate,
  });

  const lastUpdateTimestamp = getCurrentUTCDate().getTime();

  return (
    <ClipsHome
      popularYoutubeClips={clipService.popularYoutubeClips}
      popularShortsClips={clipService.popularShortsClips}
      popularTwitchClips={clipService.popularTwitchClips}
      vspoMembers={clipService.vspoMembers}
      lastUpdateTimestamp={lastUpdateTimestamp}
      currentPeriod={period || "week"}
    />
  );
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
  const period = getSearchParam(resolvedSearchParams, "period", "week");

  const lastUpdateTimestamp = getCurrentUTCDate().getTime();

  const t = await getTranslations({ locale, namespace: "clips" });
  const title = t("home.meta.title");

  return (
    <ContentLayout
      title={title}
      path="/clips"
      lastUpdateTimestamp={lastUpdateTimestamp}
    >
      <Suspense fallback={<ClipsSkeleton />}>
        <ClipsContent period={period} />
      </Suspense>
    </ContentLayout>
  );
}
