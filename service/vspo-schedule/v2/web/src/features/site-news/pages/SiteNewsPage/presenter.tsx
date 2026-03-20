import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { TFunction } from "next-i18next";
import { type FC, useMemo, useState } from "react";
import { Breadcrumb } from "@/features/shared/components/Elements";
import type { SiteNewsMarkdownItem } from "@/lib/markdown";
import { formatDate, getSiteNewsTagColor } from "@/lib/utils";
import type { SiteNewsTag } from "@/types/site-news";

type SiteNewsPagePresenterProps = {
  siteNewsItems: SiteNewsMarkdownItem[];
  locale: string;
  t: TFunction;
};

export const SiteNewsPagePresenter: FC<SiteNewsPagePresenterProps> = ({
  siteNewsItems,
  locale,
  t,
}) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const item of siteNewsItems) {
      for (const tag of item.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet);
  }, [siteNewsItems]);

  const filteredItems = selectedTag
    ? siteNewsItems.filter((item) => item.tags.includes(selectedTag))
    : siteNewsItems;

  return (
    <>
      <Toolbar disableGutters variant="dense" sx={{ alignItems: "end" }}>
        <Breadcrumb />
      </Toolbar>

      <Box sx={{ mt: "10px" }}>
        {/* Tag filter */}
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}>
          <Chip
            label={t("tagLabels.all", "All")}
            size="small"
            variant={selectedTag === null ? "filled" : "outlined"}
            color="primary"
            onClick={() => setSelectedTag(null)}
          />
          {allTags.map((tag) => (
            <Chip
              key={tag}
              label={t(`tagLabels.${tag}`)}
              size="small"
              variant={selectedTag === tag ? "filled" : "outlined"}
              color={getSiteNewsTagColor(tag as SiteNewsTag)}
              onClick={() => setSelectedTag(tag)}
            />
          ))}
        </Box>

        {/* Card grid */}
        <Grid container spacing={2}>
          {filteredItems.map((siteNewsItem) => (
            <Grid key={siteNewsItem.id} size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <CardActionArea
                  component={Link}
                  href={`/site-news/${siteNewsItem.id}`}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      {siteNewsItem.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        display: "block",
                        mb: 1,
                      }}
                    >
                      {formatDate(siteNewsItem.updated, "PPP", {
                        localeCode: locale,
                      })}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        flexWrap: "wrap",
                      }}
                    >
                      {siteNewsItem.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={t(`tagLabels.${tag}`)}
                          size="small"
                          variant="outlined"
                          color={getSiteNewsTagColor(tag as SiteNewsTag)}
                          sx={{ fontSize: "0.7rem" }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
};
