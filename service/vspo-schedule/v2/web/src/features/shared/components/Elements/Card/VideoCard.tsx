import { Box, Card, CardActionArea } from "@mui/material";
import { styled } from "@mui/material/styles";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { PlatformIcon } from "@/features/schedule/pages/ScheduleStatus/components/LivestreamContent/PlatformIcon";
import type { Video } from "@/features/shared/domain/video";
import { useVideoModalContext } from "@/hooks";
import { HighlightedVideoChip } from "../Chip";

type Props = {
  video: Video;
  children: React.ReactNode;
  highlight?: {
    label: string;
    color: string;
    bold: boolean;
  };
  /** Set to true for above-the-fold images (LCP candidates) */
  priority?: boolean;
  /** Content rendered as overlay on the thumbnail (e.g., LIVE badge, viewer count) */
  thumbnailOverlay?: React.ReactNode;
  /** Apply muted visual treatment for archived content */
  isArchive?: boolean;
};

const StyledHighlightedVideoChip = styled(HighlightedVideoChip, {
  shouldForwardProp: (prop) => prop !== "isLive",
})(({ theme }) => ({
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
}));

const PlatformIconWrapper = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "8px",
  left: "8px",
  zIndex: 2,
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  borderRadius: "6px",
  padding: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
  },
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
  border: "none",
  borderRadius: "12px",
  backgroundColor: theme.vars.palette.background.paper,
  boxShadow: highlightColor
    ? `0 0 0 2px color-mix(in srgb, ${highlightColor} 30%, transparent), 0 1px 3px rgba(0,0,0,0.08)`
    : "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
  transition: "transform 150ms ease, box-shadow 150ms ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: highlightColor
      ? `0 0 0 2px color-mix(in srgb, ${highlightColor} 40%, transparent), 0 8px 16px rgba(0,0,0,0.12)`
      : "0 8px 16px rgba(0,0,0,0.12)",
  },
  "@media (prefers-reduced-motion: reduce)": {
    transition: "none",
    "&:hover": {
      transform: "none",
    },
  },
}));

const StyledCardMedia = styled(Box)({
  paddingTop: "56.25%",
  objectFit: "contain",
});

export const VideoCard: React.FC<Props> = ({
  video,
  highlight,
  children,
  priority = false,
  thumbnailOverlay,
  isArchive,
}) => {
  const { pushVideo } = useVideoModalContext();
  const { t } = useTranslation("common");
  const platform = video.platform;
  return (
    <Box sx={{ position: "relative" }}>
      {highlight && (
        <StyledHighlightedVideoChip
          highlightColor={highlight.color}
          bold={highlight.bold}
          isLive={highlight.label === "live"}
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
              sizes="(max-width: 600px) 50vw, (max-width: 900px) 50vw, 33vw"
              style={{
                objectFit: "cover",
                ...(isArchive && { filter: "saturate(0.7)", opacity: 0.85 }),
              }}
              priority={priority}
            />
            {video.type === "livestream" && (
              <PlatformIconWrapper>
                <PlatformIcon platform={platform} />
              </PlatformIconWrapper>
            )}
            {thumbnailOverlay}
          </StyledCardMedia>
          {children}
        </CardActionArea>
      </StyledCard>
    </Box>
  );
};
