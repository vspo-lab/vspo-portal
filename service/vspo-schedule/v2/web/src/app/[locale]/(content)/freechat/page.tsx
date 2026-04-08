import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FreechatPagePresenter } from "@/features/freechat/pages/FreechatPage/presenter";
import { fetchFreechats } from "@/features/shared/api/freechat";
import { FreechatSkeleton } from "@/features/shared/components/Elements/Loading/FreechatSkeleton";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { generateAlternates } from "@/lib/metadata";

export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "freechat" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${t("title")}`,
    description: t("description"),
    alternates: generateAlternates("/freechat"),
  };
}

/**
 * Async Server Component that performs all data fetching for the freechat page.
 * Rendered inside Suspense to enable streaming.
 * @precondition locale is a valid locale string.
 * @postcondition Returns the FreechatPagePresenter with fetched freechat data.
 * @idempotent Yes - given the same locale and unchanged backend data, produces the same output.
 */
async function FreechatContent({ locale }: { locale: string }) {
  const result = await fetchFreechats({ lang: locale });
  const freechats = !result.err && result.val ? result.val.freechats : [];

  return <FreechatPagePresenter freechats={freechats} />;
}

export default async function FreechatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "freechat" });

  const lastUpdateTimestamp = getCurrentUTCDate().getTime();

  return (
    <ContentLayout
      title={t("title")}
      path="/freechat"
      lastUpdateTimestamp={lastUpdateTimestamp}
      maxPageWidth="lg"
      padTop
    >
      <Suspense fallback={<FreechatSkeleton />}>
        <FreechatContent locale={locale} />
      </Suspense>
    </ContentLayout>
  );
}
