"use client";

import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import type { SiteNewsMarkdownItem } from "@/lib/markdown";
import { SiteNewsDetailPagePresenter } from "./presenter";

type SiteNewsDetailPageContainerProps = {
  siteNewsItem: SiteNewsMarkdownItem;
};

export const SiteNewsDetailPageContainer: React.FC<
  SiteNewsDetailPageContainerProps
> = ({ siteNewsItem }) => {
  const locale = useLocale();
  const t = useTranslations("site-news");

  return (
    <SiteNewsDetailPagePresenter
      siteNewsItem={siteNewsItem}
      locale={locale}
      t={t}
    />
  );
};
