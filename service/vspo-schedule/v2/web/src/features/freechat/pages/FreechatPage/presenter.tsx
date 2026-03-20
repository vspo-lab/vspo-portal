import { Box, Grid, Typography, useTheme } from "@mui/material";
import { useTranslation } from "next-i18next";
import type React from "react";
import type { Freechat } from "../../../shared/domain/freechat";
import { FreechatCard } from "../../components";

type FreechatPagePresenterProps = {
  freechats: Freechat[];
};

export const FreechatPagePresenter: React.FC<FreechatPagePresenterProps> = ({
  freechats,
}) => {
  const theme = useTheme();
  const { t } = useTranslation("freechat");

  const activeFreechats = freechats.filter((f) => f.status === "live");
  const upcomingFreechats = freechats.filter((f) => f.status === "upcoming");
  const archiveFreechats = freechats.filter(
    (f) => f.status === "ended" || f.status === "unknown",
  );

  return (
    <Box sx={{ width: "100%" }}>
      {activeFreechats.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: theme.vars.palette.customColors.status.success,
            }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t("active", { count: activeFreechats.length })}
          </Typography>
        </Box>
      )}

      {activeFreechats.length > 0 && (
        <>
          <Typography
            variant="subtitle2"
            sx={{ color: "text.secondary", mb: 1, mt: 2 }}
          >
            {t("sections.active")}
          </Typography>
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            {activeFreechats.map((freechat) => (
              <Grid key={freechat.id} size={{ xs: 6, sm: 4, md: 3 }}>
                <FreechatCard freechat={freechat} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {upcomingFreechats.length > 0 && (
        <>
          <Typography
            variant="subtitle2"
            sx={{ color: "text.secondary", mb: 1, mt: 2 }}
          >
            {t("sections.upcoming")}
          </Typography>
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            {upcomingFreechats.map((freechat) => (
              <Grid key={freechat.id} size={{ xs: 6, sm: 4, md: 3 }}>
                <FreechatCard freechat={freechat} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {archiveFreechats.length > 0 && (
        <>
          <Typography
            variant="subtitle2"
            sx={{ color: "text.secondary", mb: 1, mt: 2 }}
          >
            {t("sections.archive")}
          </Typography>
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            {archiveFreechats.map((freechat) => (
              <Grid key={freechat.id} size={{ xs: 6, sm: 4, md: 3 }}>
                <FreechatCard freechat={freechat} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};
