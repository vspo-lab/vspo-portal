import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { FreechatPageContainer } from "@/features/freechat/pages/FreechatPage/container";
import { fetchFreechats } from "@/features/shared/api/freechat";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";

export const dynamic = "force-dynamic";

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
  };
}

export default async function FreechatPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "freechat" });

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("x-session-id")?.value;

  const result = await fetchFreechats({ lang: locale, sessionId });

  const freechats = !result.err && result.val ? result.val.freechats : [];

  const lastUpdateTimestamp = getCurrentUTCDate().getTime();

  return (
    <ContentLayout
      title={t("title")}
      path="/freechat"
      lastUpdateTimestamp={lastUpdateTimestamp}
      maxPageWidth="lg"
      padTop
    >
      <FreechatPageContainer freechats={freechats} />
    </ContentLayout>
  );
}
