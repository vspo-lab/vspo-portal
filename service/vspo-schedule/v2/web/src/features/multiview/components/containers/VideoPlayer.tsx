import { Livestream } from "@/features/shared/domain";
import React, {
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import {
  VideoPlayerRef,
  usePlaybackContext,
} from "../../context/PlaybackContext";
import { VideoPlayerPresenter } from "../presenters";

export type VideoPlayerProps = {
  stream: Livestream;
  onRemove: () => void;
  index: number;
};

const VideoPlayerComponent = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ stream, onRemove, index }, ref) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(index !== 0);
    const [volume, setVolume] = useState<number>(index === 0 ? 0.7 : 0.3);
    const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { registerPlayer, unregisterPlayer } = usePlaybackContext();

    const toggleFullscreen = useCallback(() => {
      if (iframeRef.current) {
        if (!document.fullscreenElement) {
          iframeRef.current.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    }, []);

    const postMessageToPlayer = useCallback(
      (command: string, args?: unknown) => {
        if (!isPlayerReady && command !== "pauseVideo") {
          return;
        }

        if (iframeRef.current && iframeRef.current.contentWindow) {
          if (stream.platform === "youtube") {
            const message = {
              event: "command",
              func: command,
              args: args || [],
            };
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify(message),
              "https://www.youtube.com",
            );
          } else if (stream.platform === "twitch") {
            const twitchMessage = {
              namespace: "twitch-everywhere",
              eventName: "",
              params: {} as Record<string, unknown>,
            };

            if (command === "playVideo") {
              twitchMessage.eventName = "play";
            } else if (command === "pauseVideo") {
              twitchMessage.eventName = "pause";
            } else if (command === "mute") {
              twitchMessage.eventName = "mute";
            } else if (command === "unmute") {
              twitchMessage.eventName = "unmute";
            } else if (command === "setVolume") {
              const volumeValue = Array.isArray(args)
                ? (args[0] as number) / 100
                : 0;
              twitchMessage.eventName = "volume";
              twitchMessage.params = { volume: volumeValue };
            }

            if (twitchMessage.eventName) {
              iframeRef.current.contentWindow.postMessage(
                twitchMessage,
                "https://player.twitch.tv",
              );
            }
          }
        }
      },
      [stream.platform, isPlayerReady],
    );

    // Single player interface — shared between imperative handle and context registration
    const playerInterfaceRef = useRef<VideoPlayerRef>(null!);
    playerInterfaceRef.current = {
      play: () => postMessageToPlayer("playVideo"),
      pause: () => postMessageToPlayer("pauseVideo"),
      setVolume: (newVolume: number) => {
        setVolume(newVolume);
        postMessageToPlayer("setVolume", [newVolume * 100]);
      },
      mute: () => {
        setIsMuted(true);
        postMessageToPlayer("mute");
      },
      unmute: () => {
        setIsMuted(false);
        postMessageToPlayer("unmute");
      },
      getState: () => ({ isMuted, volume }),
      toggleFullscreen,
      syncToLive: () => postMessageToPlayer("seekTo", [9999999, true]),
    };

    useImperativeHandle(ref, () => playerInterfaceRef.current, [
      postMessageToPlayer,
      toggleFullscreen,
      isMuted,
      volume,
    ]);

    // Register player once on mount, unregister on unmount
    // Use a stable wrapper that reads from the ref so registration doesn't re-fire
    useEffect(() => {
      const stablePlayer: VideoPlayerRef = {
        play: () => playerInterfaceRef.current.play(),
        pause: () => playerInterfaceRef.current.pause(),
        setVolume: (v) => playerInterfaceRef.current.setVolume(v),
        mute: () => playerInterfaceRef.current.mute(),
        unmute: () => playerInterfaceRef.current.unmute(),
        getState: () => playerInterfaceRef.current.getState(),
        toggleFullscreen: () =>
          playerInterfaceRef.current.toggleFullscreen(),
        syncToLive: () => playerInterfaceRef.current.syncToLive(),
      };
      registerPlayer(stream.id, stablePlayer);
      return () => {
        unregisterPlayer(stream.id);
      };
    }, [stream.id, registerPlayer, unregisterPlayer]);

    useEffect(() => {
      setIsLoading(true);
      setHasError(false);
    }, [stream.id]);

    // Pause player when tab becomes hidden to save resources
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          postMessageToPlayer("pauseVideo");
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }, [postMessageToPlayer]);

    const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handlePlayerReady = useCallback(() => {
      setIsLoading(false);

      // Clear any pending timeout from a previous ready call
      if (readyTimeoutRef.current !== null) {
        clearTimeout(readyTimeoutRef.current);
      }

      readyTimeoutRef.current = setTimeout(() => {
        readyTimeoutRef.current = null;
        setIsPlayerReady(true);

        if (iframeRef.current) {
          postMessageToPlayer("setVolume", [volume * 100]);
          if (isMuted) {
            postMessageToPlayer("mute");
          }
          postMessageToPlayer("pauseVideo");
        }
      }, 1500);
    }, [postMessageToPlayer, volume, isMuted]);

    // Clean up the ready timeout on unmount
    useEffect(() => {
      return () => {
        if (readyTimeoutRef.current !== null) {
          clearTimeout(readyTimeoutRef.current);
        }
      };
    }, []);

    const handlePlayerError = useCallback(() => {
      setIsLoading(false);
      setHasError(true);
    }, []);

    const handleRemove = useCallback(() => {
      onRemove();
    }, [onRemove]);

    const handleIframeRef = useCallback((element: HTMLIFrameElement | null) => {
      iframeRef.current = element;
    }, []);

    return (
      <VideoPlayerPresenter
        ref={handleIframeRef}
        stream={stream}
        isLoading={isLoading}
        hasError={hasError}
        onRemove={handleRemove}
        onPlayerReady={handlePlayerReady}
        onPlayerError={handlePlayerError}
        autoplay={false}
        muted={isMuted}
      />
    );
  },
);

VideoPlayerComponent.displayName = "VideoPlayer";

export const VideoPlayer = React.memo(VideoPlayerComponent);
