import { PlatformIcon } from "@/features/schedule/pages/ScheduleStatus/components/LivestreamContent/PlatformIcon";
import type { Video } from "@/features/shared/domain/video";
import { useVideoModalContext } from "@/hooks";
import { Box, Card, CardActionArea } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "next-i18next";
import Image from "next/image";
import { HighlightedVideoChip } from "../Chip";

type Props = {
  video: Video;
  children: React.ReactNode;
  highlight?: {
    label: string;
    color: string;
    bold: boolean;
  };
};

const StyledHighlightedVideoChip = styled(HighlightedVideoChip)(
  ({ theme }) => ({
    position: "absolute",
    top: "-12px",
    right: "6px",
    zIndex: "3",
    transformOrigin: "center right",
    [theme.breakpoints.down("md")]: {
      transform: "scale(0.875)",
      right: "5px",
    },
    [theme.breakpoints.down("sm")]: {
      transform: "scale(0.75)",
      right: "4px",
    },
  }),
);

const PlatformIconWrapper = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "8px",
  left: "8px",
  zIndex: 2,
  backgroundColor: "rgba(255, 255, 255, 0.6)",
  borderRadius: "4px",
  padding: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  [theme.breakpoints.down("sm")]: {
    top: "4px",
    left: "4px",
    padding: "3px",
  },
}));

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "highlightColor",
})<{ highlightColor?: string }>(({ theme, highlightColor }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
  border: highlightColor ? `3px solid ${highlightColor}` : "none",
  backgroundColor: "white",
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.gray,
  },
}));

const StyledCardMedia = styled(Box)({
  paddingTop: "56.25%",
  objectFit: "contain",
});

export const VideoCard: React.FC<Props> = ({ video, highlight, children }) => {
  const { pushVideo } = useVideoModalContext();
  const { t } = useTranslation("common");
  const platform = video.platform;
  return (
    <Box sx={{ position: "relative" }}>
      {highlight && (
        <StyledHighlightedVideoChip
          highlightColor={highlight.color}
          bold={highlight.bold}
        >
          {t(`liveStatus.${highlight.label}`)}
        </StyledHighlightedVideoChip>
      )}
      <StyledCard highlightColor={highlight?.color}>
        <CardActionArea onClick={() => pushVideo(video)}>
          <StyledCardMedia sx={{ position: "relative" }}>
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              style={{ objectFit: "cover" }}
            />
            {video.type === "livestream" && (
              <PlatformIconWrapper>
                <PlatformIcon platform={platform} />
              </PlatformIconWrapper>
            )}
          </StyledCardMedia>
          {children}
        </CardActionArea>
      </StyledCard>
    </Box>
  );
};
