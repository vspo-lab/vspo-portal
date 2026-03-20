import { Livestream } from "@/features/shared/domain";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  Box,
  CircularProgress,
  IconButton,
  Typography,
  styled,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import React, { forwardRef, useMemo } from "react";
import { generateEmbedUrl } from "../../utils/platformUtils";

const PlayerContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: "200px",
  maxWidth: "100%",
  backgroundColor: "white",
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.gray,
  },
  borderRadius: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  border: "none",
  boxShadow: "none",
  "&:hover .player-header, &:focus-within .player-header": {
    opacity: 1,
  },
  [theme.breakpoints.down("md")]: {
    minHeight: "150px",
  },
}));

const PlayerHeader = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 10,
  backgroundColor: "rgba(0,0,0,0.7)",
  padding: theme.spacing(0.5, 1),
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "grab",
  opacity: 0,
  transition: "opacity 0.2s ease",
  "&:active": {
    cursor: "grabbing",
  },
  "@media (prefers-reduced-motion: reduce)": {
    transition: "none",
  },
}));

const DragHandle = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
  cursor: "grab",
  "&:active": {
    cursor: "grabbing",
  },
  marginRight: theme.spacing(0.5),
  padding: theme.spacing(0.5),
  minWidth: 44,
  minHeight: 44,
}));

const HeaderActions = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 4,
});

const StreamInfo = styled(Box)(({ theme }) => ({
  color: theme.palette.common.white,
  flex: 1,
  minWidth: 0,
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.5)",
  "&:hover": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.2)"
        : "rgba(0, 0, 0, 0.7)",
  },
  marginLeft: theme.spacing(1),
  minWidth: 44,
  minHeight: 44,
}));

const VideoFrame = styled("iframe")({
  width: "100%",
  height: "100%",
  border: "none",
  flex: 1,
});

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: theme.palette.text.primary,
  [theme.getColorSchemeSelector("dark")]: {
    color: "white",
  },
}));

const ErrorContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  color: theme.palette.text.primary,
  padding: theme.spacing(2),
  textAlign: "center",
  [theme.getColorSchemeSelector("dark")]: {
    color: "white",
  },
}));

export type VideoPlayerPresenterProps = {
  stream: Livestream;
  isLoading: boolean;
  hasError: boolean;
  onRemove: () => void;
  onPlayerReady: () => void;
  onPlayerError: () => void;
  autoplay?: boolean;
  muted?: boolean;
};

export const VideoPlayerPresenter = React.memo(forwardRef<
  HTMLIFrameElement,
  VideoPlayerPresenterProps
>(
  (
    {
      stream,
      isLoading,
      hasError,
      onRemove,
      onPlayerReady,
      onPlayerError,
      muted = true,
    },
    ref,
  ) => {
    const { t } = useTranslation("multiview");

    const embedUrl = useMemo((): string => {
      // try-catch: runs during React render — must not throw to avoid unmounting the component tree
      try {
        const parentDomain =
          typeof window !== "undefined"
            ? window.location.hostname
            : "localhost";

        if (stream.platform === "youtube") {
          const videoId =
            stream.videoPlayerLink?.match(/embed\/([^?]+)/)?.[1] ||
            stream.link?.match(/watch\?v=([^&]+)/)?.[1] ||
            stream.id;
          return generateEmbedUrl("youtube", videoId, {
            autoplay: false,
            muted,
            parentDomain,
          });
        }

        if (stream.platform === "twitch") {
          let channelName = "";
          if (stream.videoPlayerLink) {
            const match = stream.videoPlayerLink.match(/channel=([^&]+)/);
            if (match) channelName = match[1];
          }
          if (!channelName && stream.link) {
            const match = stream.link.match(/twitch\.tv\/([^/?]+)/);
            if (match) channelName = match[1];
          }
          if (!channelName) {
            channelName = stream.channelId || stream.id;
          }
          return generateEmbedUrl("twitch", channelName, {
            autoplay: false,
            muted,
            parentDomain,
          });
        }

        if (stream.platform === "twitcasting") {
          const userId = stream.channelId || stream.id;
          return generateEmbedUrl("twitcasting", userId, {
            autoplay: false,
            muted,
          });
        }

        if (stream.platform !== "unknown") {
          const videoId = stream.channelId || stream.id;
          return generateEmbedUrl(stream.platform, videoId, {
            autoplay: false,
            muted,
            parentDomain,
          });
        }

        return "";
      } catch (error) {
        console.error("Error generating embed URL:", error);
        return "";
      }
    }, [stream.id, stream.platform, stream.videoPlayerLink, stream.link, stream.channelId, muted]);


    return (
      <PlayerContainer>
        <PlayerHeader
          className="player-header drag-handle"
          aria-label={t(
            "player.dragHandle.ariaLabel",
            `Drag to move ${stream.channelTitle}'s stream`,
          )}
        >
          <StreamInfo>
            <Typography
              variant="caption"
              noWrap
              sx={{
                fontWeight: 600,
                display: "block",
                fontSize: "0.75rem",
                lineHeight: 1.3,
              }}
            >
              {stream.title}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                display: "block",
                fontSize: "0.65rem",
                opacity: 0.8,
                lineHeight: 1.2,
              }}
            >
              {stream.channelTitle}
            </Typography>
          </StreamInfo>
          <HeaderActions>
            <DragHandle
              size="small"
              className="drag-handle"
              aria-label={t("player.dragHandle.tooltip", "Move stream")}
              title={t("player.dragHandle.tooltip", "Move stream")}
            >
              <DragIndicatorIcon fontSize="small" />
            </DragHandle>
            <CloseButton
              className="no-drag"
              size="small"
              onClick={onRemove}
              aria-label={t("player.close.ariaLabel", "Close stream")}
            >
              <CloseIcon fontSize="small" />
            </CloseButton>
          </HeaderActions>
        </PlayerHeader>

        {hasError || !embedUrl ? (
          <ErrorContainer role="alert">
            <ErrorOutlineIcon sx={{ fontSize: 48, mb: 2, opacity: 0.7 }} />
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t("player.error.title", "Loading error")}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {t("player.error.description", "Failed to load stream")}
            </Typography>
          </ErrorContainer>
        ) : (
          <>
            {isLoading && (
              <LoadingContainer role="status" aria-label={t("player.loading", "Loading stream")}>
                <CircularProgress size={40} />
              </LoadingContainer>
            )}
            <VideoFrame
              ref={ref}
              src={embedUrl}
              title={`${stream.channelTitle} - ${stream.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
              loading="lazy"
              allowFullScreen
              onLoad={onPlayerReady}
              onError={onPlayerError}
              style={{
                visibility: isLoading ? "hidden" : "visible",
              }}
            />
          </>
        )}
      </PlayerContainer>
    );
  },
));

VideoPlayerPresenter.displayName = "VideoPlayerPresenter";
