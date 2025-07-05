import { VideoCard } from "@/features/shared/components/Elements/Card/VideoCard";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import type React from "react";
import type { Clip } from "../../../shared/domain/clip";
export type ClipCardPresenterProps = {
  clip: Clip;
};

export const ClipCardPresenter: React.FC<ClipCardPresenterProps> = ({
  clip,
}) => {
  const { t } = useTranslation("clips");
  return (
    <VideoCard video={clip}>
      <Card sx={{ maxWidth: 345, height: "100%" }}>
        <CardContent sx={{ height: 130 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              mb: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {clip.title}
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary" noWrap>
              {clip.channelTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {t("viewCount", { views: clip.viewCount })}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </VideoCard>
  );
};
