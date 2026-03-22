"use client";

import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import type { SiteNewsMarkdownItem } from "@/lib/markdown.types";
import { SiteNewsPagePresenter } from "./presenter";

type SiteNewsPageContainerProps = {
  siteNewsItems: SiteNewsMarkdownItem[];
};

export const SiteNewsPageContainer: React.FC<SiteNewsPageContainerProps> = ({
  siteNewsItems,
}) => {
  const locale = useLocale();
  const t = useTranslations("site-news");

  return (
    <SiteNewsPagePresenter
      siteNewsItems={siteNewsItems}
      locale={locale}
      t={t}
    />
  );
};
