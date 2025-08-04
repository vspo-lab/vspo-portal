import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type * as React from "react";
import { DEFAULT_LOCALE } from "@/lib/Const";
import type { SiteNewsMarkdownItem } from "@/lib/markdown";
import { SiteNewsDetailPagePresenter } from "./presenter";

type SiteNewsDetailPageContainerProps = {
  siteNewsItem: SiteNewsMarkdownItem;
};

export const SiteNewsDetailPageContainer: React.FC<
  SiteNewsDetailPageContainerProps
> = ({ siteNewsItem }) => {
  const router = useRouter();
  const locale = router.locale ?? DEFAULT_LOCALE;
  const { t } = useTranslation("site-news");

  return (
    <SiteNewsDetailPagePresenter
      siteNewsItem={siteNewsItem}
      locale={locale}
      t={t}
    />
  );
};
