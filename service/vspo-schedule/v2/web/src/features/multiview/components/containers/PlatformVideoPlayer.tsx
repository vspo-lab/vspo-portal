import { Livestream } from "@/features/shared/domain";
import React, { useState, useCallback, useEffect } from "react";
import { isValidMultiviewUrl } from "../../utils/platformUtils";
import { VideoPlayerPresenter } from "../presenters/VideoPlayerPresenter";

export interface PlatformVideoPlayerProps {
  stream: Livestream;
  index: number;
  onRemove: () => void;
  onError?: (error: Error, stream: Livestream) => void;
  onLoad?: (stream: Livestream) => void;
  // Player configuration
  autoplay?: boolean;
  muted?: boolean;
  showPlatformWarnings?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
}

interface PlayerState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  retryCount: number;
  isRetrying: boolean;
}

export const PlatformVideoPlayer: React.FC<PlatformVideoPlayerProps> = ({
  stream,
  onRemove,
  onError,
  onLoad,
  autoplay = true,
  muted = true,
  retryOnError = true,
  maxRetries = 3,
}) => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isLoading: true,
    hasError: false,
    retryCount: 0,
    isRetrying: false,
  });

  const isUnsupportedPlatform = stream.platform === "unknown";

  // Validate stream compatibility on mount
  useEffect(() => {
    const validateStream = () => {
      if (isUnsupportedPlatform) {
        setPlayerState((prev) => ({
          ...prev,
          hasError: true,
          errorMessage: "Unsupported platform",
          isLoading: false,
        }));
        return;
      }

      // Check if we have a valid video link or player link
      const hasValidUrl = stream.videoPlayerLink || stream.link;
      if (!hasValidUrl) {
        setPlayerState((prev) => ({
          ...prev,
          hasError: true,
          errorMessage: "No video URL available",
          isLoading: false,
        }));
        return;
      }

      // Validate URL format if using link
      if (stream.link && !stream.videoPlayerLink) {
        const isValid = isValidMultiviewUrl(stream.link);
        if (!isValid) {
          setPlayerState((prev) => ({
            ...prev,
            hasError: true,
            errorMessage: "Invalid video URL format",
            isLoading: false,
          }));
          return;
        }
      }
    };

    validateStream();
  }, [stream, isUnsupportedPlatform]);

  const handlePlayerReady = useCallback(() => {
    setPlayerState((prev) => ({
      ...prev,
      isLoading: false,
      hasError: false,
      isRetrying: false,
    }));
    onLoad?.(stream);
  }, [onLoad, stream]);

  const handlePlayerError = useCallback(() => {
    const error = new Error(
      `Failed to load video player for ${stream.platform} stream: ${stream.title}`,
    );

    // If we haven't exceeded max retries and retry is enabled
    if (retryOnError && playerState.retryCount < maxRetries) {
      setPlayerState((prev) => ({
        ...prev,
        isRetrying: true,
        retryCount: prev.retryCount + 1,
      }));

      // Retry after a short delay
      setTimeout(
        () => {
          setPlayerState((prev) => ({
            ...prev,
            isLoading: true,
            hasError: false,
            isRetrying: false,
          }));
        },
        1000 * (playerState.retryCount + 1),
      ); // Exponential backoff
    } else {
      // Set error state
      setPlayerState((prev) => ({
        ...prev,
        isLoading: false,
        hasError: true,
        errorMessage: "Failed to load video player",
        isRetrying: false,
      }));
      onError?.(error, stream);
    }
  }, [retryOnError, playerState.retryCount, maxRetries, onError, stream]);

  const handleRemove = useCallback(() => {
    onRemove();
  }, [onRemove]);

  // Show loading state during retry
  const isLoading = playerState.isLoading || playerState.isRetrying;
  const hasError = playerState.hasError && !playerState.isRetrying;

  return (
    <VideoPlayerPresenter
      stream={stream}
      isLoading={isLoading}
      hasError={hasError}
      onRemove={handleRemove}
      onPlayerReady={handlePlayerReady}
      onPlayerError={handlePlayerError}
      autoplay={autoplay}
      muted={muted}
    />
  );
};

export default PlatformVideoPlayer;
