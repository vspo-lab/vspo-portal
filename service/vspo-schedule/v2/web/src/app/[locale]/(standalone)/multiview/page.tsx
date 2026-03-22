import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { fetchMultiviewService } from "@/features/multiview/api/multiviewService";
import { MultiviewPageContainer } from "@/features/multiview/pages/MultiviewPage/container";
import { MultiviewSkeleton } from "@/features/shared/components/Elements/Loading/MultiviewSkeleton";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "multiview" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

/**
 * Async Server Component that performs all data fetching for the multiview page.
 * Rendered inside Suspense to enable streaming.
 * @precondition locale is a valid locale string.
 * @postcondition Returns the MultiviewPageContainer with fetched livestream data.
 * @idempotent Yes - given the same params and cookies, produces the same output.
 */
async function MultiviewContent({ locale }: { locale: string }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("x-session-id")?.value;

  const multiviewService = await fetchMultiviewService({
    locale,
    sessionId,
  });

  const lastUpdateTimestamp = getCurrentUTCDate().getTime();

  return (
    <MultiviewPageContainer
      livestreams={multiviewService.livestreams}
      lastUpdateTimestamp={lastUpdateTimestamp}
    />
  );
}

export default async function MultiviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const lastUpdateTimestamp = getCurrentUTCDate().getTime();

  const t = await getTranslations({ locale, namespace: "multiview" });
  const title = t("meta.title");

  return (
    <ContentLayout
      title={title}
      lastUpdateTimestamp={lastUpdateTimestamp}
      path="/multiview"
      padTop={false}
      maxPageWidth={false}
    >
      <Suspense fallback={<MultiviewSkeleton />}>
        <MultiviewContent locale={locale} />
      </Suspense>
    </ContentLayout>
  );
}
