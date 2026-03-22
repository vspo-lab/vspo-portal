import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { fetchMultiviewService } from "@/features/multiview/api/multiviewService";
import { MultiviewPageContainer } from "@/features/multiview/pages/MultiviewPage/container";
import { MultiviewSkeleton } from "@/features/shared/components/Elements/Loading/MultiviewSkeleton";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { generateAlternates } from "@/lib/metadata";

export const revalidate = 60;

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
    alternates: generateAlternates("/multiview"),
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
  const multiviewService = await fetchMultiviewService({
    locale,
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
