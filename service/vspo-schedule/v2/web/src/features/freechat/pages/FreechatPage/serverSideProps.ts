import { DEFAULT_LOCALE } from "@/lib/Const";
import { getInitializedI18nInstance } from "@/lib/utils";
import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { GetServerSideProps } from "next";
import type { Freechat } from "../../../shared/domain/freechat";
import { fetchFreechatService } from "../../api/freechatService";

export type FreechatPageProps = {
  freechats: Freechat[];
  lastUpdateTimestamp: number;
  meta: {
    title: string;
    description: string;
  };
};

export const getFreechatServerSideProps: GetServerSideProps<
  FreechatPageProps
> = async ({ locale = DEFAULT_LOCALE, req }) => {
  const freechatService = await fetchFreechatService({
    locale,
    req,
  });

  const freechats = freechatService.freechats;
  const translations = freechatService.translations;

  const { t } = getInitializedI18nInstance(translations, "freechat");

  return {
    props: {
      ...translations,
      freechats,
      lastUpdateTimestamp: getCurrentUTCDate().getTime(),
      meta: {
        title: t("title"),
        description: t("description"),
      },
    },
  };
};
