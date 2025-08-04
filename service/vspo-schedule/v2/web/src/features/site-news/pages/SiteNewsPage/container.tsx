import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import type * as React from "react";
import { DEFAULT_LOCALE } from "@/lib/Const";
import type { SiteNewsMarkdownItem } from "@/lib/markdown";
import { SiteNewsPagePresenter } from "./presenter";

export type SiteNewsPageContainerProps = {
  siteNewsItems: SiteNewsMarkdownItem[];
};

export const SiteNewsPageContainer: React.FC<SiteNewsPageContainerProps> = ({
  siteNewsItems,
}) => {
  const router = useRouter();
  const locale = router.locale ?? DEFAULT_LOCALE;
  const { t } = useTranslation("site-news");

  return (
    <SiteNewsPagePresenter
      siteNewsItems={siteNewsItems}
      locale={locale}
      t={t}
    />
  );
};
