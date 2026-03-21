import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { fetchMultiviewService } from "@/features/multiview/api/multiviewService";
import { MultiviewPageContainer } from "@/features/multiview/pages/MultiviewPage/container";
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

export default async function MultiviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("x-session-id")?.value;

  const multiviewService = await fetchMultiviewService({
    locale,
    sessionId,
  });

  const lastUpdateTimestamp = getCurrentUTCDate().getTime();

  const t = await getTranslations({ locale, namespace: "multiview" });
  const title = t("meta.title");
  const description = t("meta.description");

  return (
    <ContentLayout
      title={title}
      description={description}
      lastUpdateTimestamp={lastUpdateTimestamp}
      path="/multiview"
      padTop={false}
      maxPageWidth={false}
    >
      <MultiviewPageContainer
        livestreams={multiviewService.livestreams}
        lastUpdateTimestamp={lastUpdateTimestamp}
      />
    </ContentLayout>
  );
}
