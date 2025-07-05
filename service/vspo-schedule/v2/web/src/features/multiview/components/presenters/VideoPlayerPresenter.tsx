import type { Livestream } from "@/features/shared/domain";
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
import React, { forwardRef } from "react";
import { generateEmbedUrl } from "../../utils/platformUtils";

const PlayerContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: "200px",
  maxWidth: "100%",
  backgroundColor: "white",
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.2s ease, opacity 0.2s ease",
  border: "2px solid transparent",
  boxShadow: theme.shadows[1],
  [theme.breakpoints.down("md")]: {
    minHeight: "150px",
  },
  "&:hover .player-header": {
    opacity: 1,
  },
  [theme.getColorSchemeSelector("dark")]: {
    backgroundColor: theme.vars.palette.customColors.darkGray,
  },
}));

const PlayerHeader = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 10,
  background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)",
  padding: theme.spacing(1),
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  opacity: 0,
  transition: "opacity 0.3s ease",
}));

const DragHandle = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.5)",
  cursor: "grab",
  "&:hover": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.2)"
        : "rgba(0, 0, 0, 0.7)",
  },
  "&:active": {
    cursor: "grabbing",
  },
  marginRight: theme.spacing(0.5),
  padding: theme.spacing(0.5),
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

export const VideoPlayerPresenter = forwardRef<
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

    const getEmbedUrl = (stream: Livestream): string => {
      try {
        // Generate embed URL with API control enabled
        if (stream.platform === "youtube") {
          const videoId =
            stream.videoPlayerLink?.match(/embed\/([^?]+)/)?.[1] ||
            stream.link?.match(/watch\?v=([^&]+)/)?.[1] ||
            stream.id;
          // Enable YouTube iframe API with proper parameters
          return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&autoplay=0&mute=${muted ? 1 : 0}&controls=1&modestbranding=1`;
        }
        if (stream.platform === "twitch") {
          // Extract channel name from different sources
          let channelName = "";

          // Try to extract from videoPlayerLink first
          if (stream.videoPlayerLink) {
            const match = stream.videoPlayerLink.match(/channel=([^&]+)/);
            if (match) {
              channelName = match[1];
            }
          }

          // If not found, try link property
          if (!channelName && stream.link) {
            const match = stream.link.match(/twitch\.tv\/([^/?]+)/);
            if (match) {
              channelName = match[1];
            }
          }

          // Fallback to channelId or id
          if (!channelName) {
            channelName = stream.channelId || stream.id;
          }

          // Debug info removed for production

          // Enable Twitch iframe API with proper parent domain
          const parentDomain = window.location.hostname;
          return `https://player.twitch.tv/?channel=${channelName}&parent=${parentDomain}&autoplay=false&muted=${muted}&controls=true`;
        }

        // Fallback to generating embed URL using platform utilities
        if (stream.platform !== "unknown") {
          const videoId = stream.channelId || stream.id;
          return generateEmbedUrl(stream.platform, videoId, {
            autoplay: false, // Never autoplay
            muted,
            parentDomain:
              typeof window !== "undefined"
                ? window.location.hostname
                : "localhost",
          });
        }

        // Final fallback to the link property
        return stream.link || "";
      } catch (error) {
        console.error("Error generating embed URL:", error);
        return stream.link || "";
      }
    };

    const truncateTitle = (title: string, maxLength = 40) => {
      return title.length > maxLength
        ? `${title.substring(0, maxLength)}...`
        : title;
    };

    return (
      <PlayerContainer
        // biome-ignore lint/a11y/useSemanticElements: This container needs to be draggable which requires a div
        role="button"
        aria-label={t(
          "player.dragHandle.ariaLabel",
          `${stream.channelTitle}の配信をドラッグして移動`,
        )}
        tabIndex={0}
      >
        <PlayerHeader className="player-header">
          <StreamInfo>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                display: "block",
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              {stream.channelTitle}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                opacity: 0.9,
                display: "block",
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                fontSize: "0.75rem",
              }}
            >
              {truncateTitle(stream.title)}
            </Typography>
          </StreamInfo>
          <HeaderActions>
            <DragHandle
              size="small"
              className="drag-handle"
              aria-label={t("player.dragHandle.tooltip", "配信を移動")}
              title={t("player.dragHandle.tooltip", "配信を移動")}
            >
              <DragIndicatorIcon fontSize="small" />
            </DragHandle>
            <CloseButton size="small" onClick={onRemove}>
              <CloseIcon fontSize="small" />
            </CloseButton>
          </HeaderActions>
        </PlayerHeader>

        {hasError ? (
          <ErrorContainer>
            <ErrorOutlineIcon sx={{ fontSize: 48, mb: 2, opacity: 0.7 }} />
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t("player.error.title", "読み込みエラー")}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {t("player.error.description", "配信の読み込みに失敗しました")}
            </Typography>
          </ErrorContainer>
        ) : (
          <>
            {isLoading && (
              <LoadingContainer>
                <CircularProgress size={40} />
              </LoadingContainer>
            )}
            <VideoFrame
              ref={ref}
              src={getEmbedUrl(stream)}
              title={`${stream.channelTitle} - ${stream.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              onLoad={onPlayerReady}
              onError={onPlayerError}
              style={{ display: isLoading ? "none" : "block" }}
            />
          </>
        )}
      </PlayerContainer>
    );
  },
);

VideoPlayerPresenter.displayName = "VideoPlayerPresenter";
