import type { GetServerSideProps } from "next";
import { DEFAULT_LOCALE } from "@/lib/Const";
import { serverSideTranslations } from "@/lib/i18n/server";
import { getSiteNewsItem, type SiteNewsMarkdownItem } from "@/lib/markdown";
import { getInitializedI18nInstance } from "@/lib/utils";

type Params = {
  id: string;
};

export type SiteNewsDetailPageProps = {
  siteNewsItem: SiteNewsMarkdownItem;
  meta: {
    title: string;
  };
};

export const getServerSideProps: GetServerSideProps<
  SiteNewsDetailPageProps,
  Params
> = async ({ params, locale = DEFAULT_LOCALE }) => {
  if (!params) {
    return {
      notFound: true,
    };
  }

  const id = params.id;
  const siteNewsItem = await getSiteNewsItem(locale, id);

  if (!siteNewsItem) {
    return {
      notFound: true,
    };
  }

  const translations = await serverSideTranslations(locale, [
    "common",
    "site-news",
  ]);
  const { t } = getInitializedI18nInstance(translations, "site-news");

  return {
    props: {
      ...translations,
      siteNewsItem,
      meta: {
        title: t("title"),
      },
    },
  };
};
