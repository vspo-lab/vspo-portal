import { useTimeZoneContext } from "@/hooks";
import { formatDate } from "@/lib/utils";
import { Box, Typography } from "@mui/material";
import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import { useTranslation } from "next-i18next";
import NextLink from "next/link";
import type React from "react";
import { Link } from "../Elements";

type Props = {
  lastUpdateTimestamp?: number;
  description?: string;
};
export const Footer: React.FC<Props> = ({
  lastUpdateTimestamp,
  description,
}) => {
  const { t } = useTranslation("common");
  const { timeZone } = useTimeZoneContext();

  return (
    <Box
      sx={{
        mt: 4,
        mb: 2,
        textAlign: "center",
      }}
    >
      {description && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {description}
        </Typography>
      )}
      {lastUpdateTimestamp && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t("footer.lastUpdated", {
            date: formatDate(lastUpdateTimestamp, "yyyy/MM/dd HH:mm", {
              timeZone,
            }),
          })}
        </Typography>
      )}
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mt: 1,
        }}
      >
        <Link
          href={"/schedule/all"}
          sx={{
            color: "inherit",
            textDecoration: "none",
          }}
        >
          {t("footer.pages.home")}
        </Link>{" "}
        / <NextLink href={"/terms"}>{t("footer.pages.terms")}</NextLink> /{" "}
        <NextLink href={"/privacy-policy"}>
          {t("footer.pages.privacy")}
        </NextLink>
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mt: 1,
        }}
      >
        &copy; {t("spodule")} {getCurrentUTCDate().getFullYear()}
      </Typography>
    </Box>
  );
};
