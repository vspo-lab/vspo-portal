import { DEFAULT_LOCALE } from "@/lib/Const";
import { getInitializedI18nInstance } from "@/lib/utils";
import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { GetServerSidePropsContext } from "next";
import { fetchMultiviewService } from "../../api/multiviewService";
import type { MultiviewPageProps } from "./container";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const locale = context.locale || DEFAULT_LOCALE;

  const multiviewService = await fetchMultiviewService({
    locale,
    req: context.req,
  });

  const livestreams = multiviewService.livestreams;
  const translations = multiviewService.translations;

  const { t } = getInitializedI18nInstance(translations, "multiview");

  const title = t("meta.title", "ぶいすぽっ!マルチビュー");
  const description = t(
    "meta.description",
    "複数のぶいすぽっ!メンバーの配信を同時に視聴できるマルチビューワーです。",
  );

  const lastUpdateTimestamp = getCurrentUTCDate().getTime();

  return {
    props: {
      livestreams,
      lastUpdateTimestamp,
      meta: {
        title,
        description,
      },
      ...translations,
    } satisfies MultiviewPageProps,
  };
};
