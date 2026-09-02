"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Box, Card, CardActionArea, IconButton, Tooltip } from "@mui/material";
import { styled, type Theme } from "@mui/material/styles";
import Image from "next/image";
import { useTranslations } from "next-intl";
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
  position: "relative",
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

/**
 * `link` is an unconstrained string on `videoSchema`, so an unexpected value could put a
 * `javascript:` or `data:` URL into `href`. Allowlist absolute http(s) URLs instead.
 */
const HTTP_URL_PATTERN = /^https?:\/\//i;

/**
 * Mirrors the thumbnail box so the watch link can be anchored to it while living
 * outside `CardActionArea` (an anchor may not be nested inside a button).
 * Transparent to pointer events so the thumbnail still opens the detail modal.
 */
const WatchLinkOverlay = styled(Box)({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  aspectRatio: "16 / 9",
  pointerEvents: "none",
  zIndex: 2,
});

/**
 * Styles for the watch link. Declared as `sx` rather than `styled()` because
 * `IconButton` must keep its overridable typing to accept anchor props.
 */
const watchLinkButtonSx = (theme: Theme) => ({
  position: "absolute",
  right: "8px",
  bottom: "8px",
  pointerEvents: "auto",
  gap: "4px",
  padding: "3px 8px 3px 6px",
  minWidth: "24px",
  minHeight: "24px",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 600,
  lineHeight: 1.4,
  // Background stays white in both color schemes, so the text color must not
  // follow the color scheme (dark mode would otherwise render white-on-white).
  color: theme.vars.palette.common.black,
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  boxShadow: theme.shadows[2],
  "&:hover": {
    backgroundColor: "rgb(255, 255, 255)",
  },
  [theme.breakpoints.down("sm")]: {
    right: "4px",
    bottom: "4px",
    padding: "2px 6px 2px 4px",
    fontSize: "0.7rem",
  },
});

/**
 * Thumbnail card for a video, with two independent targets: the card body opens the
 * detail modal, and the watch link opens `video.link` on its source platform in a new tab.
 *
 * @precondition Must be rendered inside a `VideoModalContext` provider.
 * @postcondition Renders the watch link only when `video.link` is an absolute http(s) URL.
 * Clicking the watch link never opens the detail modal.
 * @remarks Rendering is idempotent -- the component holds no state of its own.
 */
export const VideoCard: React.FC<Props> = ({
  video,
  highlight,
  children,
  priority = false,
}) => {
  const { pushVideo } = useVideoModalContext();
  const t = useTranslations("common");
  const platform = video.platform;
  const watchLabel = t(`videoCard.watchOn.${platform}`);
  const watchUrl = HTTP_URL_PATTERN.test(video.link) ? video.link : undefined;
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
              sizes="(max-width: 600px) 50vw, (max-width: 900px) 50vw, 33vw"
              style={{ objectFit: "cover" }}
              priority={priority}
            />
            {video.type === "livestream" && (
              <PlatformIconWrapper aria-hidden>
                <PlatformIcon platform={platform} />
              </PlatformIconWrapper>
            )}
          </StyledCardMedia>
          {children}
        </CardActionArea>
        {watchUrl && (
          <WatchLinkOverlay>
            <Tooltip title={watchLabel}>
              <IconButton
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={watchLabel}
                sx={watchLinkButtonSx}
              >
                {platform === "unknown" ? (
                  <OpenInNewIcon sx={{ fontSize: "18px" }} />
                ) : (
                  <PlatformIcon platform={platform} />
                )}
                {t("videoCard.watch")}
              </IconButton>
            </Tooltip>
          </WatchLinkOverlay>
        )}
      </StyledCard>
    </Box>
  );
};
