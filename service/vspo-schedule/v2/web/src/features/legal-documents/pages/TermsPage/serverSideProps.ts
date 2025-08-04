import type { GetStaticProps } from "next";
import { DEFAULT_LOCALE } from "@/lib/Const";
import { serverSideTranslations } from "@/lib/i18n/server";
import { getInitializedI18nInstance } from "@/lib/utils";

export type TermsPageProps = {
  meta: {
    title: string;
    description: string;
  };
};

export const getStaticProps: GetStaticProps<TermsPageProps> = async ({
  locale = DEFAULT_LOCALE,
}) => {
  const translations = await serverSideTranslations(locale, [
    "common",
    "terms",
  ]);
  const { t } = getInitializedI18nInstance(translations, "terms");

  return {
    props: {
      ...translations,
      meta: {
        title: t("title"),
        description: t("description"),
      },
    },
  };
};
