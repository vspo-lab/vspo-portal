import { DEFAULT_LOCALE } from "@/lib/Const";
import { serverSideTranslations } from "@/lib/i18n/server";
import { type SiteNewsMarkdownItem, getAllSiteNewsItems } from "@/lib/markdown";
import { getInitializedI18nInstance } from "@/lib/utils";
import type { GetServerSideProps } from "next";

export type SiteNewsPageProps = {
  siteNewsItems: SiteNewsMarkdownItem[];
  meta: {
    title: string;
    description: string;
  };
};

export const getServerSideProps: GetServerSideProps<
  SiteNewsPageProps
> = async ({ locale = DEFAULT_LOCALE }) => {
  const translations = await serverSideTranslations(locale, [
    "common",
    "site-news",
  ]);
  const { t } = getInitializedI18nInstance(translations, "site-news");

  const siteNewsItems = await getAllSiteNewsItems(locale);

  return {
    props: {
      ...translations,
      siteNewsItems,
      meta: {
        title: t("title"),
        description: t("description"),
      },
    },
  };
};
