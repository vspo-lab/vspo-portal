"use client";

import { Box, Chip, Toolbar, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import type { useTranslations } from "next-intl";
import type * as React from "react";
import { Breadcrumb } from "@/features/shared/components/Elements";
import type { SiteNewsMarkdownItem } from "@/lib/markdown.types";
import { formatDate, getSiteNewsTagColor } from "@/lib/utils";

const TweetEmbed = dynamic(
  () =>
    import("@/features/shared/components/Elements/Card/TweetEmbed").then(
      (m) => ({
        default: m.TweetEmbed,
      }),
    ),
  { ssr: false },
);

type SiteNewsDetailPagePresenterProps = {
  siteNewsItem: SiteNewsMarkdownItem;
  locale: string;
  t: ReturnType<typeof useTranslations>;
};

export const SiteNewsDetailPagePresenter: React.FC<
  SiteNewsDetailPagePresenterProps
> = ({ siteNewsItem, locale, t }) => {
  const formattedDate = formatDate(siteNewsItem.updated, "PPP", {
    localeCode: locale,
  });

  return (
    <>
      <Toolbar disableGutters variant="dense" sx={{ alignItems: "end" }}>
        <Breadcrumb />
      </Toolbar>

      <Box>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ marginTop: "10px" }}
        >
          {siteNewsItem.title}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          {t("updateDate")}: {formattedDate}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          {t("tags")}:
          {siteNewsItem.tags.map((tag) => (
            <Chip
              key={tag}
              label={t(`tagLabels.${tag}`)}
              variant="outlined"
              color={getSiteNewsTagColor(tag)}
              sx={{ m: 0.5 }}
            />
          ))}
        </Typography>
        {siteNewsItem.html ? (
          <Box
            sx={{ marginBottom: "16px" }}
            dangerouslySetInnerHTML={{
              __html: siteNewsItem.html,
            }}
          />
        ) : (
          <Typography variant="body1" sx={{ marginBottom: "16px" }}>
            {siteNewsItem.content}
          </Typography>
        )}
        {siteNewsItem.tweetLink && (
          <TweetEmbed tweetLink={siteNewsItem.tweetLink} />
        )}
      </Box>
    </>
  );
};
