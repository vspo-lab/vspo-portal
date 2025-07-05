import { Breadcrumb } from "@/features/shared/components/Elements";
import type { SiteNewsMarkdownItem } from "@/lib/markdown";
import { getSiteNewsTagColor } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { SiteNewsTag } from "@/types/site-news";
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
} from "@mui/material";
import type { TFunction } from "next-i18next";
import Link from "next/link";
import type * as React from "react";

type SiteNewsPagePresenterProps = {
  siteNewsItems: SiteNewsMarkdownItem[];
  locale: string;
  t: TFunction;
};

export const SiteNewsPagePresenter: React.FC<SiteNewsPagePresenterProps> = ({
  siteNewsItems,
  locale,
  t,
}) => {
  return (
    <>
      <Toolbar disableGutters variant="dense" sx={{ alignItems: "end" }}>
        <Breadcrumb />
      </Toolbar>

      <TableContainer
        component={Paper}
        sx={{
          marginTop: "10px",
          boxShadow: "0px 3px 5px 2px rgba(0, 0, 0, 0.3)",
          borderRadius: "20px",
          overflowX: "auto",
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  fontSize: "18px",
                  padding: "24px",
                }}
              >
                {t("tableHeaders.summary")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  fontSize: "18px",
                  padding: "24px 4px",
                }}
              >
                {t("tableHeaders.updateDate")}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  fontSize: "18px",
                  padding: "24px",
                }}
              >
                {t("tableHeaders.tags")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {siteNewsItems.map((siteNewsItem) => (
              <TableRow key={siteNewsItem.id}>
                <TableCell sx={{ fontSize: "16px", padding: "24px" }}>
                  <Link href={`/site-news/${siteNewsItem.id}`} passHref>
                    <Box sx={{ textDecoration: "none", color: "inherit" }}>
                      {siteNewsItem.title}
                    </Box>
                  </Link>
                </TableCell>
                <TableCell
                  sx={{ fontSize: "16px", padding: "24px 4px", minWidth: 120 }}
                >
                  {formatDate(siteNewsItem.updated, "PPP", {
                    localeCode: locale,
                  })}
                </TableCell>
                <TableCell sx={{ fontSize: "16px", padding: "24px" }}>
                  {siteNewsItem.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={t(`tagLabels.${tag}`)}
                      variant="outlined"
                      color={getSiteNewsTagColor(tag as SiteNewsTag)}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
